import { beforeEach, vi } from 'vitest';
import type apiClient from '../client';

const client = Object.assign(vi.fn<typeof apiClient>(), {
  post: vi.fn<typeof apiClient.post>(),
});
export default client;

let requests = new AbortController();
export const getAuthenticatedRequestSignal = () => requests.signal;
export const cancelAuthenticatedRequests = () => requests.abort();
export const resumeAuthenticatedRequests = () => {
  requests = new AbortController();
};

beforeEach(() => {
  client.mockReset();
  client.post.mockReset();
  resumeAuthenticatedRequests();
});
