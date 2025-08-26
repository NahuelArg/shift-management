import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import { debugLog } from '../utils/debugLogger';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para prevenir refrescos en errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    debugLog('API', '❌ Error interceptado', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Prevenir que el error cause un refresh
    if (error.response) {
      return Promise.reject(new Error((error.response.data as { message?: string })?.message || 'An error occurred'));
    }
    
    return Promise.reject(new Error('Network error'));
  }
);
