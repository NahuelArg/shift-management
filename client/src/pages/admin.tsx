import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import BookingForm from '../components/bookingManagement/BookingForm';
import type { Business } from '../services/businessService';
import type { Employee } from '../services/userService';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month');

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', businessId: '' });
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [editEmployeeLoading, setEditEmployeeLoading] = useState(false);

  const [showBookingForm, setShowBookingForm] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!user || !token) return;
    axios.get(`${API_BASE_URL}/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const biz = res.data.businesses || [];
        setBusinesses(biz);
        if (biz.length > 0) {
          setSelectedBusiness(biz[0].id);
          setNewEmployee(e => ({ ...e, businessId: biz[0].id }));
        }
      })
      .catch(() => setBusinesses([]));
  }, [user, token]);

  const fetchMetrics = async (businessId: string, from: string, to: string, userId: string | undefined, gb: string) => {
    let fromParam = from, toParam = to;
    if (gb === 'year')  { fromParam = from.slice(0, 4); toParam = to.slice(0, 4); }
    if (gb === 'month') { fromParam = from.slice(0, 7); toParam = to.slice(0, 7); }
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/metrics`, {
        params: { businessId, userId, from: fromParam, to: toParam, groupBy: gb },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data);
      setMetricsError(null);
    } catch (err: any) {
      setMetricsError(err.response?.data?.message || 'Error al cargar las métricas');
    }
  };

  useEffect(() => {
    if (!selectedBusiness) return;
    fetchMetrics(selectedBusiness, fromDate, toDate, user?.id, groupBy);
  }, [selectedBusiness, fromDate, toDate, groupBy]);

  const fetchEmployees = async () => {
    if (!selectedBusiness) return;
    setLoadingEmployees(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/employees`, {
        params: { businessId: selectedBusiness, search, page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data.employees);
      setTotalEmployees(res.data.total);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al obtener empleados', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [selectedBusiness, search, page, token]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/employee`, { ...newEmployee, role: 'EMPLOYEE', authProvider: 'LOCAL' }, { headers: { Authorization: `Bearer ${token}` } });
      toast('Empleado creado exitosamente', 'success');
      setShowEmployeeForm(false);
      setNewEmployee({ name: '', email: '', password: '', businessId: selectedBusiness });
      fetchEmployees();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al crear el empleado', 'error');
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este empleado?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/employee/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(prev => prev.filter(a => a.id !== id));
      setTotalEmployees(prev => prev - 1);
      toast('Empleado eliminado', 'success');
    } catch {
      toast('Error al eliminar empleado', 'error');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditEmployeeLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/admin/employee/${editEmployee.id}`, {
        name: editEmployee.name, email: editEmployee.email, password: editEmployee.password || undefined
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast('Empleado actualizado', 'success');
      setEmployees(prev => prev.map(a => a.id === editEmployee.id ? { ...a, name: editEmployee.name, email: editEmployee.email } : a));
      setEditEmployee(null);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al actualizar empleado', 'error');
    } finally {
      setEditEmployeeLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalEmployees / limit));

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
          No tienes negocios asignados. Crea un negocio primero.
        </div>
      )}

      {/* Metrics stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total de turnos"
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
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Metrics filters + table */}
      <div className="bg-surface rounded-xl shadow-card border border-border p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-content">Turnos por período</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as 'day' | 'month' | 'year')}
              className="w-28"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
            </Select>
            <input
              type={groupBy === 'day' ? 'date' : groupBy === 'month' ? 'month' : 'number'}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              min={groupBy === 'year' ? '2000' : undefined}
              max={groupBy === 'year' ? '2100' : undefined}
              className="rounded-lg border border-border px-3 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type={groupBy === 'day' ? 'date' : groupBy === 'month' ? 'month' : 'number'}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              min={groupBy === 'year' ? '2000' : undefined}
              max={groupBy === 'year' ? '2100' : undefined}
              className="rounded-lg border border-border px-3 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button size="sm" onClick={() => fetchMetrics(selectedBusiness, fromDate, toDate, user?.id, groupBy)}>
              Buscar
            </Button>
          </div>
        </div>
        {metricsError && <p className="text-sm text-danger-text mb-3">{metricsError}</p>}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Período</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Turnos</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-3 uppercase tracking-wider">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics?.bookingsByGroup?.length > 0 ? metrics.bookingsByGroup.map((g: any) => (
                <tr key={g.period} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-medium text-content">{g.period}</td>
                  <td className="px-4 py-3 text-content-2">{g.totalBookings}</td>
                  <td className="px-4 py-3 text-content-2">${g.totalRevenue?.toLocaleString('es-AR')}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-content-3">Sin datos para el período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee management */}
      <div className="bg-surface rounded-xl shadow-card border border-border p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-semibold text-content">Empleados</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowBookingForm(true)}>
              Crear turno
            </Button>
            <Button size="sm" leftIcon={<PlusIcon />} onClick={() => setShowEmployeeForm(true)}>
              Nuevo empleado
            </Button>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          wrapperClassName="mb-4 max-w-72"
          leftIcon={
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          }
        />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                {['Nombre', 'Email', 'Negocio', 'Creado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-content-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingEmployees ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-content-3">Cargando…</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-content-3">No hay empleados</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-medium text-content">{emp.name}</td>
                  <td className="px-4 py-3 text-content-2">{emp.email}</td>
                  <td className="px-4 py-3 text-content-2">{emp.businessName || '—'}</td>
                  <td className="px-4 py-3 text-content-3">{new Date(emp.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger-light transition-colors"
                        aria-label="Eliminar"
                      ><TrashIcon /></button>
                      <button
                        onClick={() => setEditEmployee({ ...emp, password: '' })}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-content-2 hover:bg-surface-3 transition-colors"
                        aria-label="Editar"
                      ><EditIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-content-2">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <Button size="sm" variant="secondary" disabled={page === totalPages || totalEmployees === 0} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      </div>

      {/* Create employee modal */}
      <Modal open={showEmployeeForm} onClose={() => setShowEmployeeForm(false)} title="Nuevo empleado" size="sm">
        <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
          {businesses.length > 1 && (
            <Select label="Negocio" value={newEmployee.businessId} onChange={e => setNewEmployee(p => ({ ...p, businessId: e.target.value }))} required>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          )}
          <Input label="Nombre" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Contraseña" type="password" value={newEmployee.password} onChange={e => setNewEmployee(p => ({ ...p, password: e.target.value }))} required />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={employeeLoading} className="flex-1">Crear empleado</Button>
            <Button type="button" variant="secondary" onClick={() => setShowEmployeeForm(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit employee modal */}
      <Modal open={!!editEmployee} onClose={() => setEditEmployee(null)} title="Editar empleado" size="sm">
        {editEmployee && (
          <form onSubmit={handleEditEmployee} className="flex flex-col gap-4">
            <Input label="Nombre" value={editEmployee.name} onChange={e => setEditEmployee((p: any) => ({ ...p, name: e.target.value }))} required />
            <Input label="Email" type="email" value={editEmployee.email} onChange={e => setEditEmployee((p: any) => ({ ...p, email: e.target.value }))} required />
            <Input label="Nueva contraseña (opcional)" type="password" value={editEmployee.password} onChange={e => setEditEmployee((p: any) => ({ ...p, password: e.target.value }))} />
            <Button type="submit" loading={editEmployeeLoading}>Guardar cambios</Button>
          </form>
        )}
      </Modal>

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
            } catch (err: any) {
              toast(err.response?.data?.message || 'Error al crear el turno', 'error');
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Admin;
