import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface BookingStatusProps {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingId: string;
  onStatusChange: (bookingId: string, newStatus: string) => Promise<void>;
}

const BookingStatus: React.FC<BookingStatusProps> = ({
  status,
  bookingId,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
  };

  const handleStatusChange = async (newStatus: string) => {
    setError(null);
    setLoading(true);
    try {
      await onStatusChange(bookingId, newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  // Solo admin puede cambiar el estado
  if (user?.role !== 'ADMIN') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.toLowerCase()}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="COMPLETED">Completed</option>
      </select>

      {loading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default BookingStatus;
