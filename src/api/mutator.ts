import type { AxiosRequestConfig } from 'axios';
import apiClient from './client';

export const customAxios = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient(config);
  return response.data;
};

export default customAxios;
