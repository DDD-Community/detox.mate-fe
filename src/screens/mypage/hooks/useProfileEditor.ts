import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Keyboard, Linking } from 'react-native';

import { getUser, PresignedUrlRequestUploadPurpose, type UpdateMyProfileRequest } from '@/api';
import { getUserErrorMessage, logError, normalizeError } from '@/api/errors';
import { trackEvent } from '@/lib/analytics';
import { goBackOrReplace } from '@/lib/navigation';
import {
  SUPPORTED_IMAGE_FORMAT_LABEL,
  UnsupportedImageFormatError,
  uploadImage,
} from '@/lib/uploadImage';
import { useNetworkErrorToastStore } from '@/stores/networkErrorToastStore';
import { sanitizeProfileName } from '../utils/profileRules';
import { getMyProfileQueryOptions } from './useMyProfilePageData';

// iOS Modal이 닫히는 애니메이션 중에 네이티브 picker를 열면 즉시 닫히는 문제가 있어 잠시 기다린다.
const PICKER_OPEN_DELAY_MS = 300;
// 앱 전역 인터셉터가 이미 토스트로 안내하는 오류 유형. 같은 실패를 두 번 안내하지 않는다.
const GLOBALLY_TOASTED_ERROR_TYPES = ['network', 'timeout', 'server'];

type PhotoDraft =
  | { kind: 'unchanged' }
  | { kind: 'default' }
  | { kind: 'gallery'; asset: ImagePicker.ImagePickerAsset };

interface SavedProfile {
  displayName: string;
  profileImageUrl: string | null;
}

export function useProfileEditor(saved: SavedProfile) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(saved.displayName);
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: 'unchanged' });
  const [photoDialogVisible, setPhotoDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // 저장 전에는 편집 화면에서만 미리보기로 보여주고 다른 화면에는 반영하지 않는다.
  const previewImageUri =
    photo.kind === 'gallery'
      ? photo.asset.uri
      : photo.kind === 'default'
        ? null
        : saved.profileImageUrl;

  const changeName = (input: string) => setName(sanitizeProfileName(input));

  const selectDefaultPhoto = () => {
    setPhotoDialogVisible(false);
    setPhoto({ kind: 'default' });
  };

  const selectGalleryPhoto = async () => {
    setPhotoDialogVisible(false);
    await new Promise<void>((resolve) => setTimeout(resolve, PICKER_OPEN_DELAY_MS));
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('사진 접근 권한이 필요해요', '설정에서 사진 접근을 허용해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      // 크롭 단계 없이 선택한 사진을 그대로 적용한다.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets[0]) return;
      setPhoto({ kind: 'gallery', asset: result.assets[0] });
    } catch (failure) {
      logError(normalizeError(failure), { scope: 'api', operation: 'profile.photo.pick' });
      Alert.alert('사진을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      // 이름을 비운 채 저장하면 기존 이름을 유지한다.
      const nameChanged = name.length > 0 && name !== saved.displayName;
      const request: UpdateMyProfileRequest = {};
      if (nameChanged) request.displayName = name;
      if (photo.kind === 'default') request.profileImageObjectKey = null;
      if (photo.kind === 'gallery') {
        request.profileImageObjectKey = await uploadImage(photo.asset.uri, {
          uploadPurpose: PresignedUrlRequestUploadPurpose.PROFILE_IMAGE,
          fileName: photo.asset.fileName,
          mimeType: photo.asset.mimeType,
          fileSize: photo.asset.fileSize,
        });
      }

      // 변경 사항이 없어도 저장할 수 있으며 이때는 요청 없이 닫는다.
      if (Object.keys(request).length > 0) {
        await getUser().updateMe(request);
        trackEvent('My Profile Updated', {
          changed_name: nameChanged,
          changed_image: photo.kind !== 'unchanged',
        });
        await queryClient.invalidateQueries({
          queryKey: getMyProfileQueryOptions().queryKey,
          exact: true,
        });
      }
      goBackOrReplace('/(tabs)/mypage');
    } catch (failure) {
      if (failure instanceof UnsupportedImageFormatError) {
        Alert.alert(
          '지원하지 않는 이미지 형식이에요',
          `${SUPPORTED_IMAGE_FORMAT_LABEL} 형식의 정적 이미지만 선택해 주세요.`
        );
        return;
      }
      const error = normalizeError(failure);
      logError(error, { scope: 'api', operation: 'profile.update' });
      if (!GLOBALLY_TOASTED_ERROR_TYPES.includes(error.type)) {
        useNetworkErrorToastStore.getState().showMessage(getUserErrorMessage(error));
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return {
    name,
    previewImageUri,
    photoDialogVisible,
    saving,
    changeName,
    openPhotoDialog: () => setPhotoDialogVisible(true),
    closePhotoDialog: () => setPhotoDialogVisible(false),
    selectDefaultPhoto,
    selectGalleryPhoto,
    save,
  };
}
