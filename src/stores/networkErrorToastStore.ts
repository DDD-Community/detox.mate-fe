import { create } from 'zustand';

type PendingRequest = {
  retry: () => void;
  cancel: () => void;
};

const AUTO_DISMISS_MS = 3000;

interface NetworkErrorToastState {
  // 네트워크 에러 (재시도 가능)
  pending: PendingRequest[];
  // 일반 에러 메시지 (재시도 불가, 자동 dismiss)
  message: string | null;
  /**
   * 토스트 표시 여부 (pending 또는 message 중 하나라도 있으면 true).
   * 컴포넌트는 이 값만 보면 됨.
   */
  visible: boolean;
  enqueueNetworkRetry: (request: PendingRequest) => void;
  showMessage: (text: string) => void;
  retryAll: () => void;
  dismiss: () => void;
}

let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

const clearAutoDismissTimer = () => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }
};

export const useNetworkErrorToastStore = create<NetworkErrorToastState>((set, get) => ({
  pending: [],
  message: null,
  visible: false,
  enqueueNetworkRetry: (request) => {
    clearAutoDismissTimer();
    set((state) => ({
      pending: [...state.pending, request],
      visible: true,
    }));
  },
  showMessage: (text) => {
    clearAutoDismissTimer();
    set({ message: text, visible: true });
    autoDismissTimer = setTimeout(() => {
      // 일반 메시지만 정리 (네트워크 재시도 큐가 살아있을 수 있어 보존)
      const stillHasQueue = get().pending.length > 0;
      set({ message: null, visible: stillHasQueue });
      autoDismissTimer = null;
    }, AUTO_DISMISS_MS);
  },
  retryAll: () => {
    clearAutoDismissTimer();
    const queue = get().pending;
    set({ pending: [], message: null, visible: false });
    queue.forEach((item) => item.retry());
  },
  dismiss: () => {
    clearAutoDismissTimer();
    const queue = get().pending;
    set({ pending: [], message: null, visible: false });
    queue.forEach((item) => item.cancel());
  },
}));
