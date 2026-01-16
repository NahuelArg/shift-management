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
  business: {
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
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
      const response = await axios.get(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookingsData = response.data;
      setBookings(bookingsData);

      // Calcular estadísticas
      const stats = {
        total: bookingsData.length,
        pending: bookingsData.filter((b: Booking) => b.status === 'PENDING').length,
        confirmed: bookingsData.filter((b: Booking) => b.status === 'CONFIRMED').length,
        cancelled: bookingsData.filter((b: Booking) => b.status === 'CANCELLED').length,
      };
      setStats(stats);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Error al cargar las reservas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ¡Bienvenido, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Aquí puedes ver y gestionar todas tus reservas
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-blue-100">Total de Reservas</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.pending}</div>
              <div className="text-yellow-100">Pendientes</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.confirmed}</div>
              <div className="text-green-100">Confirmadas</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">{stats.cancelled}</div>
              <div className="text-red-100">Canceladas</div>
            </div>
          </div>

          {/* Lista de Reservas */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Mis Reservas
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando reservas...</p>
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
                  No tienes reservas
                </h3>
                <p className="mt-1 text-gray-500">
                  Comienza creando tu primera reserva
                </p>
                <div className="mt-6">
                  <a
                    href="/bookings"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Crear Reserva
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {booking.service.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="font-medium">
                              {booking.business.name}
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
                        <div className="text-2xl font-bold text-blue-600">
                          ${booking.finalPrice.toLocaleString()}
                        </div>
                      </div>
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

export default Dashboard;
