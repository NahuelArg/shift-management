import React, { useEffect, useState } from 'react';
import { serviceService, type Service, type CreateServiceDto } from '../services/serviceService';
import { businessService, type Business } from '../services/businessService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Servicios</h2>
          <p className="text-sm text-content-3 mt-0.5">Administrá los servicios de tu negocio</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openCreate}>Nuevo servicio</Button>
      </div>

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
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-medium text-content">{s.name}</td>
                    <td className="px-4 py-3 text-content-2">{getBusinessName(s.businessId)}</td>
                    <td className="px-4 py-3 text-content-2">{s.durationMin} min</td>
                    <td className="px-4 py-3 font-medium text-content">${s.price != null ? s.price.toLocaleString('es-AR') : '—'}</td>
                    <td className="px-4 py-3 text-content-3 max-w-xs truncate">{s.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded-md text-content-2 hover:bg-surface-3 transition-colors" aria-label="Editar"><EditIcon /></button>
                        <button onClick={() => handleDelete(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger-light transition-colors" aria-label="Eliminar"><TrashIcon /></button>
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
