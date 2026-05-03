import type { AxiosRequestConfig } from 'axios';
import apiClient from './client';

export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> => {
  return apiClient(config).then((response) => response.data);
};

export default customAxios;
