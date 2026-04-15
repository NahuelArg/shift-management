import apiClient from './apiClient';
import { type CreateBookingData, type BookingData } from '../components/bookingManagement/BookingForm';
export async function createBooking(bookingData: CreateBookingData) {
  const dataWithTimezone = {
    ...bookingData,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  try {
    const response = await apiClient.post('/bookings', dataWithTimezone)
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error creating booking');
    }
    throw new Error('Network error while creating booking');
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    const response = await apiClient.patch(
      `/bookings/${bookingId}/status`,
      { status },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error updating booking status');
    }
    throw new Error('Network error while updating booking status');
  }
}

export async function updateBooking(bookingId: string, bookingData: Partial<BookingData>) {
  try {

    const response = await apiClient.patch(
      `/bookings/${bookingId}`,
      bookingData,
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error updating booking');
    }
    throw new Error('Network error while updating booking');
  }
}

export async function getBooking(bookingId: string) {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}`, {

    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error fetching booking');
    }
    throw new Error('Network error while fetching booking');
  }
}

export async function getBookings(filters?: {
  status?: string;
  startTime?: string;
  endTime?: string;
}) {
  try {
    const response = await apiClient.get(`/bookings`, {
      params: filters,

    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error fetching bookings');
    }
    throw new Error('Network error while fetching bookings');
  }
}
