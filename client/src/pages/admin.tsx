import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { createBooking } from '../services/bookingService';
import BookingForm from '../components/bookingManagement/BookingForm';
import type { Business } from '../services/businessService';
import StatCard from '../components/ui/StatCard';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const TurnosIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
);
const RevenueIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const TodayIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01" />
  </svg>
);

interface BarChartProps {
  data: { period: string; totalBookings: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data.length) {
    return <p className="text-sm text-content-3 text-center py-8">Sin datos para el período</p>;
  }
  const max = Math.max(...data.map(d => d.totalBookings), 1);
  return (
    <div className="flex items-end justify-around gap-1.5 h-36 pt-2">
      {data.map(d => (
        <div key={d.period} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-semibold text-content-2">{d.totalBookings || ''}</span>
          <div
            className="w-full bg-primary rounded-t-md transition-all duration-500 min-h-[4px]"
            style={{ height: `${Math.max((d.totalBookings / max) * 100, d.totalBookings > 0 ? 8 : 4)}px` }}
          />
          <span className="text-xs text-content-3 truncate w-full text-center">{d.period}</span>
        </div>
      ))}
    </div>
  );
};

interface RecentBooking {
  id: string;
  date: string;
  status: string;
  finalPrice: number;
  service?: { name: string };
  user?: { name: string };
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [totalEmployees, setTotalEmployees] = useState(0);

  const [metrics, setMetrics] = useState<{ totalBookings: number; totalRevenue: number; bookingsByGroup: { period: string; totalBookings: number; totalRevenue: number }[] } | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiClient.get('/admin/me')
      .then(res => {
        const biz = res.data.businesses || [];
        setBusinesses(biz);
        if (biz.length > 0) setSelectedBusiness(biz[0].id);
      })
      .catch(() => setBusinesses([]));
  }, [user]);

  const fetchData = useCallback(async (businessId: string) => {
    if (!businessId) return;

    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
    const yearFrom = `${year}-01`;
    const yearTo   = `${year}-12`;

    try {
      const [metricsRes, todayRes, employeesRes, bookingsRes] = await Promise.allSettled([
        apiClient.get('/admin/metrics', {
          params: { businessId, userId: user?.id, from: yearFrom, to: yearTo, groupBy: 'month' },
        }),
        apiClient.get('/admin/metrics', {
          params: { businessId, userId: user?.id, from: today, to: today, groupBy: 'day' },
        }),
        apiClient.get('/admin/employees', { params: { businessId, page: 1, limit: 1 } }),
        apiClient.get('/bookings'),
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
      if (todayRes.status === 'fulfilled') {
        const groups = todayRes.value.data?.bookingsByGroup ?? [];
        setTodayCount(groups[0]?.totalBookings ?? 0);
      }
      if (employeesRes.status === 'fulfilled') setTotalEmployees(employeesRes.value.data.total ?? 0);
      if (bookingsRes.status === 'fulfilled') {
        const sorted = [...bookingsRes.value.data]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setRecentBookings(sorted);
      }
    } catch {
      // individual errors handled via allSettled
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedBusiness) fetchData(selectedBusiness);
  }, [selectedBusiness, fetchData]);

  return (
    <div className="space-y-6">
      {/* Business selector */}
      {businesses.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-content-2">Negocio:</label>
          <select
            value={selectedBusiness}
            onChange={e => setSelectedBusiness(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {businesses.length === 0 && (
        <div className="bg-warning-light border border-warning/30 text-warning-text px-4 py-3 rounded-xl text-sm">
          No tenés negocios asignados. Creá un negocio primero.
        </div>
      )}

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total reservas"
          value={metrics?.totalBookings ?? '—'}
          icon={<TurnosIcon />}
          accent="primary"
        />
        <StatCard
          label="Ingresos"
          value={metrics ? `$${(metrics.totalRevenue ?? 0).toLocaleString('es-AR')}` : '—'}
          icon={<RevenueIcon />}
          accent="success"
        />
        <StatCard
          label="Empleados"
          value={totalEmployees}
          icon={<UsersIcon />}
          accent="warning"
        />
        <StatCard
          label="Hoy"
          value={todayCount}
          subtitle="Turnos agendados"
          icon={<TodayIcon />}
          accent="info"
        />
      </div>

      {/* Charts + Recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-surface rounded-xl shadow-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-content">Turnos por mes</h3>
            <Button size="sm" variant="secondary" onClick={() => fetchData(selectedBusiness)}>
              Actualizar
            </Button>
          </div>
          <BarChart data={metrics?.bookingsByGroup ?? []} />
        </div>

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-content">Reservas recientes</h3>
            <Button size="sm" onClick={() => setShowBookingForm(true)}>
              + Nueva
            </Button>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-content-3 text-center py-8">Sin reservas</p>
          ) : (
            <div className="divide-y divide-border">
              {recentBookings.map(b => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content truncate">
                      {b.service?.name ?? '—'}
                    </p>
                    <p className="text-xs text-content-3">
                      {new Date(b.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {b.user?.name ? ` · ${b.user.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                    <span className="text-sm font-semibold text-content">
                      ${b.finalPrice?.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create booking modal */}
      <Modal open={showBookingForm} onClose={() => setShowBookingForm(false)} title="Crear turno">
        <BookingForm
          role="ADMIN"
          businessId={selectedBusiness}
          onSubmit={async bookingData => {
            try {
              await createBooking({ ...bookingData, businessId: selectedBusiness });
              toast('Turno creado exitosamente', 'success');
              setShowBookingForm(false);
              fetchData(selectedBusiness);
            } catch (err: any) {
              toast(err.message || 'Error al crear el turno', 'error');
              throw err;
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Admin;
