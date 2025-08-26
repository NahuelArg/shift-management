import api from '../config/axios';
import { debugLog } from '../utils/debugLogger';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: 'ADMIN' | 'CLIENT';
    password: string;
    email: string;
  };
}

interface ApiError {
  status?: number;
  responseData?: unknown;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    debugLog('AuthService', '🚀 Iniciando solicitud de login', { 
      email,
      baseURL: api.defaults.baseURL,
      withCredentials: api.defaults.withCredentials 
    });

    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    
    debugLog('AuthService', '✅ Respuesta del servidor recibida', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    debugLog('AuthService', '❌ Error en login', { error });
    
    if (error && typeof error === 'object' && 'response' in error) {
      // Updated type definition to include headers
      const apiError = error as { 
        response?: { 
          data: { message: string }, 
          status: number,
          headers: unknown  // Added headers property
        } 
      };
      
      debugLog('AuthService', '🔍 Detalles del error de API', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        headers: apiError.response?.headers
      });
      
      const customError = new Error(apiError.response?.data.message || "Error en login") as Error & ApiError;
      customError.name = "AuthError";
      if (apiError.response) {
        customError.status = apiError.response.status;
        customError.responseData = apiError.response.data;
      }
      
      debugLog('AuthService', '🎯 Error personalizado creado', customError);
      
      throw customError;
    }
    
    debugLog('AuthService', '🔌 Error de red detectado', { error });
    const networkError = new Error("Error de conexión al servidor");
    networkError.name = "NetworkError";
    throw networkError;
  }
}
