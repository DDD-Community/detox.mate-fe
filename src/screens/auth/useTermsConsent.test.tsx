// @vitest-environment jsdom
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayProvider } from 'overlay-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import type { TermsAgreementSheet } from './TermsAgreementSheet';
import { useTermsConsent } from './useTermsConsent';

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
  sheet: vi.fn(),
}));
vi.mock('expo-secure-store');
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../../api/errors', () => ({
  logError: mocks.logError,
  normalizeError: (e: unknown) => e,
}));
vi.mock('./TermsAgreementSheet', () => ({
  TermsAgreementSheet: (props: ComponentProps<typeof TermsAgreementSheet>) => {
    mocks.sheet(props);
    return null;
  },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: (() => void)[] = [];
let frames: FrameRequestCallback[];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getItemAsync).mockResolvedValue(null);
  vi.mocked(setItemAsync).mockResolvedValue(undefined);
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
});
afterEach(async () => {
  await act(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  vi.unstubAllGlobals();
});

async function setup() {
  let current!: ReturnType<typeof useTermsConsent>;
  const onFailure = vi.fn();
  function Harness() {
    current = useTermsConsent({ onFailure });
    return null;
  }
  const root = createRoot(document.createElement('div'));
  const render = (mounted: boolean) => <OverlayProvider>{mounted && <Harness />}</OverlayProvider>;
  cleanups.push(() => root.unmount());
  await act(() => root.render(render(true)));
  return {
    get state() {
      return current;
    },
    onFailure,
    unmount: () => act(() => root.render(render(false))),
  };
}

const sheet = () => mocks.sheet.mock.lastCall![0] as ComponentProps<typeof TermsAgreementSheet>;
async function open(screen: Awaited<ReturnType<typeof setup>>) {
  let result!: Promise<boolean>;
  await act(() => {
    result = screen.state.requestConsent();
  });
  await act(() => frames.splice(0).forEach((callback) => callback(0)));
  return { result };
}

describe('인증 전 약관 동의', () => {
  it('닫기는 인증을 허용하지 않고, 동의해도 시트 종료와 저장 완료 전에는 인증을 허용하지 않는다', async () => {
    const screen = await setup();
    const cancelled = await open(screen);
    await act(() => sheet().onClose());
    await act(() => sheet().onDismiss());
    expect(await cancelled.result).toBe(false);
    expect(setItemAsync).not.toHaveBeenCalled();

    const saving = Promise.withResolvers<void>();
    vi.mocked(setItemAsync).mockReturnValueOnce(saving.promise);
    const accepted = await open(screen);
    const login = vi.fn();
    const continuation = accepted.result.then((agreed) => {
      if (agreed) login();
    });
    await act(() => sheet().onConfirm());
    expect(sheet().visible).toBe(false);
    expect(setItemAsync).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
    await act(() => sheet().onDismiss());
    expect(login).not.toHaveBeenCalled();
    await act(async () => {
      saving.resolve();
      await continuation;
    });
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('이미 동의했다면 시트를 열지 않고 인증을 허용한다', async () => {
    vi.mocked(getItemAsync).mockResolvedValue('true');
    const screen = await setup();
    let agreed!: boolean;
    await act(async () => {
      agreed = await screen.state.requestConsent();
    });
    expect(agreed).toBe(true);
    expect(mocks.sheet).not.toHaveBeenCalled();
  });

  it('동의 저장 실패는 인증을 허용하지 않고 오류 안내 후 재시도할 수 있다', async () => {
    vi.mocked(setItemAsync).mockRejectedValueOnce(new Error('storage failure'));
    const screen = await setup();
    const failed = await open(screen);
    await act(() => sheet().onConfirm());
    await act(() => sheet().onDismiss());
    expect(await failed.result).toBe(false);
    expect(screen.onFailure).toHaveBeenCalledTimes(1);
    expect(mocks.logError).toHaveBeenCalledTimes(1);
    const retry = await open(screen);
    await act(() => sheet().onConfirm());
    await act(() => sheet().onDismiss());
    expect(await retry.result).toBe(true);
  });

  it('동시 요청과 화면 이탈은 인증을 허용하지 않고 열린 시트를 정리한다', async () => {
    const screen = await setup();
    const first = await open(screen);
    let duplicate!: boolean;
    await act(async () => {
      duplicate = await screen.state.requestConsent();
    });
    expect(duplicate).toBe(false);
    await screen.unmount();
    expect(await first.result).toBe(false);
    expect(setItemAsync).not.toHaveBeenCalled();
  });
});
