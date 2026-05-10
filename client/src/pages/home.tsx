import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { redirectByRole } from '../context/AuthContext';

const features = [
  { icon: '📅', title: 'Gestión de turnos', desc: 'Reservá, confirmá y gestioná turnos en tiempo real con detección automática de conflictos.' },
  { icon: '👥', title: 'Multi-rol', desc: 'Admins, empleados y clientes con permisos y vistas totalmente diferenciadas.' },
  { icon: '📊', title: 'Métricas en tiempo real', desc: 'Dashboard con ingresos, turnos y rendimiento por período y servicio.' },
  { icon: '📱', title: 'Diseño responsive', desc: 'Funciona perfectamente en celulares, tablets y escritorio.' },
];

const TICKER_ITEMS = [
  'Gestión de turnos', 'Empleados', 'Métricas', 'Reservas en línea',
  'Notificaciones', 'Control de horarios', 'Multi-negocio', 'Panel de empleado',
];

const STATS = [
  { value: '+200', label: 'Negocios activos' },
  { value: '4',    label: 'Roles diferenciados' },
  { value: '24',   label: 'Issues resueltos' },
  { value: '100%', label: 'TypeScript' },
];

const ROLES: Record<string, { label: string; color: string; bg: string; dot: string; features: string[] }> = {
  ADMIN: {
    label: 'Admin',
    color: 'text-info',
    bg: 'bg-info/10 border-info/30',
    dot: 'bg-info',
    features: ['Dashboard con métricas', 'Gestión de empleados', 'Crear y cancelar reservas', 'Servicios y horarios', 'Multi-negocio'],
  },
  EMPLOYEE: {
    label: 'Empleado',
    color: 'text-success',
    bg: 'bg-success/10 border-success/30',
    dot: 'bg-success',
    features: ['Turnos asignados', 'Confirmar y completar', 'Reservas walk-in', 'Búsqueda de clientes', 'Historial'],
  },
  CLIENT: {
    label: 'Cliente',
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/30',
    dot: 'bg-warning',
    features: ['Reservar en 3 pasos', 'Ver próximos turnos', 'Historial de reservas', 'Cancelar turnos', 'Notificaciones'],
  },
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const dashboardPath = user ? redirectByRole(user.role) : null;
  const [activeRole, setActiveRole] = useState<keyof typeof ROLES>('ADMIN');

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

      {/* Ticker */}
      <div className="overflow-hidden border-y border-white/10 bg-white/5 py-4">
        <div className="flex gap-10 animate-ticker whitespace-nowrap w-max">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-sm font-medium text-sidebar-text">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="px-6 lg:px-12 py-16 border-b border-white/10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-4xl lg:text-5xl font-bold text-white font-mono mb-2">{s.value}</p>
              <p className="text-sm text-sidebar-text">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-20 border-b border-white/10">
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

      {/* Roles */}
      <section className="px-6 lg:px-12 py-20 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-white text-center mb-2">Un sistema, tres roles</h2>
          <p className="text-sm text-sidebar-text text-center mb-10">Cada perfil tiene su propia experiencia optimizada</p>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border
                  ${activeRole === role
                    ? `${ROLES[role].bg} ${ROLES[role].color}`
                    : 'border-white/10 text-sidebar-text hover:text-white hover:bg-white/5'}`}
              >
                {ROLES[role].label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={`rounded-2xl border p-8 ${ROLES[activeRole].bg} animate-fade-in`}>
            <h3 className={`text-xl font-bold mb-6 ${ROLES[activeRole].color}`}>{ROLES[activeRole].label}</h3>
            <ul className="space-y-3">
              {ROLES[activeRole].features.map(feat => (
                <li key={feat} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${ROLES[activeRole].dot}`} />
                  <span className="text-sm text-sidebar-text">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
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
