import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

export interface EmergencyContact {
  name: string;
  relation?: string;
  phone: string;
  email?: string;
}

export interface PreferredHospital {
  name: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface HealthProfile {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  medicalNotes?: string;
  emergencyContacts: EmergencyContact[];
  preferredHospital?: PreferredHospital | null;
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const emergencyService = {
  async getProfile(token: string): Promise<HealthProfile> {
    const { data } = await axios.get(`${API_URL}/emergency/profile`, auth(token));
    return data.data;
  },

  async saveProfile(token: string, profile: HealthProfile): Promise<HealthProfile> {
    const { data } = await axios.put(`${API_URL}/emergency/profile`, profile, auth(token));
    return data.data;
  },

  async sendAlert(
    token: string,
    body: { lat?: number; lng?: number; hospital?: { name: string; phone?: string | null; distanceKm?: number } | null }
  ): Promise<{ contacts: { name: string; emailed: boolean }[]; location: string | null }> {
    const { data } = await axios.post(`${API_URL}/emergency/alert`, body, auth(token));
    return data.data;
  },
};

/** Keeps a copy on the device so the emergency page works even if the server is slow. */
const LOCAL_KEY = 'hc_emergency_profile';
export const cacheProfile = (p: HealthProfile) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
};
export const cachedProfile = (): HealthProfile | null => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const telHref = (phone: string) => `tel:${phone.split(/[;,/]/)[0].replace(/[^\d+]/g, '')}`;
