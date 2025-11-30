import React, { useEffect, useState } from 'react';
import { serviceService, type Service, type CreateServiceDto, type UpdateServiceDto } from '../services/serviceService';
import { businessService, type Business } from '../services/businessService';
import NavBar from '../components/navBar';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<CreateServiceDto>({
    name: '',
    description: '',
    durationMin: 30,
    price: 0,
    businessId: '',
  });

  useEffect(() => {
    fetchServices();
    fetchBusinesses();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceService.getAll();
      setServices(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar servicios');
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
      await serviceService.create(formData);
      setSuccess('Servicio creado exitosamente');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', durationMin: 30, price: 0, businessId: businesses[0]?.id || '' });
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear servicio');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setError(null);
    setSuccess(null);
    try {
      const updateData: UpdateServiceDto = {
        businessId: formData.businessId,
        name: formData.name,
        description: formData.description,
        durationMin: formData.durationMin,
        price: formData.price,
      };
      await serviceService.update(editingService.id, updateData);
      setSuccess('Servicio actualizado exitosamente');
      setEditingService(null);
      setFormData({ name: '', description: '', durationMin:30, price: 0, businessId: businesses[0]?.id || '' });
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar servicio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    setError(null);
    setSuccess(null);
    try {
      await serviceService.delete(id);
      setSuccess('Servicio eliminado exitosamente');
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMin: service.durationMin,
      price: service.price,
      businessId: service.businessId,
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', durationMin: 30, price: 0, businessId: businesses[0]?.id || '' });
  };

  const getBusinessName = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    return business?.name || 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Servicios</h1>

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

          {!showCreateForm && !editingService && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg mb-6 transition-colors"
            >
              Crear Nuevo Servicio
            </button>
          )}

          {(showCreateForm || editingService) && (
            <form onSubmit={editingService ? handleUpdate : handleCreate} className="mb-8 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {editingService ? 'Editar Servicio' : 'Crear Servicio'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre del servicio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
                />
                <select
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  required
                  disabled={!!editingService}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Seleccione un negocio</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={formData.durationMin}
                  onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400"
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 md:col-span-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingService ? 'Actualizar' : 'Crear'}
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
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Negocio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{service.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getBusinessName(service.businessId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{service.durationMin}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${service.price.toFixed(2)}</td>
                      <td className="px-6 py-4">{service.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(service)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
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

export default Services;
