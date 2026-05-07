import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { redirectByRole } from '../context/AuthContext';

const features = [
  { icon: '📅', title: 'Gestión de turnos', desc: 'Reservá, confirmá y gestioná turnos en tiempo real con detección automática de conflictos.' },
  { icon: '👥', title: 'Multi-rol', desc: 'Admins, empleados y clientes con permisos y vistas totalmente diferenciadas.' },
  { icon: '📊', title: 'Métricas en tiempo real', desc: 'Dashboard con ingresos, turnos y rendimiento por período y servicio.' },
  { icon: '📱', title: 'Diseño responsive', desc: 'Funciona perfectamente en celulares, tablets y escritorio.' },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const dashboardPath = user ? redirectByRole(user.role) : null;

  return (
    <div className="min-h-dvh flex flex-col bg-sidebar text-content-inverse font-sans">
      {/* NavBar */}
      <header className="flex items-center justify-between px-6 lg:px-12 h-16 border-b border-white/10">
        <span className="font-bold text-base tracking-tight text-white">ShiftManager</span>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link
              to={dashboardPath!}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-sidebar-text hover:text-white transition-colors px-3 py-2">
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32">
        <div className="inline-flex items-center gap-2 bg-white/10 text-sidebar-text text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/10">
          <span className="w-1.5 h-1.5 bg-success rounded-full" />
          Sistema de turnos disponible
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
          Gestioná tus turnos<br />
          <span className="text-primary-muted">sin complicaciones</span>
        </h1>
        <p className="text-lg text-sidebar-text max-w-xl mx-auto mb-10 leading-relaxed">
          Plataforma completa para administrar reservas, empleados, servicios y métricas de tu negocio desde un solo lugar.
        </p>
        {!user ? (
          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              to="/register"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-lg"
            >
              Empezar gratis →
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/15 transition-colors border border-white/10"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <Link
            to={dashboardPath!}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-lg"
          >
            Ir a mi dashboard →
          </Link>
        )}
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-sidebar-text leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-sidebar-text">
        © {new Date().getFullYear()} ShiftManager · Construido con React 19, NestJS y Prisma
      </footer>
    </div>
  );
};

export default Home;
