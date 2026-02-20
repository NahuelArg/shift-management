import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/navBar';
import BookingForm, { type CreateBookingData } from '../components/bookingManagement/BookingForm';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import BookingStatusButton from '../components/bookingManagement/BookingStatusButton';

interface Booking {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    finalPrice: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Bookings = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bookings/my-bookings`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchBookings();
    }, [token]);

    const handleCreateBooking = async (data: CreateBookingData) => {
        try {
            await createBooking(data);
            setCreateSuccess('Reserva creada exitosamente');
            setTimeout(() => setCreateSuccess(null), 4000);
            fetchBookings();
        } catch (err: any) {
            setCreateError(err.message || 'Error al crear la reserva');
            setTimeout(() => setCreateError(null), 5000);
        }
    };

    return (
        <>
            <NavBar />
            <div className="container mx-auto p-4 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6">Reservas</h1>

                {/* Nueva Reserva */}
                <section className="mb-8 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Nueva Reserva</h2>
                    {createSuccess && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            {createSuccess}
                        </div>
                    )}
                    {createError && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {createError}
                        </div>
                    )}
                    <BookingForm role="CLIENT" onSubmit={handleCreateBooking} />
                </section>

                {/* Mis Reservas */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">Mis Reservas</h2>
                    {loading ? (
                        <p className="text-center text-gray-500">Cargando reservas...</p>
                    ) : (
                        <div className="grid gap-4">
                            {bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="p-4 border rounded-lg shadow-sm bg-white"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p>Fecha: {new Date(booking.startTime).toLocaleDateString('es-AR')}</p>
                                            <p>Hora: {new Date(booking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p>Precio: ${booking.finalPrice}</p>
                                        </div>
                                        <BookingStatusButton
                                            bookingId={booking.id}
                                            currentStatus={booking.status}
                                            onStatusUpdate={fetchBookings}
                                        />
                                    </div>
                                </div>
                            ))}
                            {bookings.length === 0 && (
                                <p className="text-center text-gray-500">No hay reservas disponibles</p>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default Bookings;
