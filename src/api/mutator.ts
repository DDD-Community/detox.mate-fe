import type { AxiosRequestConfig } from 'axios';
import apiClient from './client';

export const customAxios = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return apiClient({ ...config, ...options }).then((response) => response.data);
};

export default customAxios;
