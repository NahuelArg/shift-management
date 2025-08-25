import { useState } from 'react';
import { updateBookingStatus } from '../../services/bookingService';

interface BookingStatusButtonProps {
    bookingId: string;
    currentStatus: string;
    onStatusUpdate: () => void;
}

const BookingStatusButton = ({ bookingId, currentStatus, onStatusUpdate }: BookingStatusButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const getNextStatus = (current: string) => {
        switch (current) {
            case 'PENDING':
                return 'CONFIRMED';
            case 'CONFIRMED':
                return 'CANCELLED';
            case 'CANCELLED':
                return 'PENDING';
            default:
                return 'PENDING';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500';
            case 'CONFIRMED':
                return 'bg-green-500';
            case 'CANCELLED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const handleStatusChange = async () => {
        try {
            setIsLoading(true);
            const nextStatus = getNextStatus(currentStatus);
            await updateBookingStatus(bookingId, nextStatus);
            onStatusUpdate();
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert('Error al actualizar el estado de la reserva');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleStatusChange}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${getStatusColor(currentStatus)} ${isLoading ? 'opacity-50' : 'hover:opacity-80'}`}
        >
            {isLoading ? 'Actualizando...' : currentStatus}
        </button>
    );
};

export default BookingStatusButton;
