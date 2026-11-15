import { isAxiosError } from 'axios';
import axios from "axios";
import { getErrorMessage } from './apiError';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
    email: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      { email, password },
      {
        withCredentials: true, // importante si usás cookies
      }
    );
  
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      // Error con el mensaje y el código de estado (login.tsx traduce 401/429)
      const customError: Error & { status?: number; responseData?: unknown } = new Error(
        getErrorMessage(error, 'Error en login'),
      );
      customError.name = 'AuthError';
      customError.status = error.response.status;
      customError.responseData = error.response.data;
      throw customError;
    }
    // Si es un error de red u otro tipo
    const networkError = new Error("Error de conexión al servidor");
    networkError.name = "NetworkError";
    throw networkError;
  }
}
