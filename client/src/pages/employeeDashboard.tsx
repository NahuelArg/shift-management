import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import StatCard from '../components/ui/StatCard';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: { name: string; durationMin: number };
  user: { name: string; email: string } | null;
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

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL',       label: 'Todos' },
  { key: 'PENDING',   label: 'Pendiente' },
  { key: 'CONFIRMED', label: 'Confirmado' },
  { key: 'COMPLETED', label: 'Completado' },
  { key: 'CANCELLED', label: 'Cancelado' },
];

const EmployeeDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');

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
      const res = await apiClient.get('/bookings/my-assignments');
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
      await apiClient.patch(`/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      if (status === 'COMPLETED') {
        setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
      }
      toast('Estado actualizado', 'success');
    } catch {
      toast('Error al actualizar el estado', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const loadServices = async () => {
    try {
      const res = await apiClient.get('/services/my-business');
      setServices(res.data);
    } catch { /* empty */ }
  };

  const searchUsers = async (q: string) => {
    if (q.trim().length < 3) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await apiClient.get('/users/search', { params: { email: q.trim() } });
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
    apiClient.get(`/bookings/available-employees?businessId=${svc.businessId}&date=${start.toISOString()}&endTime=${end.toISOString()}`)
      .then(r => setAvailableEmps(r.data))
      .catch(() => setAvailableEmps([]));
  }, [formData.serviceId, formData.date, formData.startTime, services]);

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
      await apiClient.post('/bookings', {
        ...(selectedClient && { userId: selectedClient.id }),
        serviceId: formData.serviceId,
        businessId: selectedService.businessId,
        date: dt.toISOString(),
        finalPrice: selectedService.price,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(selectedEmpId && { employeeId: selectedEmpId }),
      });
      toast('Turno creado exitosamente', 'success');
      await fetchBookings();
      closeModal();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al crear el turno', 'error');
    } finally {
      setCreating(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings
    .filter(b => b.date.startsWith(todayStr))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const filteredBookings = bookings
    .filter(b => activeTab === 'ALL' || b.status === activeTab)
    .sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Mis Turnos</h2>
          <p className="text-sm text-content-3 mt-0.5">Gestioná tus turnos asignados</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openModal}>Nueva reserva</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Turnos hoy"  value={stats.today}     icon={<TodayIcon />}    accent="primary" />
        <StatCard label="Pendientes"  value={stats.pending}   icon={<PendingIcon />}  accent="warning" />
        <StatCard label="Confirmados" value={stats.confirmed} icon={<ConfirmedIcon />} accent="success" />
        <StatCard label="Completados" value={stats.completed} icon={<CompletedIcon />} accent="info" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-content-3 text-sm gap-2">
          <svg className="animate-spin-slow w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Cargando…
        </div>
      ) : (
        <>
          {/* Today's bookings */}
          {todayBookings.length > 0 && (
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-success uppercase tracking-wider">
                  Turnos de hoy — {todayBookings.length}
                </p>
                <span className="text-xs text-content-3">
                  {todayBookings.filter(b => b.status === 'COMPLETED').length} / {todayBookings.length} completados
                </span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${(todayBookings.filter(b => b.status === 'COMPLETED').length / todayBookings.length) * 100}%` }}
                />
              </div>
              <div className="space-y-2">
                {todayBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border shadow-sm">
                    <div className="bg-success-light rounded-lg px-2 py-2 text-center shrink-0 min-w-[48px]">
                      <p className="text-xs font-bold text-success font-mono leading-none">{b.startTime}</p>
                      <p className="text-xs text-success opacity-70 mt-0.5">{b.service.durationMin}m</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-content truncate">{b.user?.name ?? 'Walk-in'}</p>
                      <p className="text-xs text-content-3">{b.service.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-content font-mono">${b.finalPrice.toLocaleString('es-AR')}</span>
                      <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                      {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                        <button
                          onClick={() => updateStatus(b.id, 'COMPLETED')}
                          disabled={updatingStatus !== null}
                          className="px-2.5 py-1 rounded-lg bg-success text-content-inverse text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All bookings with tabs */}
          <div className="bg-surface rounded-xl shadow-card border border-border p-5">
            <h3 className="text-base font-semibold text-content mb-4">Todos los turnos</h3>

            {/* Tab filter */}
            <div className="flex items-center gap-1 mb-5 flex-wrap">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-content-inverse'
                      : 'bg-surface-3 text-content-2 hover:bg-surface-2'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-content-3 text-sm">
                No hay turnos {activeTab !== 'ALL' ? 'con ese estado' : 'asignados'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Servicio / Cliente</th>
                      <th className="pb-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Fecha y hora</th>
                      <th className="pb-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Estado</th>
                      <th className="pb-3 text-right text-xs font-medium text-content-3 uppercase tracking-wider">Precio</th>
                      <th className="pb-3 text-right text-xs font-medium text-content-3 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBookings.map(b => {
                      const isToday = b.date.startsWith(todayStr);
                      return (
                        <tr key={b.id} className="hover:bg-surface-2 transition-colors">
                          <td className="py-3.5 pr-4">
                            <p className="font-medium text-content">{b.service.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-content-3">{b.user?.name || 'Walk-in'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-1.5">
                              {isToday && (
                                <span className="text-xs font-bold bg-primary text-content-inverse px-1.5 py-0.5 rounded">HOY</span>
                              )}
                              <span className="text-content-2">
                                {new Date(b.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-content-3 mt-0.5">{b.startTime} – {b.endTime}</p>
                          </td>
                          <td className="py-3.5 pr-4">
                            <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                          </td>
                          <td className="py-3.5 pr-4 text-right font-semibold text-content">
                            ${b.finalPrice.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3.5 text-right">
                            {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                              <div className="flex items-center justify-end gap-1.5">
                                {b.status === 'PENDING' && (
                                  <Button
                                    size="sm" variant="secondary"
                                    loading={updatingStatus === b.id}
                                    disabled={updatingStatus !== null}
                                    onClick={() => updateStatus(b.id, 'CONFIRMED')}
                                  >
                                    Confirmar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  loading={updatingStatus === b.id}
                                  disabled={updatingStatus !== null}
                                  onClick={() => updateStatus(b.id, 'COMPLETED')}
                                >
                                  Completar
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create booking modal */}
      <Modal open={showCreateModal} onClose={closeModal} title="Nueva reserva" size="md">
        <form onSubmit={handleCreate} className="space-y-5">
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
