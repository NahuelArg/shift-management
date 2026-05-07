import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import StatCard from '../components/ui/StatCard';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: { name: string; durationMin: number };
  user: { name: string; email: string };
}
interface Service { id: string; name: string; durationMin: number; price: number; businessId: string }
interface UserSearchResult { id: string; name: string; email: string; phone: string | null }

const TodayIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
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
const CompletedIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
  </svg>
);

const EmployeeDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0 });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserSearchResult | null>(null);
  const [isWalkin, setIsWalkin] = useState(false);
  const [formData, setFormData] = useState({ serviceId: '', date: '', startTime: '' });
  const [availableEmps, setAvailableEmps] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/bookings/my-assignments`, { headers: { Authorization: `Bearer ${token}` } });
      const transformed = res.data.map((b: any) => ({
        ...b,
        date:      new Date(b.date).toISOString().split('T')[0],
        startTime: new Date(b.date).toTimeString().slice(0, 5),
        endTime:   new Date(b.endTime).toTimeString().slice(0, 5),
      }));
      setBookings(transformed);
      const today = new Date().toISOString().split('T')[0];
      setStats({
        today:     transformed.filter((b: Booking) => b.date.startsWith(today)).length,
        pending:   transformed.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: transformed.filter((b: Booking) => b.status === 'CONFIRMED').length,
        completed: transformed.filter((b: Booking) => b.status === 'COMPLETED').length,
      });
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al cargar los turnos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && token) fetchBookings(); }, [user, token]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      await axios.patch(`${API_BASE_URL}/bookings/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar el estado', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const loadServices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/services/my-business`, { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch { /* empty */ }
  };

  const searchUsers = async (q: string) => {
    if (q.trim().length < 3) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users/search`, { params: { email: q.trim() }, headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  };

  useEffect(() => {
    const svc = services.find(s => s.id === formData.serviceId);
    if (!svc || !formData.date || !formData.startTime) { setAvailableEmps([]); return; }
    const [y, mo, d] = formData.date.split('-').map(Number);
    const [h, mi] = formData.startTime.split(':').map(Number);
    const start = new Date(y, mo - 1, d, h, mi);
    const end   = new Date(start.getTime() + svc.durationMin * 60000);
    axios.get(`${API_BASE_URL}/bookings/available-employees?businessId=${svc.businessId}&date=${start.toISOString()}&endTime=${end.toISOString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setAvailableEmps(r.data)).catch(() => setAvailableEmps([]));
  }, [formData.serviceId, formData.date, formData.startTime, services, token]);

  const openModal = () => { setShowCreateModal(true); loadServices(); };
  const closeModal = () => {
    setShowCreateModal(false);
    setSelectedClient(null); setSearchQuery(''); setSearchResults([]);
    setFormData({ serviceId: '', date: '', startTime: '' });
    setIsWalkin(false); setSelectedEmpId(''); setAvailableEmps([]);
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  const calcEndTime = (t: string, dur: number) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const total = h * 60 + m + dur;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setCreating(true);
    try {
      const dt = new Date(`${formData.date}T${formData.startTime}:00`);
      await axios.post(`${API_BASE_URL}/bookings`, {
        ...(selectedClient && { userId: selectedClient.id }),
        serviceId: formData.serviceId,
        businessId: selectedService.businessId,
        date: dt.toISOString(),
        finalPrice: selectedService.price,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(selectedEmpId && { employeeId: selectedEmpId }),
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast('Turno creado exitosamente', 'success');
      await fetchBookings();
      closeModal();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al crear el turno', 'error');
    } finally {
      setCreating(false);
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    const dc = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
  });
  const isToday = (d: string) => d.startsWith(new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Panel de empleado</h2>
          <p className="text-sm text-content-3 mt-0.5">Gestiona tus turnos asignados</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openModal}>Nueva reserva</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hoy"        value={stats.today}     icon={<TodayIcon />}    accent="primary" />
        <StatCard label="Pendientes" value={stats.pending}   icon={<PendingIcon />}  accent="warning" />
        <StatCard label="Confirmados" value={stats.confirmed} icon={<ConfirmedIcon />} accent="success" />
        <StatCard label="Completados" value={stats.completed} icon={<CompletedIcon />} accent="info" />
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border p-5">
        <h3 className="text-base font-semibold text-content mb-4">Turnos asignados</h3>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-content-3 text-sm gap-2">
            <svg className="animate-spin-slow w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Cargando…
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="text-center py-10 text-content-3 text-sm">No hay turnos asignados en este momento</div>
        ) : (
          <div className="space-y-3">
            {sortedBookings.map(b => (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${isToday(b.date) ? 'border-primary/30 bg-primary-light' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isToday(b.date) && (
                        <span className="text-xs font-bold bg-primary text-content-inverse px-2 py-0.5 rounded-full">HOY</span>
                      )}
                      <span className="font-semibold text-content text-sm">{b.service.name}</span>
                      <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                    </div>
                    <p className="text-xs text-content-2 font-medium">{b.user?.name || 'Walk-in'}</p>
                    <p className="text-xs text-content-3 mt-0.5">
                      {new Date(b.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{b.startTime} – {b.endTime} ({b.service.durationMin} min)
                    </p>
                  </div>
                  <div className="text-base font-bold text-content shrink-0">
                    ${b.finalPrice.toLocaleString('es-AR')}
                  </div>
                </div>

                {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      size="sm" variant="secondary"
                      disabled={updatingStatus === b.id || b.status === 'CONFIRMED'}
                      loading={updatingStatus === b.id}
                      onClick={() => updateStatus(b.id, 'CONFIRMED')}
                      className="flex-1"
                    >
                      {b.status === 'CONFIRMED' ? '✓ Confirmado' : 'Confirmar'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={updatingStatus === b.id}
                      loading={updatingStatus === b.id}
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                      className="flex-1"
                    >
                      Completar
                    </Button>
                    <Button
                      size="sm" variant="danger"
                      disabled={updatingStatus === b.id}
                      onClick={() => updateStatus(b.id, 'CANCELLED')}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create booking modal */}
      <Modal open={showCreateModal} onClose={closeModal} title="Nueva reserva" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Client search */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-content-2">Cliente</label>
              <label className="flex items-center gap-1.5 text-xs text-content-3 cursor-pointer">
                <input
                  type="checkbox" checked={isWalkin}
                  onChange={e => { setIsWalkin(e.target.checked); setSelectedClient(null); setSearchQuery(''); }}
                  className="rounded"
                />
                Walk-in (sin cuenta)
              </label>
            </div>
            {!isWalkin && (
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
                  placeholder="Buscar por email…"
                  disabled={creating}
                  leftIcon={searchLoading
                    ? <svg className="animate-spin-slow w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                  }
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-surface rounded-lg border border-border shadow-card-hover max-h-40 overflow-y-auto">
                    {searchResults.map(r => (
                      <button
                        key={r.id} type="button"
                        onClick={() => { setSelectedClient(r); setSearchQuery(r.email); setSearchResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-surface-3 border-b border-border last:border-b-0 text-sm"
                      >
                        <p className="font-medium text-content">{r.name}</p>
                        <p className="text-content-3 text-xs">{r.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedClient && (
                  <div className="mt-2 bg-primary-light border border-primary/20 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-content">{selectedClient.name}</p>
                      <p className="text-xs text-content-3">{selectedClient.email}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedClient(null); setSearchQuery(''); }} className="text-content-3 hover:text-content">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Select label="Servicio" value={formData.serviceId} onChange={e => setFormData(p => ({ ...p, serviceId: e.target.value }))} required disabled={creating}>
            <option value="">Seleccionar servicio…</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} · ${s.price.toLocaleString()} ({s.durationMin} min)</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required disabled={creating} />
            <Input label="Hora de inicio" type="time" value={formData.startTime} onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} required disabled={creating} />
          </div>

          <Select label="Empleado" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} disabled={creating || !formData.serviceId || !formData.date || !formData.startTime}>
            <option value="">Yo mismo</option>
            {availableEmps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>

          {selectedService && formData.startTime && (
            <div className="bg-surface-2 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-content">Resumen</p>
              <p className="text-content-2">Duración: <span className="font-medium">{selectedService.durationMin} min</span></p>
              <p className="text-content-2">Fin estimado: <span className="font-medium">{calcEndTime(formData.startTime, selectedService.durationMin)}</span></p>
              <p className="text-base font-bold text-content mt-1">${selectedService.price.toLocaleString('es-AR')}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={creating}
              disabled={!formData.serviceId || !formData.date || !formData.startTime || (!isWalkin && !selectedClient)}
              className="flex-1"
            >
              Crear reserva
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
