import apiClient from './apiClient';

export interface Business {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface CreateBusinessDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateBusinessDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export const businessService = {
  async getAll(): Promise<Business[]> {
    const response = await apiClient.get('/business');
    return response.data;
  },

  async create(data: CreateBusinessDto): Promise<Business> {
    const response = await apiClient.post('/business', data);
    return response.data;
  },

  async update(id: string, data: UpdateBusinessDto): Promise<Business> {
    const response = await apiClient.put(`/business/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Business> {
    const response = await apiClient.delete(`/business/${id}`);
    return response.data;
  },
};
