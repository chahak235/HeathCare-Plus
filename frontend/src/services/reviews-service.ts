import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface PublicReview {
  id: number;
  doctorId: number;
  doctorName?: string;
  doctorSpecialty?: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export const reviewsService = {
  async featured(limit = 6): Promise<PublicReview[]> {
    const r = await axios.get(`${API_URL}/reviews`, { params: { featured: 1, limit } });
    return r.data?.data || [];
  },
  async forDoctor(doctorId: number | string, limit = 5): Promise<PublicReview[]> {
    const r = await axios.get(`${API_URL}/reviews`, { params: { doctorId, limit } });
    return r.data?.data || [];
  },
  /** Appointment ids the logged-in patient has already reviewed */
  async mine(): Promise<number[]> {
    const r = await axios.get(`${API_URL}/reviews/mine`);
    return r.data?.data?.reviewed || [];
  },
  async submit(appointmentId: number, rating: number, comment: string): Promise<PublicReview> {
    try {
      const r = await axios.post(`${API_URL}/reviews`, { appointmentId, rating, comment });
      return r.data?.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.error || 'Could not save your review.');
    }
  },
};
