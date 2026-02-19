import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingStatusButton from '../components/bookingManagement/BookingStatusButton';

interface Booking {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    finalPrice: number;
    // Agrega más campos según necesites
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const Bookings = () => {
    const [bookings, setBookings] = useState<Booking[]>( []);
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/bookings`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Error al cargar las reservas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando reservas...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reservas</h1>
            <div className="grid gap-4">
                {bookings.map((booking) => (
                    <div 
                        key={booking.id} 
                        className="p-4 border rounded-lg shadow-sm bg-white"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p>Fecha: {new Date(booking.startTime).toLocaleDateString()}</p>
                                <p>Hora: {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}</p>
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
        </div>
    );
};

export default Bookings;