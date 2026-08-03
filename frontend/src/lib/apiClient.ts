import axios from 'axios';
import { clearSession, getToken } from './session';

/**
 * Общая фабрика axios-инстанса — используется каждым файлом в `api/*.ts`
 * (сохраняет существующую конвенцию "свой api на файл", но избавляет от
 * дублирования логики токена/ошибок/401 в каждом из них).
 */
export function createApiClient() {
  const api = axios.create({ baseURL: '/api/v1' });

  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401) {
        clearSession();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      const message = err.response?.data?.message ?? err.message ?? 'Неизвестная ошибка';
      return Promise.reject(new Error(Array.isArray(message) ? message.join('; ') : message));
    },
  );

  return api;
}
