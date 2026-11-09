import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

export const getDoctors = async (params?: any) => {
  try {
    const response = await axios.get(`${API_URL}/doctors`, { params });
    
    // Handle different response formats
    if (response.data.success) {
      // If data is array, return it directly
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // If data has doctors property, return that
      if (response.data.data?.doctors) {
        return response.data.data.doctors;
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

export const getDoctorById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/doctors/${id}`);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    throw error;
  }
};

export const getSpecialties = async () => {
  try {
    const response = await axios.get(`${API_URL}/doctors/specialties`);
    
    if (response.data.success) {
      // Handle both array and object responses
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data.data?.specialties) {
        return response.data.data.specialties;
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching specialties:', error);
    throw error;
  }
};

export const getAvailableDoctors = async (specialty?: string) => {
  try {
    const params = specialty ? { specialty } : {};
    const response = await axios.get(`${API_URL}/doctors/available`, { params });
    return response.data.success ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    throw error;
  }
};
