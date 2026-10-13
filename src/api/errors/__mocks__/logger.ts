import { vi } from 'vitest';
import type * as Logger from '../logger';

export const logError = vi.fn<typeof Logger.logError>();
