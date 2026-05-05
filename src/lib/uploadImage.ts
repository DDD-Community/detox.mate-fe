import * as SecureStore from 'expo-secure-store';
import { PresignedUrlRequestUploadPurpose } from '../api/generated/model';
import { getUpload } from '../api/generated/upload/upload';

export async function uploadImage(
  imageUri: string,
  options?: { fileName?: string | null; mimeType?: string | null; fileSize?: number | null }
): Promise<string> {
  const userIdStr = await SecureStore.getItemAsync('currentUserId');
  const userId = userIdStr ? parseInt(userIdStr, 10) : 0;

  const fileName = options?.fileName ?? imageUri.split('/').pop() ?? 'image.jpg';
  const contentType = options?.mimeType ?? 'image/jpeg';
  const fileSize = options?.fileSize ?? 0;

  const { issuePresignedUrl } = getUpload();
  const { uploadUrl, objectKey } = await issuePresignedUrl(
    {
      fileName,
      contentType,
      fileSize,
      uploadPurpose: PresignedUrlRequestUploadPurpose.ACTIVITY_RECORD_IMAGE,
    },
    { currentUser: { id: userId } }
  );

  if (!uploadUrl || !objectKey) {
    throw new Error('presigned URL을 발급받지 못했습니다');
  }

  const fileResponse = await fetch(imageUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error('이미지 업로드에 실패했습니다');
  }

  return objectKey;
}
