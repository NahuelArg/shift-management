import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm, { type CreateBookingData } from '../components/bookingManagement/BookingForm';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import BookingStatusButton from '../components/bookingManagement/BookingStatusButton';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';

interface Booking {
  id: string;
  status: string;
  date: string;
  endTime: string;
  finalPrice: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Bookings = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch {
      toast('Error al cargar las reservas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchBookings(); }, [token]);

  const handleCreate = async (data: CreateBookingData) => {
    try {
      await createBooking(data);
      toast('Reserva creada exitosamente', 'success');
      setShowForm(false);
      fetchBookings();
    } catch (err: any) {
      toast(err.message || 'Error al crear la reserva', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-content">Turnos</h2>
          <p className="text-sm text-content-3 mt-0.5">Creá y gestioná tus reservas</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-content-inverse rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          {showForm ? 'Ocultar formulario' : '+ Nueva reserva'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl shadow-card border border-border p-6 animate-fade-in">
          <h3 className="text-base font-semibold text-content mb-4">Nueva reserva</h3>
          <BookingForm role="CLIENT" onSubmit={handleCreate} />
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card border border-border p-5">
        <h3 className="text-base font-semibold text-content mb-4">Mis reservas</h3>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-content-3 text-sm gap-2">
            <svg className="animate-spin-slow w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Cargando…
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-content-3 text-sm">No hay reservas disponibles</div>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map(b => (
              <div key={b.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <StatusBadge label={b.status} variant={bookingStatusVariant(b.status)} />
                  <div>
                    <p className="text-sm font-medium text-content">
                      {new Date(b.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(b.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(b.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-content-3 mt-0.5">${b.finalPrice?.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <BookingStatusButton
                  bookingId={b.id}
                  currentStatus={b.status}
                  onStatusUpdate={fetchBookings}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
