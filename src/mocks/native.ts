import './polyfills';
import { setupServer } from 'msw/native';

import { handlers } from './handlers';

const server = setupServer(...handlers);
let started = false;

export function startNativeMocking() {
  if (started) return;
  server.listen({ onUnhandledRequest: 'bypass' });
  started = true;
}
