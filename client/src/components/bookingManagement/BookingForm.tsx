import React, { useState, useEffect } from 'react';
import ServiceSelector from './ServiceSelector';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';


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
  role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
}

export interface CreateBookingData {
  serviceId: string;
  businessId: string;
  date: string;  // Format: "2025-07-18T18:00:00.000Z"
  timezone: string;  // Format: "America/Argentina/Buenos_Aires"
  finalPrice: number;
  employeeId?: string;
  userId?: string;
}

export interface BookingData extends CreateBookingData {
  id: string;
  userId: string;
  endTime: Date;
  finalPrice: number;
  status: BookingStatus;
  createdAt: Date;
}
interface Employee {
  id: string;
  name: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  isEditing = false,
  businessId,
  role,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [startTime, setStartTime] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string; services: Service[] } | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const effectiveBusinessId = role === 'CLIENT' ? selectedBusiness?.id : businessId;
  const [bookingData, setBookingData] = useState<CreateBookingData>({
    serviceId: '',
    businessId: '',
    date: new Date().toISOString().split('T')[0], // Just the date part initially
    timezone: "España/Madrid",
    finalPrice: 0
  });
  const [businesses, setBusinesses] = useState<{ id: string; name: string; services: Service[] }[]>([]);

  // Update bookingData when selectedService changes
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
  // Fetch business info if role is CLIENT
  useEffect(() => {
    if (role !== 'CLIENT') return;

    axios.get(`${API_BASE_URL}/business/public`, {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        setBusinesses(response.data);
      })
      .catch(error => {
        console.error('Error fetching business:', error);
        setError('Failed to fetch business information');
        setTimeout(() => setError(null), 5000);
      });
  }, [role]);

  useEffect(() => {
    if (!effectiveBusinessId || !selectedService || !bookingData.date || !startTime) {
      setAvailableEmployees([]);
      return;
    };
    const [year, month, day] = bookingData.date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes)
    const endDateTime = new Date(startDateTime.getTime() + selectedService.durationMin * 60000);

    setLoadingEmployees(true);
    const params = new URLSearchParams({
      businessId: effectiveBusinessId,
      date: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });
    axios.get(`${API_BASE_URL}/bookings/available-employees?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => {
        setAvailableEmployees(response.data);
      })
      .catch(error => {
        setAvailableEmployees([]);
        console.error('Error fetching available employees:', error);
        setEmployeeError('Failed to fetch available employees');
        setTimeout(() => setEmployeeError(null), 5000);
      })
      .finally(() => setLoadingEmployees(false));
  }, [effectiveBusinessId, selectedService, bookingData.date, startTime, token]);

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
        businessId: effectiveBusinessId || selectedService.businessId,
        date: dateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        finalPrice: selectedService.price,
        ...(selectedEmployeeId && { employeeId: selectedEmployeeId})
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
      {/* Business selectior Only CLIENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {role === 'CLIENT' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Select Business</label>
            <select
              value={selectedBusiness?.id || ''}
              onChange={(e) => {
                const business = businesses.find(b => b.id === e.target.value) || null;
                setSelectedBusiness(business);
                setSelectedService(null); // Reset selected service when business changes
              }}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar un negocio --</option>
              {businesses.map(business => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          </div>
        )}
         {/*SERVICE SELECTOR  */}
        <div className="col-span-2">
          {role === 'CLIENT' ? (
            <>
              <label className="block text-sm font-medium text-gray-700">Servicio *</label>
              <select
                value={selectedService?.id || ''}
                onChange={(e) => {
                  const s = selectedBusiness?.services.find(s => s.id === e.target.value) || null;
                  setSelectedService(s);
                }}
                disabled={!selectedBusiness}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Seleccionar servicio...</option>
                {selectedBusiness?.services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ${s.price} ({s.durationMin} min)</option>
                ))}
              </select>
            </>
          ) : (
            <ServiceSelector
              businessId={businessId}
              onServiceSelect={(service) => setSelectedService(service)}
              selectedServiceId={bookingData.serviceId}
            />
          )}
        </div>
        {/* Date and time inputs */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={bookingData.date.split('T')[0]} // Extract only the date part from ISO string
            onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        {/* Time input */}
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
        
       
        {/*Employee selection */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Select Employee (optional)</label>
          {loadingEmployees ? (
            <p>Loading available employees...Cargando empleados...</p>
          ) : employeeError ? (
            <p className="text-red-600">{employeeError}</p>
          ) : (
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={!selectedService || !startTime || !bookingData.date}
            >
              <option value="">Cualquier empleado disponible</option>
              {availableEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

        </div>
      </div>
      {error && (
        <div className="text-red-600 text-sm mt-2">{error}</div>
      )}

      
      {/* Employee selection is optional, only show if there are available employees */}
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
