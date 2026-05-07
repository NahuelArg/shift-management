import React, { useEffect, useState } from 'react';
import {
  businessService,
  serviceService,
  type Business,
  type Service,
  type CreateBusinessDto,
} from '../services/businessService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
const EyeIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const BusinessPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState<CreateBusinessDto>({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessServices, setBusinessServices] = useState<Service[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', durationMin: '' });
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  useEffect(() => { fetchBusinesses(); }, [user?.id]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try { setBusinesses(await businessService.getAll()); }
    catch (err: any) { toast(err.response?.data?.message || 'Error al cargar negocios', 'error'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingBusiness(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const openEdit = (b: Business) => {
    setEditingBusiness(b);
    setFormData({ name: b.name });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast('El nombre es obligatorio', 'error'); return; }
    setSubmitting(true);
    try {
      if (editingBusiness) {
        await businessService.update(editingBusiness.id, { name: formData.name });
        toast('Negocio actualizado', 'success');
      } else {
        await businessService.create(formData);
        toast('Negocio creado', 'success');
      }
      setShowModal(false);
      fetchBusinesses();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este negocio? Se eliminarán todos sus datos.')) return;
    try {
      await businessService.delete(id);
      setBusinesses(prev => prev.filter(b => b.id !== id));
      toast('Negocio eliminado', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const openServices = async (b: Business) => {
    setSelectedBusiness(b);
    setShowServicesModal(true);
    setShowServiceForm(false);
    try { setBusinessServices(await serviceService.getByBusinessId(b.id)); }
    catch { toast('Error al cargar servicios', 'error'); }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    setServiceSubmitting(true);
    try {
      await serviceService.create({
        name: serviceForm.name,
        description: serviceForm.description || undefined,
        price: serviceForm.price ? parseFloat(serviceForm.price) : undefined,
        durationMin: serviceForm.durationMin ? parseInt(serviceForm.durationMin) : undefined,
        businessId: selectedBusiness.id,
      });
      toast('Servicio creado', 'success');
      setServiceForm({ name: '', description: '', price: '', durationMin: '' });
      setShowServiceForm(false);
      setBusinessServices(await serviceService.getByBusinessId(selectedBusiness.id));
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al crear servicio', 'error');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await serviceService.delete(serviceId, selectedBusiness!.id);
      setBusinessServices(prev => prev.filter(s => s.id !== serviceId));
      toast('Servicio eliminado', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Negocios</h2>
          <p className="text-sm text-content-3 mt-0.5">Administrá tus negocios y sus servicios</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openCreate}>Nuevo negocio</Button>
      </div>

      <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-content-3 text-sm">Cargando…</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-2 font-medium">No hay negocios</p>
            <p className="text-sm text-content-3 mt-1">Creá tu primer negocio para comenzar</p>
            <Button className="mt-4" leftIcon={<PlusIcon />} onClick={openCreate}>Crear negocio</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  {['Nombre', 'Propietario', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {businesses.map(b => (
                  <tr key={b.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-medium text-content">{b.name}</td>
                    <td className="px-4 py-3 text-content-3 font-mono text-xs">{b.ownerId?.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openServices(b)} className="w-7 h-7 flex items-center justify-center rounded-md text-info hover:bg-info-light transition-colors" title="Ver servicios"><EyeIcon /></button>
                        <button onClick={() => openEdit(b)} className="w-7 h-7 flex items-center justify-center rounded-md text-content-2 hover:bg-surface-3 transition-colors" title="Editar"><EditIcon /></button>
                        <button onClick={() => handleDelete(b.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger-light transition-colors" title="Eliminar"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Business form modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingBusiness ? 'Editar negocio' : 'Nuevo negocio'} size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre del negocio" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={submitting} className="flex-1">{editingBusiness ? 'Guardar' : 'Crear'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Services modal */}
      <Modal open={showServicesModal} onClose={() => setShowServicesModal(false)} title={`Servicios · ${selectedBusiness?.name ?? ''}`} size="md">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" leftIcon={<PlusIcon />} onClick={() => setShowServiceForm(v => !v)}>
              {showServiceForm ? 'Cancelar' : 'Añadir servicio'}
            </Button>
          </div>

          {showServiceForm && (
            <form onSubmit={handleCreateService} className="bg-surface-2 rounded-xl p-4 flex flex-col gap-3">
              <Input label="Nombre" value={serviceForm.name} onChange={e => setServiceForm(p => ({ ...p, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Precio ($)" type="number" min="0" step="0.01" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))} />
                <Input label="Duración (min)" type="number" min="1" value={serviceForm.durationMin} onChange={e => setServiceForm(p => ({ ...p, durationMin: e.target.value }))} />
              </div>
              <Input label="Descripción" value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} />
              <Button type="submit" size="sm" loading={serviceSubmitting}>Crear servicio</Button>
            </form>
          )}

          {businessServices.length === 0 ? (
            <p className="text-center py-6 text-content-3 text-sm">No hay servicios para este negocio</p>
          ) : (
            <div className="divide-y divide-border">
              {businessServices.map(s => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-content text-sm">{s.name}</p>
                    <p className="text-xs text-content-3">{s.durationMin} min · ${s.price?.toLocaleString('es-AR')}</p>
                  </div>
                  <button onClick={() => handleDeleteService(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger-light transition-colors"><TrashIcon /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BusinessPage;
