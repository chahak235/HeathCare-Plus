import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api').replace(/\/api\/?$/, '');

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId: string, userType: string, hospitalId?: string) {
    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      this.socket?.emit('authenticate', { userId, userType, hospitalId });
    });

    this.socket.on('bed:update', (data) => {
      this.emit('bed:update', data);
    });

    this.socket.on('patient:transition', (data) => {
      this.emit('patient:transition', data);
    });

    this.socket.on('doctor:status', (data) => {
      this.emit('doctor:status', data);
    });

    this.socket.on('alert:emergency', (data) => {
      this.emit('alert:emergency', data);
    });

    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });

    return this;
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    this.listeners.set(event, callbacks.filter((cb) => cb !== callback));
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // API Calls
  async getBeds(filters?: any) {
    const response = await axios.get(`${API_URL}/beds`, { params: filters });
    return response.data;
  }

  async getDoctors(filters?: any) {
    const response = await axios.get(`${API_URL}/doctors`, { params: filters });
    return response.data;
  }

  async getPatients(filters?: any) {
    const response = await axios.get(`${API_URL}/patients-api`, { params: filters });
    return response.data;
  }

  async getHospitalWaitTimes(hospitalId: number) {
    const response = await axios.get(`${API_URL}/analytics/wait-times/${hospitalId}`);
    return response.data;
  }

  async searchHospitals(symptoms: string[], location?: { lat: number; lng: number }) {
    const response = await axios.post(`${API_URL}/hospitals/search`, {
      symptoms,
      location
    });
    return response.data;
  }

  async bookAppointment(data: any) {
    const response = await axios.post(`${API_URL}/appointments`, data);
    return response.data;
  }

  async getPatientForUser(userId: string | number) {
    const response = await axios.get(`${API_URL}/appointments/patient-for-user/${userId}`);
    return response.data;
  }

  async getDefaultHospital() {
    const response = await axios.get(`${API_URL}/appointments/default-hospital`);
    return response.data;
  }

  async getAvailableSlots(doctorId: number, date: string) {
    const response = await axios.get(`${API_URL}/appointments/slots`, {
      params: { doctorId, date }
    });
    return response.data;
  }
}

export default new RealtimeService();
