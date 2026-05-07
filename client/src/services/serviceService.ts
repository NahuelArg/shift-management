import apiClient from './apiClient';

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  businessId: string;
  createdAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  businessId: string;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  durationMin: number;
  price?: number;
  businessId?: string;
}

export const serviceService = {
  async getAll(): Promise<Service[]> {
    const response = await apiClient.get<{ name: string; services: Service[] }[]>('/services');
    return response.data.flatMap(biz => biz.services);
  },

  async create(data: CreateServiceDto): Promise<Service> {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  async update(id: string, businessId: string, data: Omit<UpdateServiceDto, 'businessId'>): Promise<Service> {
    const response = await apiClient.put(`/services/${businessId}/${id}`, data);
    return response.data;
  },

  async delete(id: string, businessId: string): Promise<Service> {
    const response = await apiClient.delete(`/services/${businessId}/${id}`);
    return response.data;
  },
};
