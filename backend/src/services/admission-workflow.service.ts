/**
 * Admission Workflow Service
 * Coordinates between state machine and allocation engine
 */

import { PatientStateService } from './patient-state.service';
import { BedAllocationService } from './bed-allocation.service';
import type { AdmissionRequirements } from '../types/allocation.types';

export class AdmissionWorkflowService {
  private patientService: PatientStateService;
  private allocationService: BedAllocationService;

  constructor() {
    this.patientService = new PatientStateService();
    this.allocationService = new BedAllocationService();
  }

  /**
   * Complete admission workflow for a patient
   */
  async admitPatient(
    patientId: string,
    requirements: AdmissionRequirements,
    doctorId: string
  ) {
    // 1. Find best bed
    const allocation = await this.allocationService.findBestBed(requirements);
    
    if (!allocation.success || !allocation.bed) {
      // No bed available - put patient in waiting state
      await this.patientService.transitionPatient(
        patientId,
        'AWAITING_BED',
        'system',
        'system',
        'No bed available',
        { requirements }
      );
      return {
        success: false,
        message: 'No bed available',
        suggestedAction: allocation.suggestedAction,
        alternatives: allocation.alternatives,
      };
    }

    // 2. Transition patient to BED_ASSIGNED
    await this.patientService.transitionPatient(
      patientId,
      'BED_ASSIGNED',
      doctorId,
      'doctor',
      'Bed allocated',
      { bedId: allocation.bed.id, score: allocation.score }
    );

    // 3. Reserve the bed
    await this.allocationService.reserveBed(
      allocation.bed.id,
      patientId,
      doctorId,
      4 // Default 4 hours estimated stay
    );

    return {
      success: true,
      bed: allocation.bed,
      score: allocation.score,
      message: `Bed ${allocation.bed.bedNumber} allocated`,
    };
  }

  /**
   * Complete patient arrival (patient physically in bed)
   */
  async completeArrival(patientId: string, bedId: string) {
    // 1. Occupy the bed
    await this.allocationService.occupyBed(bedId, patientId);

    // 2. Transition patient to UNDER_TREATMENT
    const patient = await this.patientService.getPatient(patientId);
    if (!patient) throw new Error('Patient not found');

    await this.patientService.transitionPatient(
      patientId,
      'UNDER_TREATMENT',
      patient.currentDoctorId || 'system',
      'doctor',
      'Patient arrived at bed'
    );

    return { success: true };
  }

  /**
   * Start discharge process
   */
  async startDischarge(patientId: string, doctorId: string) {
    const patient = await this.patientService.getPatient(patientId);
    if (!patient) throw new Error('Patient not found');

    // 1. Transition patient
    await this.patientService.transitionPatient(
      patientId,
      'AWAITING_DISCHARGE',
      doctorId,
      'doctor',
      'Treatment complete'
    );

    // 2. If bed exists, mark it for cleaning
    if (patient.currentBedId) {
      await this.allocationService.startCleaning(patient.currentBedId);
    }

    return { success: true };
  }

  /**
   * Complete discharge
   */
  async completeDischarge(patientId: string, doctorId: string) {
    const patient = await this.patientService.getPatient(patientId);
    if (!patient) throw new Error('Patient not found');

    // 1. Generate discharge summary
    const summary = await this.patientService.generateDischargeSummary(patientId, doctorId);

    // 2. Transition patient
    await this.patientService.transitionPatient(
      patientId,
      'DISCHARGED',
      doctorId,
      'doctor',
      'Discharged'
    );

    // 3. Complete cleaning if bed exists
    if (patient.currentBedId) {
      await this.allocationService.completeCleaning(patient.currentBedId);
    }

    return { success: true, summary };
  }
}