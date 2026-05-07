import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import StatCard from '../components/ui/StatCard';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: { name: string; durationMin: number };
  business: { name: string };
}

const TurnosIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
  </svg>
);
const PendingIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);
const ConfirmedIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CancelledIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });

  const fetchBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/bookings/my-bookings');
      const transformed = res.data.map((b: any) => ({
        ...b,
        date:      new Date(b.date).toISOString().split('T')[0],
        startTime: new Date(b.date).toTimeString().slice(0, 5),
        endTime:   new Date(b.endTime).toTimeString().slice(0, 5),
      }));
      setBookings(transformed);
      setStats({
        total:     transformed.length,
        pending:   transformed.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: transformed.filter((b: Booking) => b.status === 'CONFIRMED').length,
        cancelled: transformed.filter((b: Booking) => b.status === 'CANCELLED').length,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content">¡Bienvenido, {user?.name}!</h2>
        <p className="text-sm text-content-3 mt-0.5">Aquí puedes ver y gestionar todas tus reservas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total"      value={stats.total}     icon={<TurnosIcon />}   accent="primary" />
        <StatCard label="Pendientes" value={stats.pending}   icon={<PendingIcon />}  accent="warning" />
        <StatCard label="Confirmadas" value={stats.confirmed} icon={<ConfirmedIcon />} accent="success" />
        <StatCard label="Canceladas" value={stats.cancelled} icon={<CancelledIcon />} accent="danger" />
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-content">Mis Reservas</h3>
          <Link
            to="/bookings"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Nueva reserva →
          </Link>
        </div>

        {error && (
          <div className="bg-danger-light border border-danger/30 text-danger-text px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchBookings} className="underline ml-2">Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-content-3 text-sm gap-2">
            <svg className="animate-spin-slow w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Cargando reservas…
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-12 h-12 text-content-3 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-content-2 font-medium">No tienes reservas</p>
            <p className="text-sm text-content-3 mt-1">Crea tu primera reserva para comenzar</p>
            <Link
              to="/bookings"
              className="inline-flex mt-4 px-4 py-2 bg-primary text-content-inverse rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Crear reserva
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map(b => (
              <div key={b.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-content text-sm">{b.service.name}</span>
                    <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                  </div>
                  <p className="text-xs text-content-3">{b.business.name}</p>
                  <p className="text-xs text-content-3 mt-0.5">
                    {new Date(b.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}{b.startTime} – {b.endTime} ({b.service.durationMin} min)
                  </p>
                </div>
                <div className="text-base font-bold text-content shrink-0">
                  ${b.finalPrice.toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
