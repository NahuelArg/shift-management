import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-2">
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-surface">
        <Link to="/home" className="font-bold text-base text-content tracking-tight hover:text-primary transition-colors">
          ShiftManager
        </Link>
        <Link to="/login" className="text-sm text-content-2 hover:text-content transition-colors">
          ¿Ya tenés cuenta? <span className="font-semibold text-primary">Ingresá</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl shadow-modal p-8 animate-fade-in">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-content">Crear cuenta</h1>
              <p className="text-sm text-content-3 mt-1">Completá tus datos para comenzar</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Nombre"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nombre@email.com"
                required
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="bg-danger-light border border-danger/30 text-danger-text px-3 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Crear cuenta
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-content-3 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
