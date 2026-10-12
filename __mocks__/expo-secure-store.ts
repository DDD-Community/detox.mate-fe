import { beforeEach, vi } from 'vitest';
import type * as SecureStore from 'expo-secure-store';

const values = new Map<string, string>();
export const getItemAsync = vi.fn<typeof SecureStore.getItemAsync>(
  async (key) => values.get(key) ?? null
);
export const setItemAsync = vi.fn<typeof SecureStore.setItemAsync>(async (key, value) => {
  values.set(key, value);
});
export const deleteItemAsync = vi.fn<typeof SecureStore.deleteItemAsync>(async (key) => {
  values.delete(key);
});

beforeEach(() => {
  values.clear();
  getItemAsync.mockReset();
  setItemAsync.mockReset();
  deleteItemAsync.mockReset();
});
