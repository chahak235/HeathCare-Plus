import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface IndianHospital {
  id: number;
  name: string;
  type: 'government' | 'private' | 'trust';
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  phone: string;
  emergency_phone: string;
  specialty: string;
  beds: number;
  ayushman_empaneled: boolean;
  distance_km?: number;
}

class IndianHealthAPI {
  // Get hospitals by city
  static async getHospitalsByCity(city: string, limit: number = 20): Promise<IndianHospital[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/city/${city}`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching hospitals by city:', error);
      return [];
    }
  }

  // Get hospitals by state
  static async getHospitalsByState(state: string, limit: number = 30): Promise<IndianHospital[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/state/${state}`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching hospitals by state:', error);
      return [];
    }
  }

  // Get hospitals near location
  static async getHospitalsNearby(lat: number, lng: number, radius: number = 50, limit: number = 20): Promise<IndianHospital[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/nearby`, {
        params: { lat, lng, radius, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      return [];
    }
  }

  // Search hospitals
  static async searchHospitals(query: string, limit: number = 20): Promise<IndianHospital[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/search`, {
        params: { q: query, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching hospitals:', error);
      return [];
    }
  }

  // Get all states
  static async getStates(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/states`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  // Get cities by state
  static async getCitiesByState(state: string): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/states/${state}/cities`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching cities by state:', error);
      return [];
    }
  }

  // Get hospital details
  static async getHospital(id: number): Promise<IndianHospital | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/india/hospitals/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      return null;
    }
  }
}

export default IndianHealthAPI;