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

const BusinessPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState<CreateBusinessDto>({ name: '' });
  const [submitting, setSubmitting] = useState(false);

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
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-content">Negocios</h2>
          <p className="text-sm text-content-3 mt-0.5">Administrá tus negocios y sus servicios</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openCreate}>Nuevo negocio</Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left — business list */}
        <aside className="w-64 shrink-0 bg-surface rounded-xl shadow-card border border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
            <p className="text-xs font-bold text-content-3 uppercase tracking-wider">
              Mis negocios ({businesses.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="text-center py-8 text-content-3 text-sm">Cargando…</p>
            ) : businesses.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-content-2 text-sm font-medium">Sin negocios</p>
                <Button size="sm" leftIcon={<PlusIcon />} onClick={openCreate}>Crear</Button>
              </div>
            ) : businesses.map(b => (
              <button
                key={b.id}
                onClick={() => { setSelectedBusiness(b); openServices(b); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all
                  ${selectedBusiness?.id === b.id
                    ? 'bg-info/10 border-l-2 border-info'
                    : 'hover:bg-surface-2 border-l-2 border-transparent'}`}
              >
                <div className="w-9 h-9 rounded-xl bg-info-light flex items-center justify-center shrink-0">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" className="text-info"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9m0 0h6m-6 0v12m6-12v12"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content truncate">{b.name}</p>
                  <p className="text-xs text-content-3">{businessServices.length && selectedBusiness?.id === b.id ? `${businessServices.length} servicios` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right — detail */}
        {selectedBusiness ? (
          <div className="flex-1 min-w-0 overflow-y-auto space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between bg-surface rounded-xl shadow-card border border-border p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-info-light border border-info/20 flex items-center justify-center shrink-0">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" className="text-info"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9m0 0h6m-6 0v12m6-12v12"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-content">{selectedBusiness.name}</h3>
                  <p className="text-sm text-content-3">
                    {new Date(selectedBusiness.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(selectedBusiness)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-content-2 hover:border-info hover:text-info transition-colors"
                >
                  <EditIcon /> Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedBusiness.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-content-3 hover:border-danger hover:text-danger hover:bg-danger-light transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-content">Servicios</p>
                <Button size="sm" leftIcon={<PlusIcon />} onClick={() => setShowServiceForm(v => !v)}>
                  {showServiceForm ? 'Cancelar' : 'Añadir'}
                </Button>
              </div>

              {showServiceForm && (
                <form onSubmit={handleCreateService} className="p-5 border-b border-border bg-surface-2 flex flex-col gap-3">
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
                <p className="text-center py-10 text-content-3 text-sm">Sin servicios — añadí el primero</p>
              ) : (
                <div className="divide-y divide-border">
                  {businessServices.map(s => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors">
                      <div>
                        <p className="font-medium text-content text-sm">{s.name}</p>
                        <p className="text-xs text-content-3 font-mono">{s.durationMin} min · ${s.price?.toLocaleString('es-AR')}</p>
                      </div>
                      <button onClick={() => handleDeleteService(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-content-3 hover:border-danger hover:text-danger hover:bg-danger-light transition-colors"><TrashIcon /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-content-3 text-sm bg-surface rounded-xl shadow-card border border-border">
            Seleccioná un negocio para ver el detalle
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
    </div>
  );
};

export default BusinessPage;
