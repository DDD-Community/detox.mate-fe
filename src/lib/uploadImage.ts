import { createAppError } from '../api/errors';
import { PresignedUrlRequestUploadPurpose } from '../api/generated/model';
import type { PresignedUrlResponse } from '../api/generated/model';
import { customAxios } from '../api/mutator';

export const SUPPORTED_IMAGE_FORMAT_LABEL = 'JPG, PNG, HEIC';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
]);

const IMAGE_MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
};

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export class UnsupportedImageFormatError extends Error {
  constructor() {
    super(`${SUPPORTED_IMAGE_FORMAT_LABEL} 형식의 정적 이미지만 업로드할 수 있습니다.`);
    this.name = 'UnsupportedImageFormatError';
    Object.setPrototypeOf(this, UnsupportedImageFormatError.prototype);
  }
}

const getExtension = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const normalizedValue = value.split('?')[0]?.split('#')[0];
  const lastSegment = normalizedValue?.split('/').pop();
  const extension = lastSegment?.split('.').pop()?.toLowerCase();
  return extension && extension !== lastSegment ? extension : undefined;
};

const getLastPathSegment = (uri: string): string | undefined => {
  const normalizedUri = uri.split('?')[0]?.split('#')[0];
  const segment = normalizedUri?.split('/').pop();
  return segment || undefined;
};

const normalizeImageMimeType = (mimeType?: string | null): string | undefined => {
  const normalizedMimeType = mimeType?.toLowerCase();
  if (!normalizedMimeType || !ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) return undefined;
  return normalizedMimeType === 'image/jpg' ? 'image/jpeg' : normalizedMimeType;
};

const getImageMimeTypeFromExtension = (value?: string | null): string | undefined => {
  const extension = getExtension(value);
  return extension ? IMAGE_MIME_TYPE_BY_EXTENSION[extension] : undefined;
};

const assertSupportedImageExtension = (value?: string | null) => {
  const extension = getExtension(value);
  if (extension && !IMAGE_MIME_TYPE_BY_EXTENSION[extension]) {
    throw new UnsupportedImageFormatError();
  }
};

const resolveImageContentType = ({
  fileName,
  imageUri,
  mimeType,
}: {
  fileName?: string | null;
  imageUri: string;
  mimeType?: string | null;
}): string => {
  assertSupportedImageExtension(fileName);

  const normalizedMimeType = normalizeImageMimeType(mimeType);
  if (normalizedMimeType) return normalizedMimeType;

  const fileNameContentType = getImageMimeTypeFromExtension(fileName);
  if (fileNameContentType) return fileNameContentType;

  assertSupportedImageExtension(imageUri);

  const contentType = getImageMimeTypeFromExtension(imageUri);
  if (!contentType) throw new UnsupportedImageFormatError();

  return contentType;
};

const resolveImageFileName = ({
  contentType,
  fileName,
  imageUri,
}: {
  contentType: string;
  fileName?: string | null;
  imageUri: string;
}): string => {
  const fallbackExtension = IMAGE_EXTENSION_BY_MIME_TYPE[contentType] ?? 'jpg';
  const fallbackFileName = `image.${fallbackExtension}`;
  const resolvedFileName = fileName ?? getLastPathSegment(imageUri) ?? fallbackFileName;

  return getExtension(resolvedFileName) ? resolvedFileName : fallbackFileName;
};

export async function uploadImage(
  imageUri: string,
  options?: {
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    uploadPurpose?: PresignedUrlRequestUploadPurpose;
  }
): Promise<string> {
  const contentType = resolveImageContentType({
    fileName: options?.fileName,
    imageUri,
    mimeType: options?.mimeType,
  });
  const fileName = resolveImageFileName({
    contentType,
    fileName: options?.fileName,
    imageUri,
  });
  const fileSize = options?.fileSize ?? 0;
  const uploadPurpose =
    options?.uploadPurpose ?? PresignedUrlRequestUploadPurpose.ACTIVITY_RECORD_IMAGE;

  const { uploadUrl, objectKey } = await customAxios<PresignedUrlResponse>(
    {
      url: '/uploads/presigned-urls',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        fileName,
        contentType,
        fileSize,
        uploadPurpose,
      },
    },
    {
      errorPolicy: { presentation: 'dialog', context: 'upload.presignedUrl' },
      retryPolicy: 'none',
      skipGlobalError: true,
    }
  );

  if (!uploadUrl || !objectKey) {
    throw createAppError({
      type: 'upload',
      code: 'PRESIGNED_URL_MISSING',
      message: 'presigned URL을 발급받지 못했습니다',
    });
  }

  let blob: Blob;
  try {
    const fileResponse = await fetch(imageUri);
    blob = await fileResponse.blob();
  } catch (error) {
    throw createAppError({
      type: 'upload',
      code: 'LOCAL_IMAGE_READ_FAILED',
      message: '이미지 파일을 불러오지 못했습니다',
      originalError: error,
    });
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
  } catch (error) {
    throw createAppError({
      type: 'upload',
      code: 'UPLOAD_NETWORK_FAILED',
      message: '이미지 업로드에 실패했습니다',
      originalError: error,
      retriable: true,
    });
  }

  if (!uploadResponse.ok) {
    throw createAppError({
      type: 'upload',
      code: 'UPLOAD_FAILED',
      status: uploadResponse.status,
      message: '이미지 업로드에 실패했습니다',
    });
  }

  return objectKey;
}
