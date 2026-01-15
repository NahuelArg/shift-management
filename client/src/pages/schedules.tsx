import React, { useEffect, useState } from 'react';
import { scheduleService, type Schedule, type CreateScheduleDto,  type UpdateScheduleDto } from '../services/scheduleService';
import { businessService, type Business } from '../services/businessService';
import NavBar from '../components/navBar';

const daysOfWeek = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState<CreateScheduleDto>({
    dayOfWeek: 1,
    from: '09:00',
    to: '18:00',
    businessId: '',
  });

  useEffect(() => {
    fetchSchedules();
    fetchBusinesses();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleService.getAll();
      setSchedules(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await businessService.getAll();
      setBusinesses(data);
      if (data.length > 0 && !formData.businessId) {
        setFormData({ ...formData, businessId: data[0].id });
      }
    } catch (err: any) {
      console.error('Error al cargar negocios:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await scheduleService.create(formData);
      setSuccess('Horario creado exitosamente');
      setShowCreateForm(false);
      setFormData({ dayOfWeek: 1, from: '09:00', to: '18:00', businessId: businesses[0]?.id || '' });
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear horario');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setError(null);
    setSuccess(null);
    try {
      const updateData: UpdateScheduleDto = {
        from: formData.from,
        to: formData.to,
        dayOfWeek: formData.dayOfWeek,
      };
      await scheduleService.update(editingSchedule.id, updateData);
      setSuccess('Horario actualizado exitosamente');
      setEditingSchedule(null);
      setFormData({ dayOfWeek: 1, from: '09:00', to: '18:00', businessId: businesses[0]?.id || '' });
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar horario');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;
    setError(null);
    setSuccess(null);
    try {
      await scheduleService.delete(id);
      setSuccess('Horario eliminado exitosamente');
      fetchSchedules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar horario');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      from: schedule.from,
      to: schedule.to,
      businessId: schedule.businessId,
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setFormData({ dayOfWeek: 1, from: '09:00', to: '18:00', businessId: businesses[0]?.id || '' });
  };

  const getBusinessName = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    return business?.name || 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Horarios</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {!showCreateForm && !editingSchedule && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg mb-6 transition-colors"
            >
              Crear Nuevo Horario
            </button>
          )}

          {(showCreateForm || editingSchedule) && (
            <form onSubmit={editingSchedule ? handleUpdate : handleCreate} className="mb-8 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {editingSchedule ? 'Editar Horario' : 'Crear Horario'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  required
                  disabled={!!editingSchedule}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">Seleccione un negocio</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
                <input
                  type="time"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingSchedule ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    handleCancelEdit();
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Negocio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Día
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Hora Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Hora Fin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{getBusinessName(schedule.businessId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                          {daysOfWeek[schedule.dayOfWeek]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{schedule.from}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{schedule.to}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedules;
