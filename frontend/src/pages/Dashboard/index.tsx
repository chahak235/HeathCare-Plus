/**
 * Command Center - Hospital Operating System Dashboard
 * Tabbed interface for bed management, triage, ambulances, doctor status, and analytics
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useBedStatus } from '../../contexts/BedStatusContext';
import { Container } from '../../components/layout/Container';
import { EmergencyAlertBanner } from './EmergencyAlertBanner';
import { DashboardHeader } from './DashboardHeader';
import { QuickStatsBar } from './QuickStatsBar';
import { DashboardTabs } from './DashboardTabs';
import { OverviewTab } from './OverviewTab';
import { BedsTab } from './BedsTab';
import { TriageTab } from './TriageTab';
import { AmbulancesTab } from './AmbulancesTab';
import { DoctorsTab } from './DoctorsTab';
import { AnalyticsTab } from './AnalyticsTab';
import type { DashboardTab } from './types';
import type { DoctorStatus } from '../../types/bed.types';
import { MOCK_TRIAGE_PATIENTS } from '../../mocks/triage';
import { MOCK_AMBULANCES } from '../../mocks/ambulances';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';

// Beds and doctors below are your real data. Triage and ambulance tracking
// are genuine, sophisticated UI built ahead of the backend that would feed
// them real patient-arrival and GPS telemetry — rather than pretend that
// data is live, this says so plainly until that backend exists.
const DemoDataBanner: React.FC<{ feature: string }> = ({ feature }) => (
  <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
    {feature} is shown with sample data — this doesn't reflect real patients or vehicles yet.
  </div>
);

interface ApiDoctor {
  id: number;
  name: string;
  specialty: string;
  isAvailable: boolean;
  isEmergencyAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  consultationFee?: number;
  rating?: number;
  experienceYears?: number;
  languages?: string[];
  phone?: string;
  email?: string;
  profileImageUrl?: string;
}

export const Dashboard: React.FC = () => {
  const {
    beds,
    metrics,
    bySpecialty,
    connectionStatus,
    lastUpdated,
    filterSpecialty,
    setFilterSpecialty,
    refresh,
  } = useBedStatus();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(true);
  const [doctors, setDoctors] = useState<DoctorStatus[]>([]);
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  // Resolve which hospital this account manages, so beds/doctors below only
  // ever show this hospital's real roster, not every hospital's.
  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${API_URL}/hospitals/hospital-for-user/${user.id}`)
      .then((res) => setHospitalId(res.data?.data?.hospitalId ?? null))
      .catch(() => setHospitalId(null));
  }, [user?.id]);

  // Fetch real doctors from API and transform to DoctorStatus type
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${API_URL}/doctors`, {
          params: hospitalId ? { hospitalId } : undefined,
        });
        if (response.data.success) {
          const apiDoctors: ApiDoctor[] = response.data.data?.doctors || [];
          
          // Transform API doctors to match DoctorStatus type
          const transformedDoctors: DoctorStatus[] = apiDoctors.map(doc => ({
            id: doc.id.toString(),
            name: doc.name,
            specialty: doc.specialty,
            isOnDuty: doc.isAvailable || false,
            isEmergencyAvailable: doc.isEmergencyAvailable || false,
            currentPatients: doc.currentPatients || 0,
            maxPatients: doc.maxPatients || 10,
            nextAvailable: undefined,
          }));
          
          setDoctors(transformedDoctors);
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      }
    };
    fetchDoctors();
  }, [hospitalId]);

  const emergencyStats = {
    p1Patients: MOCK_TRIAGE_PATIENTS.filter((p) => p.priority === 1).length,
    incomingAmbulances: MOCK_AMBULANCES.filter((a) => a.status === 'enroute').length,
    availableEmergencyBeds: beds.filter((b) => b.type === 'Emergency' && b.status === 'available').length,
    criticalDoctors: doctors.filter((d) => d.isEmergencyAvailable).length,
  };

  const handleAssignDoctor = useCallback((patientId: string, doctorId: string) => {
    console.log('Assign doctor', patientId, doctorId);
  }, []);

  const handleViewPatientDetails = useCallback((patientId: string) => {
    console.log('View patient', patientId);
  }, []);

  const handleCallDoctor = useCallback((doctorId: string) => {
    console.log('Call doctor', doctorId);
  }, []);

  const handleViewDoctorSchedule = useCallback((doctorId: string) => {
    console.log('View schedule', doctorId);
  }, []);

  const handleAmbulanceSelect = useCallback((ambulanceId: string) => {
    console.log('Selected ambulance', ambulanceId);
  }, []);

  const handleDispatchAmbulance = useCallback((ambulanceId: string, hospitalId: string) => {
    console.log('Dispatch ambulance', ambulanceId, 'to', hospitalId);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/30 py-6">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/50 to-transparent dark:from-neutral-900/50 pointer-events-none z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none z-0"></div>

      <Container className="relative z-10">
        {showEmergencyAlert && emergencyStats.p1Patients > 0 && (
          <EmergencyAlertBanner
            p1Count={emergencyStats.p1Patients}
            incomingAmbulances={emergencyStats.incomingAmbulances}
            availableErBeds={emergencyStats.availableEmergencyBeds}
            criticalDoctors={emergencyStats.criticalDoctors}
            onDismiss={() => setShowEmergencyAlert(false)}
          />
        )}

        <DashboardHeader
          connectionStatus={connectionStatus}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
        />

        <QuickStatsBar
          p1Patients={emergencyStats.p1Patients}
          incomingAmbulances={emergencyStats.incomingAmbulances}
          availableEmergencyBeds={emergencyStats.availableEmergencyBeds}
          criticalDoctors={emergencyStats.criticalDoctors}
          occupancyPercentage={metrics.percentage}
        />

        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          beds={beds}
          triagePatients={MOCK_TRIAGE_PATIENTS}
          ambulances={MOCK_AMBULANCES}
          doctors={doctors}
        />

        {activeTab === 'overview' && (
          <OverviewTab
            onTabChange={setActiveTab}
            triagePatients={MOCK_TRIAGE_PATIENTS}
            ambulances={MOCK_AMBULANCES}
            doctors={doctors}
            metrics={metrics}
            bySpecialty={bySpecialty}
            onFilterChange={setFilterSpecialty}
            onAssignDoctor={handleAssignDoctor}
            onViewPatientDetails={handleViewPatientDetails}
            onAmbulanceSelect={handleAmbulanceSelect}
            onDispatchAmbulance={handleDispatchAmbulance}
            onCallDoctor={handleCallDoctor}
            onViewDoctorSchedule={handleViewDoctorSchedule}
          />
        )}

        {activeTab === 'beds' && <BedsTab />}

        {activeTab === 'triage' && (
          <>
            <DemoDataBanner feature="Triage queue" />
            <TriageTab
              patients={MOCK_TRIAGE_PATIENTS}
              onAssignDoctor={handleAssignDoctor}
              onViewPatientDetails={handleViewPatientDetails}
            />
          </>
        )}

        {activeTab === 'ambulances' && (
          <>
            <DemoDataBanner feature="Ambulance tracking" />
            <AmbulancesTab
              ambulances={MOCK_AMBULANCES}
              onSelectAmbulance={handleAmbulanceSelect}
              onDispatchAmbulance={handleDispatchAmbulance}
            />
          </>
        )}

        {activeTab === 'doctors' && (
          <DoctorsTab
            doctors={doctors}
            onCallDoctor={handleCallDoctor}
            onViewDoctorSchedule={handleViewDoctorSchedule}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsTab />}
      </Container>
    </div>
  );
};
