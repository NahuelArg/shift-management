import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginService } from '../services/authService';
import { redirectByRole } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginService(email, password);
      await login(data.accessToken, data.user);
      navigate(redirectByRole(data.user.role));
    } catch (err: unknown) {
      if (!navigator.onLine) {
        setError('Sin conexión a internet. Verifica tu red.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-2">
      {/* Simple top bar */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-surface">
        <Link to="/home" className="font-bold text-base text-content tracking-tight hover:text-primary transition-colors">
          ShiftManager
        </Link>
        <Link to="/register" className="text-sm text-content-2 hover:text-content transition-colors">
          ¿No tenés cuenta? <span className="font-semibold text-primary">Registrate</span>
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl shadow-modal p-8 animate-fade-in">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-content">Bienvenido de nuevo</h1>
              <p className="text-sm text-content-3 mt-1">Ingresá tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@email.com"
                required
                autoComplete="email"
                leftIcon={
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                leftIcon={
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                }
              />

              {error && (
                <div className="bg-danger-light border border-danger/30 text-danger-text px-3 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Ingresar
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-content-3 mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
