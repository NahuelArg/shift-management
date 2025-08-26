import axios from 'axios';

// Configurar la URL base para las peticiones
const API_URL = import.meta.env.VITE_API_URL || 
  (process.env.CODESPACE_NAME 
    ? `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
    : 'http://localhost:3000');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_URL };
