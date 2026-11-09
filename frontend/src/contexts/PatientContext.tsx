import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  phoneNumber?: string;
  email?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: any[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface PatientContextType {
  patient: Patient | null;
  loading: boolean;
  error: string | null;
  refreshPatient: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get patient by user ID
      const response = await axios.get(`${API_URL}/patients-api?search=${user.id}`);
      
      if (response.data.success && response.data.data.patients.length > 0) {
        setPatient(response.data.data.patients[0]);
      } else {
        // If no patient found, create one
        const createResponse = await axios.post(`${API_URL}/patients-api`, {
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ')[1] || '',
          dateOfBirth: '1980-01-01', // Default, should be collected during onboarding
          gender: 'other',
          phoneNumber: user.phone,
          email: user.email,
          hospitalId: 1
        });
        
        if (createResponse.data.success) {
          setPatient(createResponse.data.data);
        }
      }
    } catch (err) {
      setError('Failed to load patient data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [user]);

  return (
    <PatientContext.Provider value={{ patient, loading, error, refreshPatient: fetchPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient must be used within PatientProvider');
  return context;
};
