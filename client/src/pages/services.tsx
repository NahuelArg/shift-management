import React, { useEffect, useState } from 'react';
import { serviceService, type Service, type CreateServiceDto } from '../services/serviceService';
import { businessService, type Business } from '../services/businessService';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

const ScissorsIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path strokeLinecap="round" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>;
const CoinIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 006 0"/></svg>;
const ClockIcon   = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>;
const BuildingIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9m0 0h6m-6 0v12m6-12v12"/></svg>;

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

const emptyForm: CreateServiceDto = { name: '', description: '', durationMin: 30, price: 0, businessId: '' };

const Services: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<CreateServiceDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterBusiness, setFilterBusiness] = useState('all');

  useEffect(() => {
    fetchServices();
    fetchBusinesses();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      setServices(await serviceService.getAll());
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al cargar servicios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await businessService.getAll();
      setBusinesses(data);
      if (data.length > 0) setFormData(f => ({ ...f, businessId: f.businessId || data[0].id }));
    } catch { /* silent */ }
  };

  const openCreate = () => {
    setEditingService(null);
    setFormData({ ...emptyForm, businessId: businesses[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setFormData({ name: s.name, description: s.description || '', durationMin: s.durationMin, price: s.price, businessId: s.businessId });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingService) {
        const { businessId, ...updateData } = formData;
        await serviceService.update(editingService.id, businessId, updateData);
        toast('Servicio actualizado', 'success');
      } else {
        await serviceService.create(formData);
        toast('Servicio creado', 'success');
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al guardar el servicio', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    try {
      await serviceService.delete(id, svc.businessId);
      setServices(prev => prev.filter(s => s.id !== id));
      toast('Servicio eliminado', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const getBusinessName = (id: string) => businesses.find(b => b.id === id)?.name ?? '—';

  const avgPrice    = services.length ? Math.round(services.reduce((s, sv) => s + sv.price, 0) / services.length) : 0;
  const avgDuration = services.length ? Math.round(services.reduce((s, sv) => s + sv.durationMin, 0) / services.length) : 0;
  const bizCount    = new Set(services.map(sv => sv.businessId)).size;

  const filteredServices = services.filter(s =>
    filterBusiness === 'all' || s.businessId === filterBusiness
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Servicios</h2>
          <p className="text-sm text-content-3 mt-0.5">Administrá los servicios de tu negocio</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openCreate}>Nuevo servicio</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total servicios"  value={services.length}                icon={<ScissorsIcon />} accent="primary" />
        <StatCard label="Precio promedio"  value={`$${avgPrice.toLocaleString('es-AR')}`} icon={<CoinIcon />}     accent="success" />
        <StatCard label="Duración prom."   value={`${avgDuration} min`}           icon={<ClockIcon />}    accent="warning" />
        <StatCard label="Negocios"         value={bizCount}                        icon={<BuildingIcon />} accent="info"    />
      </div>

      {/* Toolbar */}
      {(businesses.length > 1 || services.length > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterBusiness}
            onChange={e => setFilterBusiness(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-content focus:border-primary outline-none"
          >
            <option value="all">Todos los negocios</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span className="text-xs text-content-3">{filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-content-3 text-sm">Cargando…</div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-2 font-medium">No hay servicios</p>
            <p className="text-sm text-content-3 mt-1">Creá el primer servicio para comenzar</p>
            <Button className="mt-4" leftIcon={<PlusIcon />} onClick={openCreate}>Crear servicio</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  {['Nombre', 'Negocio', 'Duración', 'Precio', 'Descripción', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredServices.map(s => (
                  <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-medium text-content">{s.name}</td>
                    <td className="px-4 py-3 text-content-2">{getBusinessName(s.businessId)}</td>
                    <td className="px-4 py-3 text-content-2 font-mono">{s.durationMin} min</td>
                    <td className="px-4 py-3 font-medium text-content font-mono">${s.price != null ? s.price.toLocaleString('es-AR') : '—'}</td>
                    <td className="px-4 py-3 text-content-3 max-w-xs truncate">{s.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3 hover:border-primary hover:text-primary hover:bg-primary-light transition-colors" title="Editar"><EditIcon /></button>
                        <button onClick={() => handleDelete(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3 hover:border-danger hover:text-danger hover:bg-danger-light transition-colors" title="Eliminar"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingService ? 'Editar servicio' : 'Nuevo servicio'} size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
          <Select label="Negocio" value={formData.businessId} onChange={e => setFormData(p => ({ ...p, businessId: e.target.value }))} required disabled={!!editingService}>
            <option value="">Seleccioná un negocio</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duración (min)" type="number" min="1" value={formData.durationMin} onChange={e => setFormData(p => ({ ...p, durationMin: parseInt(e.target.value) }))} required />
            <Input label="Precio ($)" type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) }))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-content placeholder:text-content-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="Descripción opcional…"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={submitting} className="flex-1">{editingService ? 'Guardar cambios' : 'Crear servicio'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Services;
