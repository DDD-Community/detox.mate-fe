// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyProfileQueryOptions } from './useMyProfilePageData';
import { useProfileEditor } from './useProfileEditor';

const mocks = vi.hoisted(() => ({
  UnsupportedImageFormatError: class UnsupportedImageFormatError extends Error {},
  updateMe: vi.fn(),
  uploadImage: vi.fn(),
  requestPermission: vi.fn(),
  launchPicker: vi.fn(),
  alert: vi.fn(),
  openSettings: vi.fn(),
  goBack: vi.fn(),
  track: vi.fn(),
  logError: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/api', () => ({
  getUser: () => ({ updateMe: mocks.updateMe }),
  getGetFriendsSuspenseQueryOptions: vi.fn(),
  PresignedUrlRequestUploadPurpose: { PROFILE_IMAGE: 'PROFILE_IMAGE' },
}));
vi.mock('@/api/errors', () => ({
  getUserErrorMessage: (error: Error) => error.message,
  logError: mocks.logError,
  normalizeError: (error: Error & { type?: string }) => ({
    type: error.type ?? 'unknown',
    message: error.message,
  }),
}));
vi.mock('@/lib/uploadImage', () => ({
  SUPPORTED_IMAGE_FORMAT_LABEL: 'JPG, PNG, HEIC',
  UnsupportedImageFormatError: mocks.UnsupportedImageFormatError,
  uploadImage: mocks.uploadImage,
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: mocks.track }));
vi.mock('@/lib/navigation', () => ({ goBackOrReplace: mocks.goBack }));
vi.mock('@/stores/networkErrorToastStore', () => ({
  useNetworkErrorToastStore: { getState: () => ({ showMessage: mocks.showToast }) },
}));
vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: mocks.requestPermission,
  launchImageLibraryAsync: mocks.launchPicker,
}));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Keyboard: { dismiss: vi.fn() },
  Linking: { openSettings: mocks.openSettings },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];

const SAVED = { displayName: '홍길동', profileImageUrl: 'https://img.test/old.png' };
const PICKED_ASSET = {
  uri: 'file:///picked.png',
  fileName: 'picked.png',
  mimeType: 'image/png',
  fileSize: 1234,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (failure: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.updateMe.mockResolvedValue({});
  mocks.uploadImage.mockResolvedValue('profile-images/1/new.png');
  mocks.requestPermission.mockResolvedValue({ granted: true });
  mocks.launchPicker.mockResolvedValue({ canceled: false, assets: [PICKED_ASSET] });
});
afterEach(async () => {
  vi.useRealTimers();
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
});

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(getMyProfileQueryOptions().queryKey, {
    id: 1,
    displayName: SAVED.displayName,
    userCode: 'ABCDE',
    profileImageUrl: SAVED.profileImageUrl,
    pushNotificationEnabled: true,
  });
  let current!: ReturnType<typeof useProfileEditor>;
  function Harness() {
    current = useProfileEditor(SAVED);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  cleanups.push(() => {
    root.unmount();
    client.clear();
  });
  await act(() => {
    root.render(createElement(QueryClientProvider, { client }, createElement(Harness)));
  });
  return {
    client,
    get editor() {
      return current;
    },
  };
}

// 갤러리 선택은 iOS 모달이 닫힌 뒤 picker를 열기 위해 짧게 기다리므로 타이머를 제어한다.
async function pickFromGallery(screen: { editor: ReturnType<typeof useProfileEditor> }) {
  vi.useFakeTimers();
  await act(async () => {
    const picking = screen.editor.selectGalleryPhoto();
    await vi.advanceTimersByTimeAsync(300);
    await picking;
  });
  vi.useRealTimers();
}

describe('프로필 편집 저장', () => {
  it('변경 사항이 없으면 서버에 쓰지 않고 화면만 닫는다', async () => {
    const screen = await setup();
    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
    expect(mocks.goBack).toHaveBeenCalledTimes(1);
  });

  it('이름만 바꾸면 이름만 보내고 성공 후 내 프로필 캐시를 무효화한다', async () => {
    const screen = await setup();
    await act(() => screen.editor.changeName('가 나다라마바'));
    expect(screen.editor.name).toBe('가나다라마');

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).toHaveBeenCalledWith({ displayName: '가나다라마' });
    expect(mocks.track).toHaveBeenCalledWith('My Profile Updated', {
      changed_name: true,
      changed_image: false,
    });
    expect(screen.client.getQueryState(getMyProfileQueryOptions().queryKey)?.isInvalidated).toBe(
      true
    );
    expect(mocks.goBack).toHaveBeenCalledTimes(1);
  });

  it('이름을 비운 채 저장하면 기존 이름을 유지한다', async () => {
    const screen = await setup();
    await act(() => screen.editor.changeName(''));
    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(mocks.goBack).toHaveBeenCalledTimes(1);
  });

  it('갤러리 사진은 저장 전에 서버에 쓰지 않고, 저장하면 업로드한 키만 보낸다', async () => {
    const screen = await setup();
    await pickFromGallery(screen);
    expect(screen.editor.previewImageUri).toBe(PICKED_ASSET.uri);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
    expect(mocks.updateMe).not.toHaveBeenCalled();

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.uploadImage).toHaveBeenCalledTimes(1);
    expect(mocks.updateMe).toHaveBeenCalledWith({
      profileImageObjectKey: 'profile-images/1/new.png',
    });
    expect(mocks.track).toHaveBeenCalledWith('My Profile Updated', {
      changed_name: false,
      changed_image: true,
    });
  });

  it('기본 이미지로 바꾸면 저장할 때 이미지 키를 null로 보낸다', async () => {
    const screen = await setup();
    await act(() => screen.editor.selectDefaultPhoto());
    expect(screen.editor.previewImageUri).toBeNull();
    expect(mocks.updateMe).not.toHaveBeenCalled();

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).toHaveBeenCalledWith({ profileImageObjectKey: null });
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it('저장 중 다시 눌러도 쓰기는 한 번만 보낸다', async () => {
    const pending = deferred<Record<string, never>>();
    mocks.updateMe.mockReturnValueOnce(pending.promise);
    const screen = await setup();
    await act(() => screen.editor.changeName('새이름'));

    let first!: Promise<void>;
    await act(async () => {
      first = screen.editor.save();
      await screen.editor.save();
    });
    expect(screen.editor.saving).toBe(true);
    await act(async () => {
      pending.resolve({});
      await first;
    });
    expect(mocks.updateMe).toHaveBeenCalledTimes(1);
    expect(screen.editor.saving).toBe(false);
  });

  it('저장에 실패하면 화면을 닫지 않고 성공 로그도 남기지 않으며 다시 저장할 수 있다', async () => {
    mocks.updateMe.mockRejectedValueOnce(
      Object.assign(new Error('잠시 후 다시'), { type: 'client' })
    );
    const screen = await setup();
    await act(() => screen.editor.changeName('새이름'));

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.goBack).not.toHaveBeenCalled();
    expect(mocks.track).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith('잠시 후 다시');
    expect(screen.editor.saving).toBe(false);

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).toHaveBeenCalledTimes(2);
    expect(mocks.goBack).toHaveBeenCalledTimes(1);
  });

  it('전역 토스트가 안내하는 오류 유형은 화면에서 한 번 더 안내하지 않는다', async () => {
    mocks.updateMe.mockRejectedValueOnce(Object.assign(new Error('네트워크'), { type: 'network' }));
    const screen = await setup();
    await act(() => screen.editor.changeName('새이름'));
    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.logError).toHaveBeenCalledTimes(1);
  });
});

describe('프로필 사진 선택', () => {
  it('사진 권한을 거부하면 설정 이동을 안내하고 미리보기는 바뀌지 않는다', async () => {
    mocks.requestPermission.mockResolvedValue({ granted: false });
    const screen = await setup();
    await pickFromGallery(screen);
    expect(mocks.launchPicker).not.toHaveBeenCalled();
    expect(screen.editor.previewImageUri).toBe(SAVED.profileImageUrl);

    const buttons = mocks.alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((button) => button.text === '설정으로 이동')?.onPress?.();
    expect(mocks.openSettings).toHaveBeenCalledTimes(1);
  });

  it('선택을 취소하면 미리보기와 저장 내용이 바뀌지 않는다', async () => {
    mocks.launchPicker.mockResolvedValue({ canceled: true, assets: [] });
    const screen = await setup();
    await pickFromGallery(screen);
    expect(screen.editor.previewImageUri).toBe(SAVED.profileImageUrl);

    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('지원하지 않는 형식이면 안내하고 화면을 닫지 않는다', async () => {
    mocks.uploadImage.mockRejectedValueOnce(new mocks.UnsupportedImageFormatError());
    const screen = await setup();
    await pickFromGallery(screen);
    await act(async () => {
      await screen.editor.save();
    });
    expect(mocks.alert).toHaveBeenCalledWith('지원하지 않는 이미지 형식이에요', expect.any(String));
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(mocks.goBack).not.toHaveBeenCalled();
  });
});
