import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginService } from '../services/authService';
import { redirectByRole } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const TEST_CREDENTIALS = [
  { email: 'admin1@test.com',    role: 'Admin' },
  { email: 'employee1@test.com', role: 'Empleado' },
  { email: 'client1@test.com',   role: 'Cliente' },
];

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
        setError('Sin conexión a internet. Verificá tu red.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredential = (cred: typeof TEST_CREDENTIALS[number]) => {
    setEmail(cred.email);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left dark panel */}
      <div className="hidden lg:flex w-[42%] xl:w-2/5 bg-sidebar flex-col p-10 shrink-0">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ShiftManager</span>
        </Link>

        {/* Description */}
        <div className="flex-1">
          <h1 className="text-white text-2xl font-bold leading-snug mb-3">
            Gestión de turnos para negocios.
          </h1>
          <p className="text-sidebar-text text-sm leading-relaxed">
            Reservas, empleados y métricas en un solo lugar.
          </p>
        </div>

        {/* Test credentials */}
        <div>
          <p className="text-xs font-semibold text-sidebar-text uppercase tracking-wider mb-3">
            Acceso rápido (demo)
          </p>
          <div className="bg-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
            {TEST_CREDENTIALS.map(cred => (
              <button
                key={cred.email}
                type="button"
                onClick={() => fillCredential(cred)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  <span className="text-sidebar-text-active text-sm">{cred.email}</span>
                </div>
                <span className="text-xs text-sidebar-text">{cred.role}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-sidebar-text mt-2.5 opacity-60">
            Contraseña: password123
          </p>
        </div>
      </div>

      {/* Right white panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/home" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <span className="font-bold text-content">ShiftManager</span>
          </Link>

          <div className="bg-surface rounded-2xl shadow-modal p-8 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-content">Bienvenido</h2>
              <p className="text-sm text-content-3 mt-1">Ingresá con tus credenciales para continuar.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
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

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
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
