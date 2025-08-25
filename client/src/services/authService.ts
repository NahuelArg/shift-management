import axios from "axios";

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

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      "http://localhost:3000/auth/login",
      { email, password },
      {
        withCredentials: true, // importante si usás cookies
      }
    );
  
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Crear un error personalizado que incluya tanto el mensaje como el código de estado
      const customError = new Error(error.response.data.message || "Error en login");
      customError.name = "AuthError";
      (customError as any).status = error.response.status;
      (customError as any).responseData = error.response.data;
      throw customError;
    }
    // Si es un error de red u otro tipo
    const networkError = new Error("Error de conexión al servidor");
    networkError.name = "NetworkError";
    throw networkError;
  }
}
