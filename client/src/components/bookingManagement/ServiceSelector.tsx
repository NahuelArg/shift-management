import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMin: number;
  businessId: string;
}

interface ServiceSelectorProps {
  businessId?: string;
  onServiceSelect: (service: Service) => void;
  selectedServiceId?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  businessId,
  onServiceSelect,
  selectedServiceId
}) => {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      if (!businessId || !token) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/services?businessId=${businessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServices(response.data);
      } catch (err) {
        setError('Error loading services');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [businessId, token]);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = services.find(s => s.id === e.target.value);
    if (service) {
      onServiceSelect(service);
    }
  };

  if (loading) return <div className="animate-pulse">Loading services...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!businessId) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Service
      </label>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        value={selectedServiceId || ''}
        onChange={handleServiceChange}
        required
      >
        <option value="">Select a service</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - ${service.price} ({service.durationMin} min)
          </option>
        ))}
      </select>
    </div>
  );
};

export default ServiceSelector;
