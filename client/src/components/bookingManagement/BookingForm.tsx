import React, { useState, useEffect } from 'react';
import ServiceSelector from './ServiceSelector';
import { useAuth } from '../../hooks/useAuth';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMin: number;
  businessId: string;
}

interface BookingFormProps {
  onSubmit: (bookingData: CreateBookingData) => Promise<void>;
  isEditing?: boolean;
  businessId?: string;
}

export interface CreateBookingData {
  serviceId: string;
  businessId: string;
  date: string;  // Format: "2025-07-18T18:00:00.000Z"
  timezone: string;  // Format: "America/Argentina/Buenos_Aires"
  finalPrice: number;
}

export interface BookingData extends CreateBookingData {
  id: string;
  userId: string;
  endTime: Date;
  finalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  notes?: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  isEditing = false,
  businessId,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');

  const [bookingData, setBookingData] = useState<CreateBookingData>({
    serviceId: '',
    businessId: '',
    date: new Date().toISOString().split('T')[0], // Just the date part initially
    timezone: "America/Argentina/Buenos_Aires",
    finalPrice: 0
  });

  useEffect(() => {
    if (selectedService) {
      setBookingData(prev => ({
        ...prev,
        serviceId: selectedService.id,
        businessId: selectedService.businessId,
        finalPrice: selectedService.price
      }));
    }
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!token) {
      setError('You must be logged in to create a booking');
      setLoading(false);
      return;
    }

    if (!selectedService || !bookingData.date || !startTime) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Convert the date and time to an ISO string in the correct timezone
      const [year, month, day] = bookingData.date.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const dateTime = new Date(year, month - 1, day, hours, minutes);
      
      const submitData: CreateBookingData = {
        serviceId: selectedService.id,
        businessId: selectedService.businessId,
        date: dateTime.toISOString(),
        timezone: "America/Argentina/Buenos_Aires",
        finalPrice: selectedService.price
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the booking');
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <ServiceSelector
            businessId={businessId}
            onServiceSelect={(service) => setSelectedService(service)}
            
            selectedServiceId={bookingData.serviceId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={bookingData.date.split('T')[0]} // Extract only the date part from ISO string
            onChange={(e) => setBookingData(prev => ({...prev, date: e.target.value}))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm mt-2">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading || !selectedService}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Booking' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
