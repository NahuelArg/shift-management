import React, { useEffect, useState } from 'react';
import { businessService, Business, CreateBusinessDto, UpdateBusinessDto } from '../services/businessService';
import NavBar from '../components/navBar';

const BusinessPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await businessService.create(formData);
      setSuccess('Negocio creado exitosamente');
      setShowCreateForm(false);
      setFormData({ name: '', address: '', phone: '', email: '' });
      fetchBusinesses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear negocio');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;
    setError(null);
    setSuccess(null);
    try {
      const updateData: UpdateBusinessDto = formData;
      await businessService.update(editingBusiness.id, updateData);
      setSuccess('Negocio actualizado exitosamente');
      setEditingBusiness(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
      fetchBusinesses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar negocio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este negocio?')) return;
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

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
    });
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingBusiness(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
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

          {!showCreateForm && !editingBusiness && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg mb-6 transition-colors"
            >
              Crear Nuevo Negocio
            </button>
          )}

          {(showCreateForm || editingBusiness) && (
            <form onSubmit={editingBusiness ? handleUpdate : handleCreate} className="mb-8 bg-gray-50 p-6 rounded-lg">
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
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  placeholder="Dirección (opcional)"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dirección
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
                      <td className="px-6 py-4 whitespace-nowrap">{business.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{business.phone || '-'}</td>
                      <td className="px-6 py-4">{business.address || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(business)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(business.id)}
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

export default BusinessPage;
