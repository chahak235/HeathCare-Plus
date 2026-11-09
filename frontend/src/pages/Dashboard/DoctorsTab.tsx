import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlassCard } from '../../components/layout/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Phone, Calendar, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

// This matches the DoctorStatus type from bed.types.ts
interface DoctorStatus {
  id: string;
  name: string;
  specialty: string;
  isOnDuty: boolean;
  isEmergencyAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  nextAvailable?: string;
}

interface DoctorsTabProps {
  doctors?: DoctorStatus[];
  onCallDoctor?: (id: string) => void;
  onViewDoctorSchedule?: (id: string) => void;
}

export const DoctorsTab: React.FC<DoctorsTabProps> = ({ 
  doctors: propDoctors,
  onCallDoctor,
  onViewDoctorSchedule 
}) => {
  const [doctors, setDoctors] = useState<DoctorStatus[]>(propDoctors || []);
  const [loading, setLoading] = useState(!propDoctors);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!propDoctors) {
      fetchDoctors();
    }
  }, [propDoctors]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors`);
      if (response.data.success) {
        const apiDoctors = response.data.data?.doctors || [];
        // Transform API doctors to match DoctorStatus
        const transformed: DoctorStatus[] = apiDoctors.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.name,
          specialty: doc.specialty,
          isOnDuty: doc.isAvailable || false,
          isEmergencyAvailable: doc.isEmergencyAvailable || false,
          currentPatients: doc.currentPatients || 0,
          maxPatients: doc.maxPatients || 10,
          nextAvailable: undefined,
        }));
        setDoctors(transformed);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (filter === 'available') return doctor.isOnDuty && doctor.currentPatients < doctor.maxPatients;
    if (filter === 'emergency') return doctor.isEmergencyAvailable;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'all' ? 'bg-medical-cyan text-white' : 'bg-neutral-100'
          }`}
        >
          All Doctors
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'available' ? 'bg-medical-cyan text-white' : 'bg-neutral-100'
          }`}
        >
          Available Now
        </button>
        <button
          onClick={() => setFilter('emergency')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'emergency' ? 'bg-medical-cyan text-white' : 'bg-neutral-100'
          }`}
        >
          Emergency Ready
        </button>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doctor) => (
          <GlassCard key={doctor.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-full bg-medical-cyan/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-medical-cyan">
                  {doctor.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{doctor.name}</h3>
                <p className="text-sm text-medical-cyan">{doctor.specialty}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.5</span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Patients</span>
                <span className="font-medium">{doctor.currentPatients}/{doctor.maxPatients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Status</span>
                {doctor.isOnDuty ? (
                  doctor.currentPatients < doctor.maxPatients ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="warning">Busy</Badge>
                  )
                ) : (
                  <Badge variant="outline">Off Duty</Badge>
                )}
              </div>
              {doctor.isEmergencyAvailable && (
                <div className="mt-1">
                  <Badge variant="danger" size="sm">Emergency Ready</Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<Phone className="w-4 h-4" />}
                onClick={() => onCallDoctor?.(doctor.id)}
              >
                Call
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                leftIcon={<Calendar className="w-4 h-4" />}
                onClick={() => onViewDoctorSchedule?.(doctor.id)}
              >
                Schedule
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
