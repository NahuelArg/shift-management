import apiClient from './apiClient';

export interface Schedule {
  id: string;
  dayOfWeek: number;
  from: string;
  to: string;
  businessId: string;
}

export interface CreateScheduleDto {
  dayOfWeek: number;
  from: string;
  to: string;
  businessId: string;
}

export interface UpdateScheduleDto {
  from?: string;
  to?: string;
  dayOfWeek?: number;
}

export const scheduleService = {
  async getAll(): Promise<Schedule[]> {
    const response = await apiClient.get('/schedules');
    return response.data;
  },

  async create(data: CreateScheduleDto): Promise<Schedule> {
    const response = await apiClient.post('/schedules', data);
    return response.data;
  },

  async update(id: string, data: UpdateScheduleDto): Promise<Schedule> {
    const response = await apiClient.put(`/schedules/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<Schedule> {
    const response = await apiClient.delete(`/schedules/${id}`);
    return response.data;
  },
};
