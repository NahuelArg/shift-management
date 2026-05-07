import React, { useState, useEffect } from 'react';
import ServiceSelector from './ServiceSelector';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

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
  date: string;
  timezone: string;
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

function translateBookingError(msg: string): string {
  if (!msg) return 'Error al crear la reserva';
  if (/closing time|would end at/i.test(msg))
    return 'El turno finalizaría después del horario de cierre. Elegí un horario más temprano.';
  if (/No available employees/i.test(msg))
    return 'No hay empleados disponibles en ese horario.';
  if (/not available at the chosen time/i.test(msg))
    return 'El empleado seleccionado no está disponible en ese horario.';
  if (/Employee not found in this business/i.test(msg))
    return 'El empleado no pertenece a este negocio.';
  if (/required/i.test(msg) && !/negocio|atiende/i.test(msg))
    return 'Completá todos los campos requeridos.';
  return msg;
}

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
  const [businesses, setBusinesses] = useState<{ id: string; name: string; services: Service[] }[]>([]);

  const [adminBusinesses, setAdminBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [adminSelectedBusinessId, setAdminSelectedBusinessId] = useState<string>('');

  const needsAdminBusinessPicker = role === 'ADMIN' && !businessId;
  const effectiveBusinessId =
    role === 'CLIENT'      ? selectedBusiness?.id :
    needsAdminBusinessPicker ? adminSelectedBusinessId || undefined :
    businessId;

  const [bookingData, setBookingData] = useState<CreateBookingData>({
    serviceId: '',
    businessId: '',
    date: new Date().toISOString().split('T')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    finalPrice: 0,
  });

  useEffect(() => {
    if (selectedService) {
      setBookingData(prev => ({
        ...prev,
        serviceId: selectedService.id,
        businessId: selectedService.businessId,
        finalPrice: selectedService.price,
      }));
    }
  }, [selectedService]);

  useEffect(() => {
    if (role !== 'CLIENT') return;
    apiClient.get('/business/public')
      .then(res => setBusinesses(res.data))
      .catch(() => setError('Error al cargar los negocios'));
  }, [role]);

  useEffect(() => {
    if (!needsAdminBusinessPicker) return;
    apiClient.get('/business')
      .then(res => {
        setAdminBusinesses(res.data);
        if (res.data.length > 0) setAdminSelectedBusinessId(res.data[0].id);
      })
      .catch(() => setError('Error al cargar los negocios'));
  }, [needsAdminBusinessPicker]);

  useEffect(() => {
    if (!effectiveBusinessId || !selectedService || !bookingData.date || !startTime) {
      setAvailableEmployees([]);
      return;
    }
    const [year, month, day] = bookingData.date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    const endDateTime = new Date(startDateTime.getTime() + selectedService.durationMin * 60000);

    setLoadingEmployees(true);
    const params = new URLSearchParams({
      businessId: effectiveBusinessId,
      date: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });
    apiClient.get(`/bookings/available-employees?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAvailableEmployees(res.data))
      .catch(() => setAvailableEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, [effectiveBusinessId, selectedService, bookingData.date, startTime, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!token) {
      setError('Debés iniciar sesión para crear una reserva');
      setLoading(false);
      return;
    }

    if (!selectedService || !bookingData.date || !startTime) {
      setError('Completá todos los campos requeridos');
      setLoading(false);
      return;
    }

    try {
      const [year, month, day] = bookingData.date.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const dateTime = new Date(year, month - 1, day, hours, minutes);

      const submitData: CreateBookingData = {
        serviceId: selectedService.id,
        businessId: effectiveBusinessId || selectedService.businessId,
        date: dateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        finalPrice: selectedService.price,
        ...(selectedEmployeeId && { employeeId: selectedEmployeeId }),
      };

      await onSubmit(submitData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear la reserva';
      setError(translateBookingError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business selector — CLIENT only */}
      {role === 'CLIENT' && (
        <Select
          label="Negocio"
          value={selectedBusiness?.id || ''}
          onChange={e => {
            const biz = businesses.find(b => b.id === e.target.value) || null;
            setSelectedBusiness(biz);
            setSelectedService(null);
          }}
          required
        >
          <option value="">Seleccioná un negocio</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      )}

      {/* Admin business picker — only when no businessId prop */}
      {needsAdminBusinessPicker && (
        <Select
          label="Negocio"
          value={adminSelectedBusinessId}
          onChange={e => setAdminSelectedBusinessId(e.target.value)}
          required
        >
          <option value="">Seleccioná un negocio</option>
          {adminBusinesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      )}

      {/* Service selector */}
      {role === 'CLIENT' ? (
        <Select
          label="Servicio"
          value={selectedService?.id || ''}
          onChange={e => {
            const s = selectedBusiness?.services.find(sv => sv.id === e.target.value) || null;
            setSelectedService(s);
          }}
          disabled={!selectedBusiness}
          required
        >
          <option value="">Seleccioná un servicio</option>
          {selectedBusiness?.services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — ${s.price} ({s.durationMin} min)
            </option>
          ))}
        </Select>
      ) : (
        <ServiceSelector
          businessId={businessId}
          onServiceSelect={service => setSelectedService(service)}
          selectedServiceId={bookingData.serviceId}
        />
      )}

      {/* Date and time */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          type="date"
          value={bookingData.date.split('T')[0]}
          onChange={e => setBookingData(prev => ({ ...prev, date: e.target.value }))}
          required
        />
        <Input
          label="Hora de inicio"
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
        />
      </div>

      {/* Employee selector */}
      <Select
        label="Empleado (opcional)"
        value={selectedEmployeeId || ''}
        onChange={e => setSelectedEmployeeId(e.target.value || null)}
        disabled={loadingEmployees || !selectedService || !startTime || !bookingData.date}
        hint={loadingEmployees ? 'Cargando empleados disponibles…' : undefined}
      >
        <option value="">Cualquier empleado disponible</option>
        {availableEmployees.map(emp => (
          <option key={emp.id} value={emp.id}>{emp.name}</option>
        ))}
      </Select>

      {/* Inline error */}
      {error && (
        <div className="bg-danger-light border border-danger/30 text-danger-text text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading} disabled={!selectedService}>
          {isEditing ? 'Actualizar turno' : 'Crear turno'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
