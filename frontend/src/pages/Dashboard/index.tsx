/**
 * Command Center: the hospital/admin dashboard.
 * Every number here comes from the database: SOS alerts, bookings, beds,
 * doctors, reviews and the access log. No sample data.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useBedStatus } from '../../contexts/BedStatusContext';
import { Container } from '../../components/layout/Container';
import { DashboardHeader } from './DashboardHeader';
import { QuickStatsBar } from './QuickStatsBar';
import { DashboardTabs } from './DashboardTabs';
import { OverviewTab } from './OverviewTab';
import { BedsTab } from './BedsTab';
import { DoctorsTab } from './DoctorsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { AppointmentsTab } from './AppointmentsTab';
import { TrustTab } from './TrustTab';
import { SosTab, useSosAlerts } from './SosTab';
import type { DashboardTab } from './types';
import type { DoctorStatus } from '../../types/bed.types';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiDoctor {
  id: number;
  name: string;
  specialty: string;
  isAvailable: boolean;
  isEmergencyAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  phone?: string;
}

export const Dashboard: React.FC = () => {
  const { beds, metrics, bySpecialty, connectionStatus, lastUpdated, setFilterSpecialty, refresh } = useBedStatus();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [doctors, setDoctors] = useState<DoctorStatus[]>([]);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const { alerts: sosAlerts } = useSosAlerts(7);
  const openSos = (sosAlerts || []).filter((a) => a.status === 'open').length;

  // Resolve which hospital this account manages, so beds/doctors below only
  // ever show this hospital's real roster, not every hospital's.
  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${API_URL}/hospitals/hospital-for-user/${user.id}`)
      .then((res) => setHospitalId(res.data?.data?.hospitalId ?? null))
      .catch(() => setHospitalId(null));
  }, [user?.id]);

  useEffect(() => {
    axios
      .get(`${API_URL}/doctors`, { params: hospitalId ? { hospitalId } : undefined })
      .then((response) => {
        if (!response.data.success) return;
        const apiDoctors: ApiDoctor[] = response.data.data?.doctors || [];
        setDoctors(
          apiDoctors.map((doc) => ({
            id: doc.id.toString(),
            name: doc.name,
            specialty: doc.specialty,
            isOnDuty: doc.isAvailable || false,
            isEmergencyAvailable: doc.isEmergencyAvailable || false,
            currentPatients: doc.currentPatients || 0,
            maxPatients: doc.maxPatients || 10,
            nextAvailable: undefined,
          }))
        );
        setPhones(Object.fromEntries(apiDoctors.filter((d) => d.phone).map((d) => [String(d.id), d.phone as string])));
      })
      .catch((error) => console.error('Failed to fetch doctors:', error));
  }, [hospitalId]);

  const handleCallDoctor = useCallback(
    (doctorId: string) => {
      const phone = phones[doctorId];
      if (phone) window.location.href = `tel:${phone}`;
      else alert('No phone number saved for this doctor.');
    },
    [phones]
  );

  const handleViewDoctorSchedule = useCallback(() => setActiveTab('appointments'), []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30 py-6">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/50 to-transparent dark:from-neutral-900/50 pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none z-0"></div>

      <Container className="relative z-10">
        {openSos > 0 && activeTab !== 'sos' && (
          <button
            type="button"
            onClick={() => setActiveTab('sos')}
            className="w-full mb-6 p-4 flex items-center gap-3 text-left bg-medical-red/10 border border-medical-red/20 rounded-lg"
          >
            <span className="p-2 bg-medical-red rounded-full"><AlertTriangle className="w-5 h-5 text-white" /></span>
            <span>
              <span className="block font-bold text-medical-red">
                {openSos} open SOS alert{openSos > 1 ? 's' : ''}
              </span>
              <span className="block text-sm text-medical-red/80">A patient near you pressed SOS. Open the alert to call them and see their location.</span>
            </span>
          </button>
        )}

        <DashboardHeader connectionStatus={connectionStatus} lastUpdated={lastUpdated} onRefresh={refresh} />

        <QuickStatsBar
          openSos={openSos}
          availableEmergencyBeds={beds.filter((b) => b.type === 'Emergency' && b.status === 'available').length}
          emergencyDoctors={doctors.filter((d) => d.isEmergencyAvailable).length}
          occupancyPercentage={metrics.percentage}
        />

        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} beds={beds} doctors={doctors} openSos={openSos} />

        {activeTab === 'overview' && (
          <OverviewTab
            onTabChange={setActiveTab}
            sosAlerts={sosAlerts || []}
            doctors={doctors}
            metrics={metrics}
            bySpecialty={bySpecialty}
            onFilterChange={setFilterSpecialty}
            onCallDoctor={handleCallDoctor}
            onViewDoctorSchedule={handleViewDoctorSchedule}
          />
        )}
        {activeTab === 'sos' && <SosTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'beds' && <BedsTab />}
        {activeTab === 'doctors' && (
          <DoctorsTab doctors={doctors} onCallDoctor={handleCallDoctor} onViewDoctorSchedule={handleViewDoctorSchedule} />
        )}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'trust' && <TrustTab />}
      </Container>
    </div>
  );
};
