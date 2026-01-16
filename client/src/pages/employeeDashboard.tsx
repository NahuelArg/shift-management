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

      const bookingsData = response.data;
      setBookings(bookingsData);

      // Calcular estadísticas
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        today: bookingsData.filter((b: Booking) => b.date.startsWith(today)).length,
        pending: bookingsData.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: bookingsData.filter((b: Booking) => b.status === 'CONFIRMED').length,
        completed: bookingsData.filter((b: Booking) => b.status === 'COMPLETED').length,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Panel de Empleado - {user?.name}
            </h1>
            <p className="text-gray-600">
              Gestiona y actualiza el estado de las reservas
            </p>
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
    </div>
  );
};

export default EmployeeDashboard;
