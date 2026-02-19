import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginService } from "../services/authService";
import NavBar from "../components/navBar";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  function handleLoginError(error: unknown) {
      if (!navigator.onLine) {
        setError("No internet connection. Please check your network");
        return;
      }

      // Manejar el error personalizado de auth service
      if (error instanceof Error) {
        if (error.name === "AuthError") {
          // Usar el mensaje del backend directamente
          setError(error.message);
          return;
        }
        if (error.name === "NetworkError") {
          setError("Unable to connect to the server. Please try again");
          return;
        }
      }

      // Si llegamos aquí, es un error no manejado
      console.error('Unexpected login error:', error);
      setError("An unexpected error occurred. Please try again");
    }
    try {
      const data = await loginService(email, password);
      login(data.accessToken, data.user);
      // now redirect based on role
      const dashboardPath = data.user.role 
      switch (dashboardPath) {
        case "ADMIN":
          navigate("/dashboard/admin");
          break;
        case "EMPLOYEE":
          navigate("/dashboard/employee");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }

   
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div
        className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-custom-light to-custom-dark w-full"
        style={{ minHeight: "calc(100vh - 48px)" }}
      >
        <div className="bg-white/90 rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            Login
          </h2>
          <p className="text-gray-500 text-center mb-6 text-sm">
            Welcome back! Please enter your credentials.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"

            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-pulse">Logging in...</span>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 10-4 0v2c0 1.104.896 2 2 2zm6 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m12 0H6"
                    />
                  </svg>
                  Login
                </>
              )}
            </button>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
