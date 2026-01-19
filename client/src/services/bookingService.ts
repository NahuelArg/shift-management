import axios from 'axios';
import { type CreateBookingData, type BookingData } from '../components/bookingManagement/BookingForm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function createBooking(bookingData: CreateBookingData) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData, {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_BASE_URL}/bookings/${bookingId}/status`,
      { status },
      { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
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
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `${API_BASE_URL}/bookings/${bookingId}`,
      bookingData,
      { 
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
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
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/bookings`, {
      params: filters,
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error fetching bookings');
    }
    throw new Error('Network error while fetching bookings');
  }
}
