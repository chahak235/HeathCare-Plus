import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { Bed, BedUpdateEvent, OccupancyMetrics, SpecialtyOccupancy } from '../types/bed.types';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://healthcare-backend-tylz.onrender.com';

interface BedStatusContextValue {
  beds: Bed[];
  metrics: OccupancyMetrics;
  bySpecialty: SpecialtyOccupancy[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUpdated: string;
  filterSpecialty: string | null;
  setFilterSpecialty: (specialty: string | null) => void;
  refresh: () => Promise<void>;
}

const BedStatusContext = createContext<BedStatusContextValue | null>(null);

export function BedStatusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('connecting');
  const [filterSpecialty, setFilterSpecialty] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // A hospital user only manages their own beds, not every hospital's.
  useEffect(() => {
    if (user?.role !== 'hospital' || !user.id) return;
    axios
      .get(`${API_URL}/hospitals/hospital-for-user/${user.id}`)
      .then((res) => setHospitalId(res.data?.data?.hospitalId ? String(res.data.data.hospitalId) : null))
      .catch(() => setHospitalId(null));
  }, [user?.id, user?.role]);

  // Fetch initial data
  const fetchBeds = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/beds`, {
        params: hospitalId ? { hospitalId } : undefined,
      });
      if (response.data.success) {
        setBeds(response.data.data || []);
        setLastUpdated(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to fetch beds:', error);
    }
  }, [hospitalId]);

  // Calculate metrics from beds
  const metrics: OccupancyMetrics = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    percentage: beds.length > 0 ? Math.round((beds.filter(b => b.status === 'occupied').length / beds.length) * 100) : 0,
  };

  // Group by specialty
  const bySpecialty: SpecialtyOccupancy[] = Object.values(
    beds.reduce((acc, bed) => {
      if (!acc[bed.specialty]) {
        acc[bed.specialty] = {
          specialty: bed.specialty,
          total: 0,
          occupied: 0,
          available: 0,
          percentage: 0,
        };
      }
      acc[bed.specialty].total++;
      if (bed.status === 'occupied') acc[bed.specialty].occupied++;
      else if (bed.status === 'available') acc[bed.specialty].available++;
      return acc;
    }, {} as Record<string, SpecialtyOccupancy>)
  ).map(s => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.occupied / s.total) * 100) : 0,
  }));

  // Re-fetch whenever the scope changes — on mount, and again once a
  // hospital user's hospitalId resolves (it starts null while that lookup
  // is in flight).
  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  // WebSocket connection
  useEffect(() => {
    setConnectionStatus('connecting');
    
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'], // Add polling as fallback
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 WebSocket connected');
        setConnectionStatus('connected');
        fetchBeds();
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setConnectionStatus('error');
      });

      socketRef.current.on('bed:update', (data: BedUpdateEvent) => {
        setBeds(prev => 
          prev.map(bed => 
            bed.id === data.bedId 
              ? { ...bed, status: data.status, currentPatientId: data.patientId, lastUpdated: data.timestamp }
              : bed
          )
        );
        setLastUpdated(new Date().toISOString());
      });
    }

    return () => {
      // Clean up socket on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchBeds]);

  const refresh = useCallback(async () => {
    await fetchBeds();
  }, [fetchBeds]);

  const filteredBeds = filterSpecialty
    ? beds.filter(b => b.specialty === filterSpecialty || b.type === filterSpecialty)
    : beds;

  const value: BedStatusContextValue = {
    beds: filteredBeds,
    metrics,
    bySpecialty,
    connectionStatus,
    lastUpdated,
    filterSpecialty,
    setFilterSpecialty,
    refresh,
  };

  return <BedStatusContext.Provider value={value}>{children}</BedStatusContext.Provider>;
}

export function useBedStatus(): BedStatusContextValue {
  const ctx = useContext(BedStatusContext);
  if (!ctx) throw new Error('useBedStatus must be used within BedStatusProvider');
  return ctx;
}