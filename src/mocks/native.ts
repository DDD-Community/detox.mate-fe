import './polyfills';
import { setupServer } from 'msw/native';

import { friendsHandlers } from './friendsHandlers';

const server = setupServer(...friendsHandlers);
let started = false;

export function startNativeMocking() {
  if (started) return;
  server.listen({ onUnhandledRequest: 'bypass' });
  started = true;
}
