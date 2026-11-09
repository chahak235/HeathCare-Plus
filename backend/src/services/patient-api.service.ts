import { randomUUID } from 'crypto';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phoneNumber?: string;
  email?: string;
  hospitalId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  mrn: string;
}

export interface PatientWorkflow {
  patientId: string;
  status: 'ARRIVED' | 'IN_TRIAGE' | 'TRIAGED' | 'AWAITING_BED' | 'BED_ASSIGNED' | 'IN_TRANSIT' | 'UNDER_TREATMENT' | 'AWAITING_DISCHARGE' | 'DISCHARGED' | 'TRANSFERRED' | 'DECEASED';
  priority?: 1 | 2 | 3 | 4 | 5 | 6;
  currentBedId?: string;
  currentDoctorId?: string;
  triagedAt?: Date;
  bedAssignedAt?: Date;
  treatmentStartedAt?: Date;
  dischargedAt?: Date;
  symptoms?: string[];
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    oxygenSaturation?: number;
    temperature?: number;
  };
}

export class PatientAPIService {
  private patients: Map<string, Patient>;
  private workflows: Map<string, PatientWorkflow>;

  constructor() {
    console.log('🔧 Initializing PatientAPIService...');
    this.patients = new Map();
    this.workflows = new Map();
    this.initializeMockData();
    console.log(`✅ PatientAPIService initialized with ${this.patients.size} patients`);
  }

  private initializeMockData() {
    const now = new Date();
    
    const mockPatients: any[] = [
      {
        id: 'pat-001',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        dateOfBirth: new Date(1958, 5, 15),
        gender: 'male',
        phoneNumber: '+91 98765 43210',
        email: 'rajesh.k@email.com',
        hospitalId: 'hosp-001',
        isActive: true,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: now,
        mrn: 'MRN001234',
      },
      {
        id: 'pat-002',
        firstName: 'Sunita',
        lastName: 'Patel',
        dateOfBirth: new Date(1978, 8, 22),
        gender: 'female',
        phoneNumber: '+91 5 43211',
        email: 'sunita.p@email.com',
        hospitalId: 'hosp-001',
        isActive: true,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        updatedAt: now,
        mrn: 'MRN005678',
      },
      {
        id: 'pat-003',
        firstName: 'Amit',
        lastName: 'Singh',
        dateOfBirth: new Date(1995, 2, 10),
        gender: 'male',
        phoneNumber: '+91 98765 43212',
        email: 'amit.s@email.com',
        hospitalId: 'hosp-001',
        isActive: true,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        updatedAt: now,
        mrn: 'MRN009876',
      },
    ];

    mockPatients.forEach(p => {
      this.patients.set(p.id, p as Patient);
    });

    // Add workflows for existing patients
    const mockWorkflows: PatientWorkflow[] = [
      {
        patientId: 'pat-001',
        status: 'UNDER_TREATMENT',
        priority: 1,
        currentBedId: 'bed-001',
        currentDoctorId: 'doc-001',
        triagedAt: new Date(now.getTime() - 115 * 60 * 1000),
        bedAssignedAt: new Date(now.getTime() - 100 * 60 * 1000),
        treatmentStartedAt: new Date(now.getTime() - 90 * 60 * 1000),
        symptoms: ['Chest pain', 'Shortness of breath'],
        vitals: {
          heartRate: 98,
          bloodPressure: '140/90',
          oxygenSaturation: 95,
          temperature: 98.6
        }
      },
      {
        patientId: 'pat-002',
        status: 'AWAITING_BED',
        priority: 2,
        triagedAt: new Date(now.getTime() - 35 * 60 * 1000),
        symptoms: ['Fever', 'Cough'],
        vitals: {
          heartRate: 102,
          bloodPressure: '130/85',
          oxygenSaturation: 97,
          temperature: 101.2
        }
      },
      {
        patientId: 'pat-003',
        status: 'TRIAGED',
        priority: 3,
        triagedAt: new Date(now.getTime() - 25 * 60 * 1000),
        symptoms: ['Headache', 'Nausea'],
        vitals: {
          heartRate: 82,
          bloodPressure: '125/80',
          oxygenSaturation: 98,
          temperature: 98.4
        }
      }
    ];

    mockWorkflows.forEach(w => {
      this.workflows.set(w.patientId, w);
    });
  }

  async createPatient(data: any): Promise<Patient> {
    try {
      const patientId = `pat-${randomUUID().substring(0, 8)}`;
      const now = new Date();

      let dateOfBirth = data.dateOfBirth;
      if (typeof dateOfBirth === 'string') {
        dateOfBirth = new Date(dateOfBirth);
      }

      const patient: any = {
        id: patientId,
        mrn: `MRN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: dateOfBirth,
        gender: data.gender,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        hospitalId: data.hospitalId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      this.patients.set(patientId, patient as Patient);
      
      // Create initial workflow
      const workflow: PatientWorkflow = {
        patientId,
        status: 'ARRIVED'
      };
      this.workflows.set(patientId, workflow);
      
      console.log(`✅ Patient created: ${patientId}`);
      return patient as Patient;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    return this.patients.get(id) || null;
  }

  async getPatientWithWorkflow(id: string): Promise<any | null> {
    const patient = this.patients.get(id);
    if (!patient) return null;
    
    const workflow = this.workflows.get(id) || { status: 'UNKNOWN' };
    return { ...patient, workflow };
  }

  async getPatients(options: any = {}): Promise<any> {
    let patients = Array.from(this.patients.values());

    if (options.search) {
      const search = options.search.toLowerCase();
      patients = patients.filter(p => 
        p.firstName?.toLowerCase().includes(search) ||
        p.lastName?.toLowerCase().includes(search) ||
        p.mrn?.toLowerCase().includes(search)
      );
    }

    if (options.status) {
      const patientIdsWithStatus = Array.from(this.workflows.entries())
        .filter(([_, w]) => w.status === options.status)
        .map(([id, _]) => id);
      patients = patients.filter(p => patientIdsWithStatus.includes(p.id));
    }

    if (options.priority) {
      const patientIdsWithPriority = Array.from(this.workflows.entries())
        .filter(([_, w]) => w.priority === options.priority)
        .map(([id, _]) => id);
      patients = patients.filter(p => patientIdsWithPriority.includes(p.id));
    }

    patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      patients: patients.slice(0, options.limit || 50),
      total: patients.length,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  }

  async getPatientStats(): Promise<any> {
    const patients = Array.from(this.patients.values());
    const workflows = Array.from(this.workflows.values());
    
    const byStatus: Record<string, number> = {};
    workflows.forEach(w => {
      byStatus[w.status] = (byStatus[w.status] || 0) + 1;
    });

    const byPriority = {
      p1: workflows.filter(w => w.priority === 1).length,
      p2: workflows.filter(w => w.priority === 2).length,
      p3: workflows.filter(w => w.priority === 3).length,
      p4: workflows.filter(w => w.priority === 4).length,
      p5: workflows.filter(w => w.priority === 5).length,
    };

    return {
      totalPatients: patients.length,
      byStatus,
      byPriority,
      averageWaitTime: 35,
      averageLengthOfStay: 28,
      currentWaiting: workflows.filter(w => 
        w.status === 'AWAITING_BED' || w.status === 'TRIAGED'
      ).length,
      admittedToday: patients.length,
      dischargedToday: workflows.filter(w => w.status === 'DISCHARGED').length,
    };
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const search = query.toLowerCase();
    const patients = Array.from(this.patients.values());
    
    return patients.filter(p => 
      p.firstName?.toLowerCase().includes(search) ||
      p.lastName?.toLowerCase().includes(search) ||
      p.mrn?.toLowerCase().includes(search)
    ).slice(0, 10);
  }

  async updatePatient(id: string, data: any): Promise<Patient | null> {
    const patient = this.patients.get(id);
    if (!patient) return null;

    const updatedPatient = { ...patient, ...data, updatedAt: new Date() };
    this.patients.set(id, updatedPatient as Patient);
    return updatedPatient as Patient;
  }

  async transitionPatientStatus(
    patientId: string, 
    toStatus: PatientWorkflow['status'], 
    actorId: string,
    metadata?: any
  ): Promise<any> {
    const patient = this.patients.get(patientId);
    if (!patient) throw new Error('Patient not found');

    const currentWorkflow = this.workflows.get(patientId) || { patientId, status: 'ARRIVED' };
    
    const updatedWorkflow: PatientWorkflow = {
      ...currentWorkflow,
      status: toStatus,
      ...metadata
    };

    // Update timestamps based on status
    const now = new Date();
    if (toStatus === 'TRIAGED' && !updatedWorkflow.triagedAt) {
      updatedWorkflow.triagedAt = now;
    } else if (toStatus === 'BED_ASSIGNED') {
      updatedWorkflow.bedAssignedAt = now;
    } else if (toStatus === 'UNDER_TREATMENT') {
      updatedWorkflow.treatmentStartedAt = now;
    } else if (toStatus === 'DISCHARGED' || toStatus === 'TRANSFERRED' || toStatus === 'DECEASED') {
      updatedWorkflow.dischargedAt = now;
    }

    this.workflows.set(patientId, updatedWorkflow);
    console.log(`✅ Patient ${patientId} transitioned to ${toStatus}`);

    return { ...patient, workflow: updatedWorkflow };
  }

  async getPatientJourney(id: string): Promise<any | null> {
    const patient = this.patients.get(id);
    if (!patient) return null;

    const workflow = this.workflows.get(id);
    
    return {
      patientId: id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      currentStatus: workflow?.status || 'KNOWN',
      currentPriority: workflow?.priority,
      timeline: [
        {
          status: 'ARRIVED',
          timestamp: patient.createdAt,
        }
      ],
      waitingTime: workflow?.triagedAt ? 
        Math.round((workflow.triagedAt.getTime() - patient.createdAt.getTime()) / (60 * 1000)) : 0,
    };
  }

  async getWaitingPatients(resourceType: string): Promise<any[]> {
    const workflows = Array.from(this.workflows.entries());
    
    let filteredWorkflows;
    switch (resourceType) {
      case 'bed':
        filteredWorkflows = workflows.filter(([_, w]) => 
          w.status === 'AWAITING_BED' || (w.status === 'TRIAGED' && w.priority && w.priority <= 3)
        );
        break;
      case 'doctor':
        filteredWorkflows = workflows.filter(([_, w]) => 
          w.status === 'UNDER_TREATMENT' && !w.currentDoctorId
        );
        break;
      case 'triage':
        filteredWorkflows = workflows.filter(([_, w]) => 
          w.status === 'ARRIVED' || w.status === 'IN_TRIAGE'
        );
        break;
      default:
        return [];
    }

    return filteredWorkflows.map(([patientId, workflow]) => ({
      ...this.patients.get(patientId),
      workflow
    })).filter(p => p && p.id);
  }
}
