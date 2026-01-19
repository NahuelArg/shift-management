import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/navBar';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: {
    name: string;
    durationMin: number;
  };
  user: {
    name: string;
    email: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  businessId: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

const EmployeeDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserSearchResult | null>(null);
  const [formData, setFormData] = useState({
    serviceId: '',
    date: '',
    startTime: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchBookings();
    }
  }, [user, token]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/bookings/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Transform backend data to frontend format
      const transformedBookings = response.data.map((booking: any) => ({
        ...booking,
        date: new Date(booking.date).toISOString().split('T')[0],
        startTime: new Date(booking.date).toTimeString().slice(0, 5),
        endTime: new Date(booking.endTime).toTimeString().slice(0, 5),
      }));

      setBookings(transformedBookings);

      // Calcular estadísticas
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        today: transformedBookings.filter((b: Booking) => b.date.startsWith(today)).length,
        pending: transformedBookings.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: transformedBookings.filter((b: Booking) => b.status === 'CONFIRMED').length,
        completed: transformedBookings.filter((b: Booking) => b.status === 'COMPLETED').length,
      };
      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Error al cargar los turnos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      await axios.patch(
        `${API_BASE_URL}/bookings/${bookingId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Actualizar la lista localmente
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );

      // Recalcular stats
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      );
      const today = new Date().toISOString().split('T')[0];
      setStats({
        today: updatedBookings.filter((b: Booking) => b.date.startsWith(today)).length,
        pending: updatedBookings.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: updatedBookings.filter((b: Booking) => b.status === 'CONFIRMED').length,
        completed: updatedBookings.filter((b: Booking) => b.status === 'COMPLETED').length,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error al actualizar el estado de la reserva');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString.startsWith(today);
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    // Primero por fecha
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // Luego por hora
    return a.startTime.localeCompare(b.startTime);
  });

  // Load services when modal opens
  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services/my-business`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
      setCreateError('Error al cargar servicios');
    }
  };

  // Search users by email
  const searchUsers = async (email: string) => {
    if (!email || email.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/search`, {
        params: { email: email.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchUsers(value);
  };

  // Select a client from search results
  const selectClient = (client: UserSearchResult) => {
    setSelectedClient(client);
    setSearchQuery(client.email);
    setSearchResults([]);
  };

  // Open modal and load services
  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateError(null);
    loadServices();
  };

  // Close modal and reset form
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedClient(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({ serviceId: '', date: '', startTime: '' });
    setCreateError(null);
  };

  // Get selected service details
  const selectedService = services.find((s) => s.id === formData.serviceId);

  // Calculate end time based on service duration
  const calculateEndTime = (startTime: string, durationMin: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMin;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Submit new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      setCreateError('Debes seleccionar un cliente');
      return;
    }

    if (!formData.serviceId || !formData.date || !formData.startTime) {
      setCreateError('Todos los campos son requeridos');
      return;
    }

    if (!selectedService) {
      setCreateError('Servicio no encontrado');
      return;
    }

    if (!selectedService.businessId) {
      setCreateError('El servicio no tiene un negocio asignado');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      // Create local date time (user's timezone, not UTC)
      // This interprets the date/time as local time, not UTC
      const localDateTime = new Date(`${formData.date}T${formData.startTime}:00`);

      // Convert to ISO string (will include proper timezone offset)
      const dateTimeISO = localDateTime.toISOString();

      await axios.post(
        `${API_BASE_URL}/bookings`,
        {
          userId: selectedClient.id,
          serviceId: formData.serviceId,
          businessId: selectedService.businessId,
          date: dateTimeISO,
          finalPrice: selectedService.price,
          timezone: 'America/Argentina/Buenos_Aires',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh bookings list
      await fetchBookings();
      closeCreateModal();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setCreateError(
        error.response?.data?.message || 'Error al crear la reserva. Por favor, intenta de nuevo.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Panel de Empleado - {user?.name}
                </h1>
                <p className="text-gray-600">
                  Gestiona y actualiza el estado de las reservas
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nueva Reserva
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.today}</div>
              <div className="text-purple-100">Turnos Hoy</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.pending}</div>
              <div className="text-yellow-100">Pendientes</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.confirmed}</div>
              <div className="text-green-100">Confirmados</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.completed}</div>
              <div className="text-blue-100">Completados</div>
            </div>
          </div>

          {/* Lista de Reservas */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Turnos Asignados
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchBookings}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando turnos...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No hay turnos asignados
                </h3>
                <p className="mt-1 text-gray-500">
                  No tienes turnos pendientes en este momento
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      isToday(booking.date)
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {isToday(booking.date) && (
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                                HOY
                              </span>
                            )}
                            <h3 className="text-lg font-semibold text-gray-800">
                              {booking.service.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="font-medium">
                                {booking.user.name}
                              </span>
                              <span className="text-gray-400">
                                ({booking.user.email})
                              </span>
                            </p>
                            <p className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {formatDate(booking.date)}
                            </p>
                            <p className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {booking.startTime} - {booking.endTime} (
                              {booking.service.durationMin} min)
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6 text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            ${booking.finalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                            disabled={
                              updatingStatus === booking.id ||
                              booking.status === 'CONFIRMED'
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {updatingStatus === booking.id
                              ? 'Actualizando...'
                              : booking.status === 'CONFIRMED'
                              ? '✓ Confirmado'
                              : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                            disabled={updatingStatus === booking.id}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {updatingStatus === booking.id
                              ? 'Actualizando...'
                              : 'Completar'}
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            disabled={updatingStatus === booking.id}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            {updatingStatus === booking.id
                              ? 'Actualizando...'
                              : 'Cancelar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear reserva */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Nueva Reserva</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {createError}
                </div>
              )}

              {/* Búsqueda de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Buscar por email..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={creating}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectClient(result)}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.email}</div>
                        {result.phone && (
                          <div className="text-sm text-gray-500">{result.phone}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Cliente seleccionado */}
                {selectedClient && (
                  <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{selectedClient.name}</div>
                        <div className="text-sm text-gray-600">{selectedClient.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient(null);
                          setSearchQuery('');
                        }}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selección de servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicio *
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating || services.length === 0}
                  required
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price.toLocaleString()} ({service.durationMin} min)
                    </option>
                  ))}
                </select>
                {services.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">No hay servicios disponibles</p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                  required
                />
              </div>

              {/* Hora de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de inicio *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                  required
                />
              </div>

              {/* Resumen */}
              {selectedService && formData.startTime && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-gray-800">Resumen de la Reserva</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Servicio:</span> {selectedService.name}
                    </p>
                    <p>
                      <span className="font-medium">Duración:</span> {selectedService.durationMin} minutos
                    </p>
                    <p>
                      <span className="font-medium">Hora fin:</span>{' '}
                      {calculateEndTime(formData.startTime, selectedService.durationMin)}
                    </p>
                    <p className="text-lg font-bold text-purple-600 pt-2">
                      Precio: ${selectedService.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={creating || !selectedClient || !formData.serviceId || !formData.date || !formData.startTime}
                >
                  {creating ? 'Creando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
