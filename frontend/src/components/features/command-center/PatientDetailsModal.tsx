/**
 * PatientDetailsModal Component
 * Full patient information with medical history, vitals, and journey timeline
 */
import React, { useState } from 'react';
import { PatientJourney } from './PatientJourney';
import { MOCK_JOURNEY_STEPS } from '../../../mocks/journey';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Activity,
  Thermometer,
  Wind,
  AlertCircle,
  Clock,
  FileText,
  Pill,
  Stethoscope,
  Truck as AmbulanceIcon,
  BedDouble,
  Download,
  Printer,
  MessageSquare,
} from 'lucide-react';
import type { TriagePatient } from '../../../types/bed.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

// You may want to provide the real patient journey data via props or API.
const MOCK_PATIENT_JOURNEY = {
  steps: MOCK_JOURNEY_STEPS,
  currentStep: 2,
};

interface PatientDetailsModalProps {
  patient: TriagePatient;
  onClose: () => void;
  onAssignBed: (patientId: string) => void;
  onAssignDoctor: (patientId: string) => void;
  onStartConsultation: (patientId: string) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  onClose,
  onAssignBed,
  onAssignDoctor,
  onStartConsultation,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'journey' | 'documents'>('details');

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-medical-red bg-medical-red/10';
      case 2: return 'text-medical-orange bg-medical-orange/10';
      case 3: return 'text-medical-yellow bg-medical-yellow/10';
      case 4: return 'text-medical-cyan bg-medical-cyan/10';
      case 5: return 'text-medical-green bg-medical-green/10';
      default: return 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  // Mock patient history (would come from API)
  const patientHistory = {
    previousVisits: [
      { date: '2024-02-15', reason: 'Chest Pain', doctor: 'Dr. Gupta' },
      { date: '2023-11-20', reason: 'Routine Checkup', doctor: 'Dr. Sharma' },
    ],
    allergies: ['Penicillin', 'Sulfa'],
    medications: ['Aspirin 81mg', 'Lisinopril 10mg'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getPriorityColor(patient.priority)}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
                  {patient.name}
                </h2>
                <Badge variant={patient.priority <= 2 ? 'danger' : 'warning'} size="md">
                  Priority {patient.priority}
                </Badge>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {patient.age} years • {patient.gender} • ID: {patient.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Tabs for different views */}
        <div className="mb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-4">
            <button
              className={`px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-medical-cyan text-medical-cyan'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Medical Details
            </button>
            <button
              className={`px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'journey'
                  ? 'border-medical-cyan text-medical-cyan'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => setActiveTab('journey')}
            >
              Patient Journey
            </button>
            <button
              className={`px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-medical-cyan text-medical-cyan'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<BedDouble className="w-4 h-4" />}
                  onClick={() => onAssignBed(patient.id)}
                >
                  Assign Bed
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Stethoscope className="w-4 h-4" />}
                  onClick={() => onAssignDoctor(patient.id)}
                >
                  Assign Doctor
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => onStartConsultation(patient.id)}
                >
                  Start Consultation
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Personal Info & Vitals */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Personal Information */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">+91 98765 43210</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">{patient.name.toLowerCase().replace(' ', '.')}@email.com</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Mumbai, Maharashtra</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">DOB: 15 Mar 1980</span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Current Vitals */}
                  {patient.vitals && (
                    <GlassCard className="p-4">
                      <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                        Current Vitals
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Heart className="w-4 h-4 text-medical-red" />
                            <span className="text-xs text-neutral-500">Heart Rate</span>
                          </div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">
                            {patient.vitals.heartRate}
                            <span className="text-xs font-normal text-neutral-500 ml-1">bpm</span>
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-medical-cyan" />
                            <span className="text-xs text-neutral-500">BP</span>
                          </div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">
                            {patient.vitals.bloodPressure}
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Wind className="w-4 h-4 text-medical-cyan" />
                            <span className="text-xs text-neutral-500">SpO2</span>
                          </div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">
                            {patient.vitals.oxygenSaturation}%
                          </p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Thermometer className="w-4 h-4 text-medical-orange" />
                            <span className="text-xs text-neutral-500">Temp</span>
                          </div>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">
                            {patient.vitals.temperature}°F
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Arrival Info */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                      Arrival Information
                    </h3>
                    <div className="space-y-3">
                      {patient.ambulanceETA ? (
                        <div className="flex items-center justify-between p-3 bg-medical-orange/10 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AmbulanceIcon className="w-5 h-5 text-medical-orange" />
                            <span className="text-sm font-medium">Ambulance ETA</span>
                          </div>
                          <span className="text-lg font-bold text-medical-orange">{patient.ambulanceETA} min</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-medical-green/10 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-medical-green" />
                            <span className="text-sm font-medium">Arrived</span>
                          </div>
                          <span className="text-sm text-medical-green">
                            {new Date(patient.arrivalTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Status</span>
                        <Badge variant={patient.status === 'waiting' ? 'warning' : 'info'}>
                          {patient.status}
                        </Badge>
                      </div>
                      {patient.assignedDoctorId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">Assigned Doctor</span>
                          <span className="text-neutral-900 dark:text-white">Dr. Sanjay Gupta</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Right Column - Medical Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Symptoms & Chief Complaint */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                      Chief Complaint & Symptoms
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {patient.symptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="info" size="md" className="px-3 py-1">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                        Patient reports onset approximately 2 hours ago. Symptoms worsening gradually.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Medical History */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                      Medical History
                    </h3>
                    <div className="space-y-4">
                      {/* Chronic Conditions */}
                      <div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Chronic Conditions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {patientHistory.conditions.map((condition, idx) => (
                            <Badge key={idx} variant="outline" size="md" className="px-3 py-1">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <p className="text-sm font-medium text-medical-red mb-2">
                          Allergies
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {patientHistory.allergies.map((allergy, idx) => (
                            <Badge key={idx} variant="danger" size="md" className="px-3 py-1">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Current Medications */}
                      <div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Current Medications
                        </p>
                        <div className="space-y-2">
                          {patientHistory.medications.map((med, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Pill className="w-4 h-4 text-medical-cyan" />
                              <span className="text-neutral-600 dark:text-neutral-400">{med}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Previous Visits */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                      Previous Visits
                    </h3>
                    <div className="space-y-3">
                      {patientHistory.previousVisits.map((visit, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{visit.reason}</p>
                            <p className="text-sm text-neutral-500">{visit.doctor}</p>
                          </div>
                          <span className="text-sm text-neutral-400">{visit.date}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </>
          )}

          {activeTab === 'journey' && (
            <PatientJourney
              patientId={patient.id}
              patientName={patient.name}
              steps={MOCK_PATIENT_JOURNEY.steps}
              currentStep={MOCK_PATIENT_JOURNEY.currentStep.toString()}
              onStepClick={(stepId) => console.log('Step clicked:', stepId)}
            />
          )}

          {activeTab === 'documents' && (
            <div>
              {/* Notes & Documents */}
              <GlassCard className="p-4">
                <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
                  Attachments & Notes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-medical-cyan" />
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">Chest X-Ray</p>
                        <p className="text-xs text-neutral-500">Uploaded 10 min ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-medical-cyan" />
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">ECG Report</p>
                        <p className="text-xs text-neutral-500">Uploaded 15 min ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
