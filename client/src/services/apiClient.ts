import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjunta el token a cada request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 401 = el token venció, fue revocado o el usuario ya no existe.
 * Antes la app quedaba "logueada" pero cada pantalla fallaba. Ahora se limpia
 * la sesión y se vuelve al login. Un 401 del propio /auth/login (credenciales
 * incorrectas) se deja pasar para que el formulario muestre el error.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const isAuthRequest = url.includes('/auth/');
    if (status === 401 && !isAuthRequest && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Recarga completa: reinicia el estado de React (AuthContext incluido)
      // y las cachés en memoria (p. ej. los negocios del admin)
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
