import { vi } from 'vitest';
import type * as KakaoLogin from '@react-native-seoul/kakao-login';

export const login = vi.fn<typeof KakaoLogin.login>();
