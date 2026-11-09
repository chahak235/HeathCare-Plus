import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import realtimeService from '../services/realtime.service';

interface RealtimeContextType {
  connected: boolean;
  beds: any[];
  patients: any[];
  doctors: any[];
  emergencies: any[];
  notifications: any[];
  latestNotification?: any;
  refreshData: () => Promise<void>;
  clearLatestNotification: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [beds, setBeds] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  // A hospital account should only see its own beds/doctors here, not
  // every hospital's pooled together.
  useEffect(() => {
    if (user?.role !== 'hospital' || !user.id) return;
    const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';
    fetch(`${API_URL}/hospitals/hospital-for-user/${user.id}`)
      .then((r) => r.json())
      .then((d) => setHospitalId(d?.data?.hospitalId ?? null))
      .catch(() => setHospitalId(null));
  }, [user?.id, user?.role]);

  const refreshData = async () => {
    try {
      const [bedsRes, patientsRes, doctorsRes] = await Promise.all([
        realtimeService.getBeds(hospitalId ? { hospitalId } : undefined),
        realtimeService.getPatients(),
        realtimeService.getDoctors(hospitalId ? { hospitalId, available: true } : { available: true })
      ]);

      // /beds and /patients-api both return { success, data: [...] } — a
      // plain array, not { data: { beds: [...] } }. Only /doctors nests an
      // extra object. This mismatch meant beds/patients here were always
      // empty regardless of what the backend actually had.
      setBeds(bedsRes.data || []);
      setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : (patientsRes.data?.patients || []));
      setDoctors(doctorsRes.data?.doctors || []);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    realtimeService.connect(user.id, user.role, user.hospitalId);

    realtimeService.on('bed:update', (data: any) => {
      setBeds(prev => prev.map(b => b.id === data.bedId ? { ...b, ...data } : b));
    });

    realtimeService.on('patient:transition', (data: any) => {
      setPatients(prev => prev.map(p => p.id === data.patientId ? { ...p, status: data.toStatus } : p));
      
      if (data.priority && data.priority <= 2) {
        setEmergencies(prev => [...prev, { ...data, timestamp: new Date() }]);
      }
    });

    realtimeService.on('doctor:status', (data: any) => {
      setDoctors(prev => prev.map(d => d.id === data.doctorId ? { ...d, ...data } : d));
    });

    realtimeService.on('alert:emergency', (data: any) => {
      setEmergencies(prev => [data, ...prev].slice(0, 10));
    });

    realtimeService.on('notification:new', (data: any) => {
      setNotifications(prev => [data, ...prev].slice(0, 50));
      setLatestNotification(data);
    });

    setConnected(true);
    refreshData();

    return () => {
      realtimeService.disconnect();
      setConnected(false);
    };
  }, [user]);

  // Re-fetch (without tearing down the socket) once a hospital user's
  // hospitalId resolves — it starts null while that lookup is in flight.
  useEffect(() => {
    if (!user || !hospitalId) return;
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const clearLatestNotification = () => setLatestNotification(null);

  return (
    <RealtimeContext.Provider value={{ connected, beds, patients, doctors, emergencies, notifications, latestNotification, refreshData, clearLatestNotification }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
};
