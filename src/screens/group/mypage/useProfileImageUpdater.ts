import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { getUser, PresignedUrlRequestUploadPurpose } from '@/api';
import { uploadImage } from '@/lib/uploadImage';

export const DEFAULT_PROFILE_IMAGE_OBJECT_KEY = 'static/turtle-hi.png';
const CLEAR_PROFILE_IMAGE_OBJECT_KEY = '';

const IMAGE_PICKER_OPEN_DELAY_MS = 300;

export function useProfileImageUpdater() {
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  // null이면 로컬 기본 이미지, 그 외엔 서버 URL/로컬 URI
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);

  const openImageSheet = () => {
    setIsImageSheetOpen(true);
  };

  const closeImageSheet = () => {
    setIsImageSheetOpen(false);
  };

  const selectDefaultImage = async () => {
    setIsImageSheetOpen(false);
    if (isUpdatingProfileImage) return;

    const previous = profileImageUri;
    setProfileImageUri(null);
    setIsUpdatingProfileImage(true);

    try {
      const response = await getUser().updateMe({
        profileImageObjectKey: CLEAR_PROFILE_IMAGE_OBJECT_KEY,
      });
      // eslint-disable-next-line no-console
      console.log('[default-image] response', response);
      setProfileImageUri(response.profileImageUrl ?? null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        '[default-image] failed',
        (e as { response?: { data?: unknown } })?.response?.data ?? e
      );
      setProfileImageUri(previous);
      // TODO: 에러 토스트
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  const selectGalleryImage = async () => {
    setIsImageSheetOpen(false);
    // iOS Modal dismiss animation이 끝나기 전에 native picker를 띄우면
    // presentation 충돌로 picker가 즉시 닫혀버림. 짧게 대기.
    await new Promise<void>((resolve) => setTimeout(resolve, IMAGE_PICKER_OPEN_DELAY_MS));

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    if (isUpdatingProfileImage) return;

    const asset = result.assets[0];
    const previous = profileImageUri;
    setProfileImageUri(asset.uri);
    setIsUpdatingProfileImage(true);

    try {
      const objectKey = await uploadImage(asset.uri, {
        uploadPurpose: PresignedUrlRequestUploadPurpose.PROFILE_IMAGE,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
      const response = await getUser().updateMe({ profileImageObjectKey: objectKey });
      setProfileImageUri(response.profileImageUrl ?? asset.uri);
    } catch (e) {
      setProfileImageUri(previous);
      // TODO: 에러 토스트
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  return {
    isImageSheetOpen,
    profileImageUri,
    isUpdatingProfileImage,
    setProfileImageUri,
    openImageSheet,
    closeImageSheet,
    selectDefaultImage,
    selectGalleryImage,
  };
}
