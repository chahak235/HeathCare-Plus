import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import vitalsService, { VitalsData, VitalsHistory } from '../services/vitals.service';

export type VitalStatus = 'normal' | 'warning' | 'critical';

interface VitalsContextType {
  currentVitals: VitalsData | null;
  vitalsHistory: VitalsHistory | null;
  loading: boolean;
  error: string | null;
  getVitalStatus: (vitalName: keyof VitalsData, value: number) => VitalStatus;
  refreshVitals: () => Promise<void>;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const THRESHOLDS = {
  heartRate: { min: 60, max: 100 },
  oxygenSaturation: { min: 95, max: 100 },
  temperature: { min: 97, max: 99 },
  respiratoryRate: { min: 12, max: 20 },
  bloodPressureSystolic: { min: 90, max: 130 },
  bloodPressureDiastolic: { min: 60, max: 85 },
};

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentVitals, setCurrentVitals] = useState<VitalsData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalsHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const patientId = user.id; // Assuming user.id matches patient ID
      const [current, history] = await Promise.all([
        vitalsService.getCurrentVitals(patientId),
        vitalsService.getVitalsHistory(patientId, 24)
      ]);
      
      setCurrentVitals(current);
      setVitalsHistory(history);
    } catch (err) {
      setError('Failed to load vitals data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!user) return;

    vitalsService.on('vitals:update', (data: VitalsData) => {
      if (data.patientId === user.id) {
        setCurrentVitals(data);
      }
    });

    vitalsService.on('vitals:alert', (data) => {
      // Handle critical alerts
      console.warn('Vital alert:', data);
    });

    fetchVitals();

    return () => {
      vitalsService.disconnect();
    };
  }, [user, fetchVitals]);

  const getVitalStatus = useCallback((vitalName: keyof VitalsData, value: number): VitalStatus => {
    const threshold = THRESHOLDS[vitalName as keyof typeof THRESHOLDS];
    if (!threshold) return 'normal';

    if (vitalName === 'heartRate' || vitalName === 'respiratoryRate') {
      if (value < threshold.min || value > threshold.max) return 'critical';
      if (value < threshold.min + 5 || value > threshold.max - 5) return 'warning';
      return 'normal';
    }

    if (vitalName === 'oxygenSaturation') {
      if (value < 90) return 'critical';
      if (value < 95) return 'warning';
      return 'normal';
    }

    if (vitalName === 'temperature') {
      if (value < 97 || value > 99) return 'critical';
      if (value < 97.5 || value > 98.5) return 'warning';
      return 'normal';
    }

    return 'normal';
  }, []);

  return (
    <VitalsContext.Provider value={{
      currentVitals,
      vitalsHistory,
      loading,
      error,
      getVitalStatus,
      refreshVitals: fetchVitals,
    }}>
      {children}
    </VitalsContext.Provider>
  );
};

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) throw new Error('useVitals must be used within VitalsProvider');
  return context;
};
