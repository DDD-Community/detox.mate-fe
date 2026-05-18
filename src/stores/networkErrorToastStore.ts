import { create } from 'zustand';

type PendingRequest = {
  retry: () => void;
  cancel: () => void;
};

interface NetworkErrorToastState {
  visible: boolean;
  pending: PendingRequest[];
  enqueue: (request: PendingRequest) => void;
  retryAll: () => void;
  dismiss: () => void;
}

export const useNetworkErrorToastStore = create<NetworkErrorToastState>((set, get) => ({
  visible: false,
  pending: [],
  enqueue: (request) => {
    set((state) => ({
      visible: true,
      pending: [...state.pending, request],
    }));
  },
  retryAll: () => {
    const queue = get().pending;
    set({ visible: false, pending: [] });
    queue.forEach((item) => item.retry());
  },
  dismiss: () => {
    const queue = get().pending;
    set({ visible: false, pending: [] });
    queue.forEach((item) => item.cancel());
  },
}));
