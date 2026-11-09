/**
 * Patient State Service
 * Manages patient lifecycle with immutable transitions
 */

    import { Patient, PatientStatus, StatusTransition, ALLOWED_TRANSITIONS, PatientJourney, DischargeSummary } from '../types/patient.types';

// Mock data (replace with DB queries later)
const mockPatients: Map<string, Patient> = new Map([
  ['pat-001', {
    id: 'pat-001',
    hospitalId: 'hosp-001',
    mrn: 'MRN001234',
    name: 'Rajesh Kumar',
    age: 65,
    gender: 'male',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension', 'Diabetes'],
    currentMedications: ['Aspirin 81mg', 'Metformin 500mg'],
    status: 'UNDER_TREATMENT',
    priority: 1,
    currentBedId: 'bed-001',
    currentDoctorId: 'doc-001',
    arrivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    triagedAt: new Date(Date.now() - 115 * 60 * 1000),
    bedAssignedAt: new Date(Date.now() - 100 * 60 * 1000),
    treatmentStartedAt: new Date(Date.now() - 90 * 60 * 1000),
    updatedAt: new Date(),
  }],
  ['pat-002', {
    id: 'pat-002',
    hospitalId: 'hosp-001',
    mrn: 'MRN005678',
    name: 'Sunita Patel',
    age: 45,
    gender: 'female',
    bloodGroup: 'B+',
    phone: '+91 98765 43211',
    allergies: ['Sulfa'],
    chronicConditions: ['Asthma'],
    currentMedications: ['Inhaler'],
    status: 'AWAITING_BED',
    priority: 2,
    arrivedAt: new Date(Date.now() - 45 * 60 * 1000),
    triagedAt: new Date(Date.now() - 35 * 60 * 1000),
    updatedAt: new Date(),
  }],
  ['pat-003', {
    id: 'pat-003',
    hospitalId: 'hosp-001',
    mrn: 'MRN009876',
    name: 'Amit Singh',
    age: 28,
    gender: 'male',
    bloodGroup: 'A+',
    phone: '+91 98765 43212',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    status: 'TRIAGED',
    priority: 3,
    arrivedAt: new Date(Date.now() - 30 * 60 * 1000),
    triagedAt: new Date(Date.now() - 25 * 60 * 1000),
    updatedAt: new Date(),
  }]
]);

const mockTransitions: StatusTransition[] = [];

export class PatientStateService {
  private patients: Map<string, Patient>;
  private transitions: StatusTransition[];

  constructor(patients: Map<string, Patient> = mockPatients, transitions: StatusTransition[] = mockTransitions) {
    this.patients = patients;
    this.transitions = transitions;
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<Patient | null> {
    return this.patients.get(patientId) || null;
  }

  /**
   * Get all patients (with optional status filter)
   */
  async getPatients(status?: PatientStatus): Promise<Patient[]> {
    const all = Array.from(this.patients.values());
    if (status) {
      return all.filter(p => p.status === status);
    }
    return all;
  }

  /**
   * Check if a transition is allowed
   */
  private isTransitionAllowed(from: PatientStatus, to: PatientStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[from];
    return allowed.includes(to);
  }

  /**
   * Calculate time spent in current status
   */
  private getTimeInStatus(patient: Patient): number {
    const relevantTime = this.getStatusStartTime(patient);
    return Math.round((Date.now() - relevantTime.getTime()) / (60 * 1000)); // minutes
  }

  /**
   * Get when patient entered current status
   */
  private getStatusStartTime(patient: Patient): Date {
    switch (patient.status) {
      case 'ARRIVED': return patient.arrivedAt;
      case 'IN_TRIAGE': return patient.triagedAt || patient.arrivedAt;
      case 'TRIAGED': return patient.triagedAt || patient.arrivedAt;
      case 'AWAITING_BED': return patient.triagedAt || patient.arrivedAt;
      case 'BED_ASSIGNED': return patient.bedAssignedAt || new Date();
      case 'IN_TRANSIT': return patient.bedAssignedAt || new Date();
      case 'UNDER_TREATMENT': return patient.treatmentStartedAt || new Date();
      case 'AWAITING_DISCHARGE': return patient.treatmentStartedAt || new Date();
      case 'DISCHARGED': return patient.dischargedAt || new Date();
      case 'TRANSFERRED': return patient.dischargedAt || new Date();
      case 'DECEASED': return patient.dischargedAt || new Date();
      default: return patient.updatedAt;
    }
  }

  /**
   * Transition patient to new status
   */
  async transitionPatient(
    patientId: string, 
    toStatus: PatientStatus, 
    actorId: string,
    actorType: 'doctor' | 'nurse' | 'admin' | 'system' = 'system',
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<Patient> {
    const patient = await this.getPatient(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const fromStatus = patient.status;

    // Check if transition is allowed
    if (!this.isTransitionAllowed(fromStatus, toStatus)) {
      throw new Error(
        `Invalid transition from ${fromStatus} to ${toStatus}. ` +
        `Allowed: ${ALLOWED_TRANSITIONS[fromStatus].join(', ')}`
      );
    }

    // Special validation rules
    if (toStatus === 'BED_ASSIGNED' && !metadata?.bedId) {
      throw new Error('Bed ID required for BED_ASSIGNED transition');
    }
    if (toStatus === 'UNDER_TREATMENT' && !metadata?.doctorId) {
      throw new Error('Doctor ID required for UNDER_TREATMENT transition');
    }

    // Create transition record
    const transition: StatusTransition = {
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      fromStatus,
      toStatus,
      reason,
      actorId,
      actorType,
      timestamp: new Date(),
      metadata,
    };
    this.transitions.push(transition);

    // Update patient
    const updatedPatient = { ...patient };
    updatedPatient.status = toStatus;
    updatedPatient.updatedAt = new Date();

    // Update timestamps based on new status
    switch (toStatus) {
      case 'IN_TRIAGE':
        updatedPatient.triagedAt = new Date();
        break;
      case 'TRIAGED':
        updatedPatient.triagedAt = updatedPatient.triagedAt || new Date();
        break;
      case 'BED_ASSIGNED':
        updatedPatient.bedAssignedAt = new Date();
        updatedPatient.currentBedId = metadata?.bedId;
        break;
      case 'UNDER_TREATMENT':
        updatedPatient.treatmentStartedAt = new Date();
        updatedPatient.currentDoctorId = metadata?.doctorId;
        break;
      case 'DISCHARGED':
      case 'TRANSFERRED':
      case 'DECEASED':
        updatedPatient.dischargedAt = new Date();
        // Clear bed assignment
        updatedPatient.currentBedId = undefined;
        break;
    }

    this.patients.set(patientId, updatedPatient);

    console.log(`Patient ${patientId} transitioned: ${fromStatus} → ${toStatus} by ${actorType}:${actorId}`);

    return updatedPatient;
  }

  /**
   * Get patient journey timeline
   */
  async getPatientJourney(patientId: string): Promise<PatientJourney | null> {
    const patient = await this.getPatient(patientId);
    if (!patient) {
      return null;
    }

    // Get all transitions for this patient
    const patientTransitions = this.transitions
      .filter(t => t.patientId === patientId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Build timeline
    // Build timeline
const timeline: {
    status: PatientStatus;
    timestamp: Date;
    duration?: number;
    actor?: string;
  }[] = [];
  
  let lastTimestamp = patient.arrivedAt;
  
  // Add initial state
  timeline.push({
    status: 'ARRIVED' as PatientStatus,
    timestamp: patient.arrivedAt,
    duration: 0,
  });
  
  // Add transitions
  for (const trans of patientTransitions) {
    const duration = Math.round((trans.timestamp.getTime() - lastTimestamp.getTime()) / (60 * 1000));
    timeline.push({
      status: trans.toStatus,
      timestamp: trans.timestamp,
      duration: duration > 0 ? duration : undefined,
      actor: trans.actorType === 'system' ? 'System' : trans.actorId,
    });
    lastTimestamp = trans.timestamp;
  }

    // Calculate waiting time (time from arrival to treatment start)
    const waitingTime = patient.treatmentStartedAt 
      ? Math.round((patient.treatmentStartedAt.getTime() - patient.arrivedAt.getTime()) / (60 * 1000))
      : this.getTimeInStatus(patient);

    // Estimate discharge (simple rule: 24 hours from arrival for now)
    const estimatedDischarge = patient.status !== 'DISCHARGED' && patient.status !== 'DECEASED'
      ? new Date(patient.arrivedAt.getTime() + 24 * 60 * 60 * 1000)
      : undefined;

    return {
      patientId: patient.id,
      patientName: patient.name,
      currentStatus: patient.status,
      currentPriority: patient.priority,
      waitingTime,
      estimatedTreatmentTime: patient.status === 'UNDER_TREATMENT' ? 120 : undefined, // placeholder
      estimatedDischarge,
      timeline,
    };
  }

  /**
   * Get all patients waiting for a specific resource
   */
  async getWaitingPatients(resourceType: 'bed' | 'doctor' | 'triage'): Promise<Patient[]> {
    const all = Array.from(this.patients.values());
    
    switch (resourceType) {
      case 'bed':
        return all.filter(p => 
          p.status === 'AWAITING_BED' || 
          (p.status === 'TRIAGED' && p.priority && p.priority <= 3)
        );
      case 'doctor':
        return all.filter(p => 
          p.status === 'UNDER_TREATMENT' && !p.currentDoctorId
        );
      case 'triage':
        return all.filter(p => 
          p.status === 'ARRIVED' || p.status === 'IN_TRIAGE'
        );
      default:
        return [];
    }
  }

  /**
   * Generate discharge summary
   */
  async generateDischargeSummary(patientId: string, doctorId: string): Promise<DischargeSummary> {
    const patient = await this.getPatient(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    if (patient.status !== 'AWAITING_DISCHARGE') {
      throw new Error(`Patient cannot be discharged from status: ${patient.status}`);
    }

    const lengthOfStay = Math.round((Date.now() - patient.arrivedAt.getTime()) / (60 * 60 * 1000));

    // Mock summary (would come from actual treatment records)
    const summary: DischargeSummary = {
      patientId: patient.id,
      admittedAt: patient.arrivedAt,
      dischargedAt: new Date(),
      lengthOfStay,
      admittingDiagnosis: 'Chest pain, suspected MI',
      dischargeDiagnosis: 'Acute Myocardial Infarction, managed',
      procedures: ['Angiography', 'Angioplasty with stent'],
      medications: [
        { name: 'Aspirin', dosage: '81mg daily', duration: 'Lifelong' },
        { name: 'Clopidogrel', dosage: '75mg daily', duration: '12 months' },
        { name: 'Atorvastatin', dosage: '40mg daily', duration: 'Lifelong' },
      ],
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      followUpSpecialty: 'Cardiology',
      dischargeInstructions: 'Return to ED if chest pain recurs. Follow up with cardiology in 1 week.',
      doctorId,
      doctorName: 'Dr. Sanjay Gupta', // Would fetch from doctor service
    };

    return summary;
  }

  /**
   * Get metrics for dashboard
   */
  async getMetrics() {
    const all = Array.from(this.patients.values());
    
    return {
      totalPatients: all.length,
      byStatus: {
        arrived: all.filter(p => p.status === 'ARRIVED').length,
        inTriage: all.filter(p => p.status === 'IN_TRIAGE').length,
        triaged: all.filter(p => p.status === 'TRIAGED').length,
        awaitingBed: all.filter(p => p.status === 'AWAITING_BED').length,
        underTreatment: all.filter(p => p.status === 'UNDER_TREATMENT').length,
        awaitingDischarge: all.filter(p => p.status === 'AWAITING_DISCHARGE').length,
        discharged: all.filter(p => p.status === 'DISCHARGED').length,
      },
      byPriority: {
        p1: all.filter(p => p.priority === 1).length,
        p2: all.filter(p => p.priority === 2).length,
        p3: all.filter(p => p.priority === 3).length,
        p4: all.filter(p => p.priority === 4).length,
        p5: all.filter(p => p.priority === 5).length,
      },
      averageWaitTime: 35, // placeholder
      averageLengthOfStay: 28, // placeholder
    };
  }

  /**
   * Get transition history for a patient
   */
  async getTransitionHistory(patientId: string): Promise<StatusTransition[]> {
    return this.transitions
      .filter(t => t.patientId === patientId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}