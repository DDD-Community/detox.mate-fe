import { vi } from 'vitest';
import type * as Mutator from '../mutator';

export const customAxios = vi.fn<typeof Mutator.customAxios>();

export default customAxios;
