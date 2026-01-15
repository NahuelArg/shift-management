import React, { useEffect, useState } from 'react';
import {
  businessService,
  serviceService,
  type Business,
  type Service,
  type CreateBusinessDto,
  type UpdateBusinessDto,
} from '../services/businessService';
import {useAuth} from  '../context/AuthContext';
import NavBar from '../components/navBar';



const BusinessPage: React.FC = () => {
  const { user } = useAuth();
  // Estado: Negocios
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado: Formulario de negocio
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    ownerId: user?.id || '',
  });


  // Estado: Servicios
  const [selectedBusinessServices, setSelectedBusinessServices] = useState<Service[]>([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedBusinessForServices, setSelectedBusinessForServices] = useState<Business | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationMin: '',
  });

  // Cargar negocios al montar
  useEffect(() => {
    fetchBusinesses();
  }, [user?.id]);

  // Actualizar ownerId cuando el usuario cambia
useEffect(() => {
  setFormData(prev => ({
    ...prev,
    ownerId: user?.id || '',
  }));
}, [user?.id]);

  // ===== NEGOCIOS =====

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await businessService.getAll();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerId) {
    setError('Debes seleccionar un propietario');
    return;
  }
  if (!formData.name.trim()) {
    setError('El nombre del negocio es obligatorio');
    return;
  }
    setError(null);
    setSuccess(null);

    try {
      await businessService.create(formData);
      setSuccess('Negocio creado exitosamente');
      setShowCreateForm(false);
      setFormData({ name: '', ownerId: user?.id || '' });
      fetchBusinesses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear negocio');
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();

   if (!editingBusiness) {
    setError('No hay negocio en edición');
    return;
  }
  if (!formData.name.trim()) {
    setError('El nombre del negocio es obligatorio');
    return;
  }
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateBusinessDto = {
        name: formData.name,
      };
      await businessService.update(editingBusiness.id, updateData);
      setSuccess('Negocio actualizado exitosamente');
      setEditingBusiness(null);
      setFormData({ name: '', ownerId: user?.id || '' });
      fetchBusinesses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar negocio');
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este negocio?')) return;

    setError(null);
    setSuccess(null);

    try {
      await businessService.delete(id);
      setSuccess('Negocio eliminado exitosamente');
      fetchBusinesses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar negocio');
    }
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      ownerId: business.ownerId,
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingBusiness(null);
    setShowCreateForm(false);
    setFormData({ name: '', ownerId: user?.id || '' });
  };

  // ===== SERVICIOS =====

  const fetchServices = async (businessId: string) => {
    try {
      const services = await serviceService.getByBusinessId(businessId);
      setSelectedBusinessServices(services);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar servicios');
    }
  };

  const handleViewServices = (business: Business) => {
    setSelectedBusinessForServices(business);
    setShowServicesModal(true);
    fetchServices(business.id);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessForServices) return;

    setError(null);
    setSuccess(null);

    try {
      await serviceService.create({
        name: serviceFormData.name,
        description: serviceFormData.description || undefined,
        price: serviceFormData.price ? parseFloat(serviceFormData.price) : undefined,
        durationMin: serviceFormData.durationMin ? parseInt(serviceFormData.durationMin) : undefined,
        businessId: selectedBusinessForServices.id,
      });

      setSuccess('Servicio creado exitosamente');
      setServiceFormData({ name: '', description: '', price: '', durationMin: '' });
      setShowServiceForm(false);
      
      // Recarga servicios
      fetchServices(selectedBusinessForServices.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear servicio');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;

    setError(null);
    setSuccess(null);

    try {
      await serviceService.delete(serviceId);
      setSuccess('Servicio eliminado exitosamente');
      
      if (selectedBusinessForServices) {
        fetchServices(selectedBusinessForServices.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Negocios</h1>

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

          {/* Botón crear negocio */}
          {!showCreateForm && !editingBusiness && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg mb-6 transition-colors"
            >
              Crear Nuevo Negocio
            </button>
          )}

          {/* Formulario crear/editar negocio */}
          {(showCreateForm || editingBusiness) && (
            <form
              onSubmit={editingBusiness ? handleUpdateBusiness : handleCreateBusiness}
              className="mb-8 bg-gray-50 p-6 rounded-lg"
            >
              <h2 className="text-xl font-semibold mb-4">
                {editingBusiness ? 'Editar Negocio' : 'Crear Negocio'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre del negocio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {editingBusiness ? 'Actualizar' : 'Crear'}
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

          {/* Tabla de negocios */}
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
                      Servicios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{business.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewServices(business)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Ver Servicios ({business.services?.length})
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditBusiness(business)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteBusiness(business.id)}
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

      {/* Modal de servicios */}
      {showServicesModal && selectedBusinessForServices && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Servicios: {selectedBusinessForServices.name}
              </h2>
              <button
                onClick={() => setShowServicesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {!showServiceForm && (
              <button
                onClick={() => setShowServiceForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mb-4"
              >
                Agregar Servicio
              </button>
            )}

            {showServiceForm && (
              <form onSubmit={handleCreateService} className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Nuevo Servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del servicio"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={serviceFormData.description}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    placeholder="Precio (opcional)"
                    value={serviceFormData.price}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                    step="0.01"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    placeholder="Duración en minutos (opcional)"
                    value={serviceFormData.durationMin}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, durationMin: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowServiceForm(false);
                      setServiceFormData({ name: '', description: '', price: '', durationMin: '' });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {selectedBusinessServices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay servicios registrados</p>
            ) : (
              <div className="space-y-3">
                {selectedBusinessServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-600">{service.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm">
                          {service.price && <span className="text-green-600">Precio: ${service.price}</span>}
                          {service.durationMin && <span className="text-blue-600">Duración: {service.durationMin} min</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm ml-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowServicesModal(false)}
              className="w-full mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPage;