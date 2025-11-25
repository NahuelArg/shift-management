import apiClient from './apiClient';

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  businessId: string;
  createdAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  duration: number;
  price: number;
  businessId: string;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
}

export const serviceService = {
  async getAll(): Promise<Service[]> {
    const response = await apiClient.get('/services');
    return response.data;
  },

  async create(data: CreateServiceDto): Promise<Service> {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Service> {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  },
};
