import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { Business } from '../services/businessService';
import type { Employee } from '../services/userService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

const Users: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', businessId: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`${API_BASE_URL}/admin/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const biz = res.data.businesses || [];
        setBusinesses(biz);
        if (biz.length > 0) {
          setSelectedBusiness(biz[0].id);
          setNewEmployee(e => ({ ...e, businessId: biz[0].id }));
        }
      })
      .catch(err => toast(err.response?.data?.message || 'Error al cargar negocios', 'error'));
  }, [user?.id]);

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
      toast(err.response?.data?.message || 'Error al cargar empleados', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [selectedBusiness, search, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/employee`, { ...newEmployee, role: 'EMPLOYEE', authProvider: 'LOCAL' }, { headers: { Authorization: `Bearer ${token}` } });
      toast('Empleado creado', 'success');
      setShowCreate(false);
      setNewEmployee({ name: '', email: '', password: '', businessId: selectedBusiness });
      fetchEmployees();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al crear empleado', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/admin/employee/${editEmployee.id}`, {
        name: editEmployee.name, email: editEmployee.email,
        ...(editEmployee.password && { password: editEmployee.password })
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast('Empleado actualizado', 'success');
      setEditEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al actualizar', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este empleado?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/employee/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(prev => prev.filter(e => e.id !== id));
      setTotalEmployees(prev => prev - 1);
      toast('Empleado eliminado', 'success');
    } catch {
      toast('Error al eliminar', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalEmployees / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Empleados</h2>
          <p className="text-sm text-content-3 mt-0.5">Gestioná los empleados de tu negocio</p>
        </div>
        {selectedBusiness && <Button leftIcon={<PlusIcon />} onClick={() => setShowCreate(true)}>Nuevo empleado</Button>}
      </div>

      {businesses.length === 0 && (
        <div className="bg-warning-light border border-warning/30 text-warning-text px-4 py-3 rounded-xl text-sm">
          No tenés negocios asignados. Creá un negocio primero.
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total empleados', value: totalEmployees, color: 'bg-primary-light text-primary' },
          { label: 'En esta página',  value: employees.length, color: 'bg-info-light text-info' },
          { label: 'Página',          value: `${page} / ${totalPages}`, color: 'bg-surface-3 text-content-2' },
          { label: 'Negocio activo',  value: businesses.find(b => b.id === selectedBusiness)?.name ?? '—', color: 'bg-success-light text-success' },
        ].map(s => (
          <div key={s.label} className="bg-surface rounded-xl border border-border shadow-card p-4">
            <p className="text-xs text-content-3 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-sm font-bold truncate px-2 py-0.5 rounded-md inline-block ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {businesses.length > 1 && (
        <Select label="Negocio" value={selectedBusiness} onChange={e => { setSelectedBusiness(e.target.value); setPage(1); setSelectedEmployee(null); }} wrapperClassName="max-w-xs">
          {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      )}

      <div className="flex gap-4 min-h-0">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-surface rounded-xl shadow-card border border-border p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <Input
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              wrapperClassName="max-w-72 flex-1"
              leftIcon={
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
            <div className="flex items-center gap-2 text-sm text-content-2">
              <span>Pág. {page}/{totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Button>
              <Button size="sm" variant="secondary" disabled={page === totalPages || totalEmployees === 0} onClick={() => setPage(p => p + 1)}>→</Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Creado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-content-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingEmployees ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-content-3">Cargando…</td></tr>
                ) : !selectedBusiness ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-content-3">Seleccioná un negocio</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-content-3">No hay empleados</td></tr>
                ) : employees.map(emp => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                    className={`cursor-pointer transition-colors ${selectedEmployee?.id === emp.id ? 'bg-primary-light border-l-2 border-primary' : 'hover:bg-surface-2'}`}
                  >
                    <td className="px-4 py-3 font-medium text-content">{emp.name}</td>
                    <td className="px-4 py-3 text-content-2">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-light text-info-text">
                        {emp.role || 'EMPLOYEE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-3">{new Date(emp.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditEmployee({ ...emp, password: '' })} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3 hover:border-primary hover:text-primary hover:bg-primary-light transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDelete(emp.id)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3 hover:border-danger hover:text-danger hover:bg-danger-light transition-colors"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selectedEmployee && (
          <aside className="w-64 shrink-0 bg-surface rounded-xl shadow-card border border-border flex flex-col overflow-hidden animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold text-content-3 uppercase tracking-wider">Detalle</span>
              <button onClick={() => setSelectedEmployee(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-3 text-content-3 transition-colors">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-info-light flex items-center justify-center text-info font-bold text-lg mx-auto mb-2">
                  {selectedEmployee.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </div>
                <p className="font-bold text-content text-sm">{selectedEmployee.name}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-light text-info-text mt-1">
                  {selectedEmployee.role || 'EMPLOYEE'}
                </span>
              </div>
              {[
                { label: 'Email',  value: selectedEmployee.email },
                { label: 'Alta',   value: new Date(selectedEmployee.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(f => (
                <div key={f.label} className="p-3 bg-surface-2 rounded-lg">
                  <p className="text-xs text-content-3 uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-content mt-0.5 break-all">{f.value}</p>
                </div>
              ))}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => { setEditEmployee({ ...selectedEmployee, password: '' }); setSelectedEmployee(null); }}
                  className="w-full py-2 rounded-lg border border-border text-sm font-medium text-content-2 hover:border-primary hover:text-primary transition-colors"
                >
                  Editar empleado
                </button>
                <button
                  onClick={() => { handleDelete(selectedEmployee.id); setSelectedEmployee(null); }}
                  className="w-full py-2 rounded-lg border border-border text-sm font-medium text-danger hover:bg-danger-light transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo empleado" size="sm">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {businesses.length > 1 && (
            <Select label="Negocio" value={newEmployee.businessId} onChange={e => setNewEmployee(p => ({ ...p, businessId: e.target.value }))} required>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          )}
          <Input label="Nombre" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Contraseña" type="password" value={newEmployee.password} onChange={e => setNewEmployee(p => ({ ...p, password: e.target.value }))} required />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={createLoading} className="flex-1">Crear</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editEmployee} onClose={() => setEditEmployee(null)} title="Editar empleado" size="sm">
        {editEmployee && (
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <Input label="Nombre" value={editEmployee.name} onChange={e => setEditEmployee((p: any) => ({ ...p, name: e.target.value }))} required />
            <Input label="Email" type="email" value={editEmployee.email} onChange={e => setEditEmployee((p: any) => ({ ...p, email: e.target.value }))} required />
            <Input label="Nueva contraseña (opcional)" type="password" value={editEmployee.password} onChange={e => setEditEmployee((p: any) => ({ ...p, password: e.target.value }))} />
            <Button type="submit" loading={editLoading}>Guardar cambios</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Users;
