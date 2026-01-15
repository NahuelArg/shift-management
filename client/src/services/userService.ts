import apiClient from './apiClient';

// src/services/employeeService.ts

export interface Employee {
  id: string;
  name: string;
  email: string;
  businessId: string;
  businessName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<User> {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export const employeeService = {
  async getEmployeesByBusiness(businessId: string): Promise<Employee[]> {
    const response = await apiClient.get(
      `/admin/business/${businessId}/employees`
    );
    return response.data;
  },
};
