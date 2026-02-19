import apiClient from './apiClient';

/**
 * Service: Relación entre Business y Service
 * Un negocio tiene muchos servicios
 */
export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  durationMin: number;
  businessId: string;
  createdAt: string;
}

/**
 * Business: Modelo principal
 * Incluye array de servicios como relación
 */
export interface Business {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
  services?: Service[]; // ← Relación: muchos servicios
}

/**
 * DTO para crear negocio: solo nombre y UUID del dueño
 */
export interface CreateBusinessDto {
  ownerId: string;
  name: string;
}

/**
 * DTO para actualizar negocio
 */
export interface UpdateBusinessDto {
  name: string;
}

export const businessService = {
  async getAll(): Promise<Business[]> {
const response = await apiClient.get(`/business`);
    return response.data;
  },

   async getById(id: string): Promise<Business> {
    const response = await apiClient.get(`/business/${id}`);
    return response.data;
  },

  async create(data: CreateBusinessDto): Promise<Business> {
    
    const response = await apiClient.post(`/business`, data);
    return response.data;
  },

  /**
   * 
   * @param id businnes ID to update
   * @param data only name.
   * @returns 
   */

  async update(id: string, data: UpdateBusinessDto): Promise<Business> {
    const response = await apiClient.put(`/business/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Business> {
    const response = await apiClient.delete(`/business/${id}`);
    return response.data;
  },
};

/**
 * Service para gestionar servicios de un negocio
 * Endpoints: /service
 */
export const serviceService = {
  async getByBusinessId(businessId: string): Promise<Service[]> {
    const response = await apiClient.get(`/services/${businessId}`);
    return response.data;
  },

  async getAll(): Promise<Service[]> {
    const response = await apiClient.get('/services');
    return response.data;
  },

  async create(data: {
    name: string;
    description?: string;
    price?: number;
    durationMin?: number;
    businessId: string;
  }): Promise<Service> {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      durationMin?: number;
    },
  ): Promise<Service> {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Service> {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  },
};