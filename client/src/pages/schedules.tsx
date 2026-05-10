import React, { useEffect, useState } from 'react';
import { scheduleService, type Schedule, type CreateScheduleDto, type UpdateScheduleDto } from '../services/scheduleService';
import { businessService, type Business } from '../services/businessService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

const DAYS       = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

const emptyForm: CreateScheduleDto = { dayOfWeek: 1, from: '09:00', to: '18:00', businessId: '' };

const Schedules: React.FC = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<CreateScheduleDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [viewBizId, setViewBizId] = useState('');

  useEffect(() => { fetchSchedules(); fetchBusinesses(); }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try { setSchedules(await scheduleService.getAll()); }
    catch (err: any) { toast(err.response?.data?.message || 'Error al cargar horarios', 'error'); }
    finally { setLoading(false); }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await businessService.getAll();
      setBusinesses(data);
      if (data.length > 0) {
        setFormData(f => ({ ...f, businessId: f.businessId || data[0].id }));
        setViewBizId(v => v || data[0].id);
      }
    } catch { /* silent */ }
  };

  const openCreate = () => {
    setEditingSchedule(null);
    setFormData({ ...emptyForm, businessId: businesses[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditingSchedule(s);
    setFormData({ dayOfWeek: s.dayOfWeek, from: s.from, to: s.to, businessId: s.businessId });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from >= formData.to) {
      toast('La hora de inicio debe ser anterior a la hora de fin', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingSchedule) {
        const upd: UpdateScheduleDto = { from: formData.from, to: formData.to, dayOfWeek: formData.dayOfWeek };
        await scheduleService.update(editingSchedule.id, upd);
        toast('Horario actualizado', 'success');
      } else {
        await scheduleService.create(formData);
        toast('Horario creado', 'success');
      }
      setShowModal(false);
      fetchSchedules();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    try {
      await scheduleService.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast('Horario eliminado', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const getBusinessName = (id: string) => businesses.find(b => b.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Horarios</h2>
          <p className="text-sm text-content-3 mt-0.5">Configurá los horarios de atención de tu negocio</p>
        </div>
        <Button leftIcon={<PlusIcon />} onClick={openCreate}>Nuevo horario</Button>
      </div>

      {/* Weekly visual grid */}
      <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-semibold text-content">Vista semanal</p>
          {businesses.length > 1 && (
            <select
              value={viewBizId}
              onChange={e => setViewBizId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-content focus:border-primary outline-none"
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        <div className="grid grid-cols-7">
          {[0,1,2,3,4,5,6].map(dayIdx => {
            const daySchedules = schedules.filter(s => s.businessId === viewBizId && s.dayOfWeek === dayIdx);
            const isWeekend = dayIdx === 0 || dayIdx === 6;
            return (
              <div
                key={dayIdx}
                className={`p-3 min-h-[80px] border-r border-border last:border-r-0
                  ${daySchedules.length > 0 ? '' : 'bg-surface-2'}
                  ${isWeekend && daySchedules.length === 0 ? 'opacity-50' : ''}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider mb-2
                  ${daySchedules.length > 0 ? 'text-primary' : 'text-content-3'}`}>
                  {DAYS_SHORT[dayIdx]}
                </p>
                {daySchedules.length > 0 ? (
                  daySchedules.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openEdit(s)}
                      className="w-full text-left px-2 py-1.5 rounded-md mb-1 bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors"
                    >
                      <p className="text-xs font-bold text-primary font-mono">{s.from}–{s.to}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-content-3 italic">Cerrado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedules table */}
      <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-content-3 text-sm">Cargando…</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-2 font-medium">No hay horarios configurados</p>
            <p className="text-sm text-content-3 mt-1">Definí los días y horarios en que abrís</p>
            <Button className="mt-4" leftIcon={<PlusIcon />} onClick={openCreate}>Crear horario</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  {['Negocio', 'Día', 'Apertura', 'Cierre', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-content-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedules.map(s => (
                  <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-content-2">{getBusinessName(s.businessId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {DAYS[s.dayOfWeek]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-content">{s.from}</td>
                    <td className="px-4 py-3 font-mono text-content">{s.to}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded-md text-content-2 hover:bg-surface-3 transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDelete(s.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger-light transition-colors"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingSchedule ? 'Editar horario' : 'Nuevo horario'} size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Negocio" value={formData.businessId} onChange={e => setFormData(p => ({ ...p, businessId: e.target.value }))} required disabled={!!editingSchedule}>
            <option value="">Seleccioná un negocio</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select label="Día de la semana" value={formData.dayOfWeek} onChange={e => setFormData(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }))} required>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Apertura" type="time" value={formData.from} onChange={e => setFormData(p => ({ ...p, from: e.target.value }))} required />
            <Input label="Cierre" type="time" value={formData.to} onChange={e => setFormData(p => ({ ...p, to: e.target.value }))} required />
          </div>
          {formData.from && formData.to && (() => {
            const [h1, m1] = formData.from.split(':').map(Number);
            const [h2, m2] = formData.to.split(':').map(Number);
            const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (mins <= 0) return (
              <p className="text-xs text-danger bg-danger-light px-3 py-2 rounded-lg">
                La hora de cierre debe ser posterior a la de apertura
              </p>
            );
            return (
              <p className="text-xs text-primary bg-primary-light px-3 py-2 rounded-lg font-medium">
                Duración: {Math.floor(mins / 60)}h {mins % 60 > 0 ? `${mins % 60}m` : ''}
              </p>
            );
          })()}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={submitting} className="flex-1">{editingSchedule ? 'Guardar' : 'Crear'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedules;
