import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePatient } from '../../contexts/PatientContext';
import { useVitals } from '../../contexts/VitalsContext';
import { useBedStatus } from '../../contexts/BedStatusContext';
import { OrganViewer } from './components/OrganViewer';
import { HeartRateChart } from './components/Charts/HeartRateChart';
import { BloodPressureChart } from './components/Charts/BloodPressureChart';
import { OxygenChart } from './components/Charts/OxygenChart';
import { VitalCard } from './components/Vitals/VitalCard';
import { StatusIndicator } from './components/Vitals/StatusIndicator';
import { Activity, Heart, Thermometer, Wind, Droplets, Calendar, MapPin, Phone } from 'lucide-react';

export const Dashboard3D: React.FC = () => {
  const { user } = useAuth();
  const { patient, loading: patientLoading } = usePatient();
  const { currentVitals, loading: vitalsLoading } = useVitals();
  const { beds, metrics } = useBedStatus();

  if (patientLoading || vitalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-800">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/30">
      {/* Navbar */}
      <nav className="bg-primary-800 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
                HealTrust
              </h1>
              <span className="text-sm bg-primary-700 px-3 py-1 rounded-full">
                3D Clinical View
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.name}&background=1E3556&color=fff`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 3D Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Organ Viewer */}
            <OrganViewer className="h-[600px]" />

            {/* Patient Info Card */}
            {patient && (
              <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-1">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-primary-600 mb-4">
                      {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-primary-700">
                      <MapPin className="w-4 h-4 text-primary-500" />
                        <span>Mumbai, India</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary-700">
                        <Phone className="w-4 h-4 text-primary-500" />
                        <span>{patient.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary-700">
                        <Activity className="w-4 h-4 text-primary-500" />
                        <span>Blood Group: {patient.bloodGroup || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <StatusIndicator vitals={currentVitals} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Vitals & Analytics */}
          <div className="space-y-6">
            {/* Current Vitals Cards */}
            <div className="grid grid-cols-2 gap-4">
              <VitalCard
                icon={Heart}
                label="Heart Rate"
                value={currentVitals?.heartRate}
                unit="BPM"
                status={currentVitals && 'heartRate' in currentVitals ? 'normal' : 'normal'}
                thresholds={{ min: 60, max: 100 }}
              />
              <VitalCard
                icon={Activity}
                label="Blood Pressure"
                value={currentVitals && `${currentVitals.bloodPressureSystolic}/${currentVitals.bloodPressureDiastolic}`}
                status={currentVitals && 'bloodPressureSystolic' in currentVitals ? 'normal' : 'normal'}
              />
              <VitalCard
                icon={Wind}
                label="O₂ Saturation"
                value={currentVitals?.oxygenSaturation}
                unit="%"
                status={currentVitals && 'oxygenSaturation' in currentVitals ? 'normal' : 'normal'}
                thresholds={{ min: 95, max: 100 }}
              />
            <VitalCard
                icon={Thermometer}
                label="Temperature"
                value={currentVitals?.temperature}
                unit="°F"
                status={currentVitals && 'temperature' in currentVitals ? 'normal' : 'normal'}
                thresholds={{ min: 97, max: 99 }}
              />
            </div>

            {/* Charts */}
            <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Heart Rate Trend</h3>
              <HeartRateChart />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Blood Pressure</h3>
              <BloodPressureChart />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Oxygn Saturation</h3>
              <OxygenChart />
            </div>

            {/* Bed Occupancy Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Hospital Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-700">Bed Occupancy</span>
                  <span className="font-semibold text-primary-900">{metrics.percentage}%</span>
                </div>
                <div className="w-full bg-primary-100 rounded-full h-2">
                  <div 
                    className="bg-primary-600 rounded-full h-2 transition-all"
                    style={{ width: `${metrics.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-primary-600">
                  <span>{metrics.available} Available</span>
                  <span>{metrics.occupied} Occupied</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
