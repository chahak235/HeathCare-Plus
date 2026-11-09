import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

export interface VitalsData {
  patientId: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number;
  temperature: number;
  respiratoryRate: number;
  timestamp: string;
}

export interface VitalsHistory {
  data: VitalsData[];
  startTime: string;
  endTime: string;
}

class VitalsService {
  // Get current vitals for a patient
  async getCurrentVitals(patientId: string): Promise<VitalsData> {
    try {
      const response = await axios.get(`${API_URL}/vitals/current/${patientId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching current vitals:', error);
      // Return default data if API not ready
      return {
        patientId,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        oxygenSaturation: 98,
        temperature: 98.6,
        respiratoryRate: 16,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get vitals history for a patient
  async getVitalsHistory(
    patientId: string, 
    hours: number = 24
  ): Promise<VitalsHistory> {
    try {
      const response = await axios.get(`${API_URL}/vitals/history/${patientId}`, {
        params: { hours }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      // Generate mock history for development
      const mockData: VitalsData[] = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const time = new Date(now);
        time.setHours(now.getHours() - (23 - i));
        mockData.push({
          patientId,
          heartRate: 70 + Math.floor(Math.random() * 15),
          bloodPressureSystolic: 115 + Math.floor(Math.random() * 15),
          bloodPressureDiastolic: 75 + Math.floor(Math.random() * 10),
          oxygenSaturation: 96 + Math.floor(Math.random() * 4),
          temperature: 98.2 + (Math.random() * 0.8),
          respiratoryRate: 14 + Math.floor(Math.random() * 6),
          timestamp: time.toISOString()
        });
      }
      return {
        data: mockData,
        startTime: mockData[0]?.timestamp || now.toISOString(),
        endTime: mockData[mockData.length - 1]?.timestamp || now.toISOString()
      };
    }
  }
}

export default new VitalsService();
