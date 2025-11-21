import { api } from '@/lib/api';

export const apiClient = api;

export const withBasePath = (basePath: string) => {
  return {
    get: <T>(url: string = '', config = {}) => api.get<T>(`${basePath}${url}`, config),
    post: <T>(url: string = '', data: unknown = {}, config = {}) => api.post<T>(`${basePath}${url}`, data, config),
    put: <T>(url: string = '', data: unknown = {}, config = {}) => api.put<T>(`${basePath}${url}`, data, config),
    delete: <T>(url: string = '', config = {}) => api.delete<T>(`${basePath}${url}`, config),
  };
};
