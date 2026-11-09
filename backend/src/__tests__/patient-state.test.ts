/**
 * Patient State Service Tests
 */

import { PatientStateService } from '../services/patient-state.service';
import { ALLOWED_TRANSITIONS } from '../types/patient.types';

describe('PatientStateService', () => {
  let service: PatientStateService;

  beforeEach(() => {
    service = new PatientStateService();
  });

  test('should allow valid transitions', async () => {
    const patient = await service.getPatient('pat-003');
    expect(patient?.status).toBe('TRIAGED');

    // Try valid transition
    const updated = await service.transitionPatient(
      'pat-003',
      'AWAITING_BED',
      'test-actor',
      'system',
      'Test transition'
    );

    expect(updated.status).toBe('AWAITING_BED');
  });

  test('should reject invalid transitions', async () => {
    const patient = await service.getPatient('pat-003');
    expect(patient?.status).toBe('TRIAGED');

    // Try invalid transition (TRIAGED cannot go directly to DISCHARGED)
    await expect(
      service.transitionPatient('pat-003', 'DISCHARGED', 'test-actor')
    ).rejects.toThrow('Invalid transition');
  });

  test('should track transition history', async () => {
    // Perform multiple transitions
    await service.transitionPatient('pat-003', 'AWAITING_BED', 'actor-1');
    await service.transitionPatient('pat-003', 'BED_ASSIGNED', 'actor-2', 'system', undefined, {
      bedId: 'bed-004',
    });
    await service.transitionPatient('pat-003', 'IN_TRANSIT', 'actor-2');
    await service.transitionPatient('pat-003', 'UNDER_TREATMENT', 'actor-1', 'doctor', undefined, {
      doctorId: 'doc-001',
    });

    const history = await service.getTransitionHistory('pat-003');
    expect(history.length).toBe(4);
    
    // Check order (most recent first)
    expect(history[0].toStatus).toBe('UNDER_TREATMENT');
    expect(history[3].toStatus).toBe('AWAITING_BED');
  });

  test('should generate patient journey', async () => {
    const journey = await service.getPatientJourney('pat-001');
    
    expect(journey).toBeDefined();
    expect(journey?.patientName).toBe('Rajesh Kumar');
    expect(journey?.currentStatus).toBe('UNDER_TREATMENT');
    expect(journey?.timeline.length).toBeGreaterThan(0);
  });

  test('should get waiting patients by resource', async () => {
    const waitingForBed = await service.getWaitingPatients('bed');
    const waitingForTriage = await service.getWaitingPatients('triage');

    expect(Array.isArray(waitingForBed)).toBe(true);
    expect(Array.isArray(waitingForTriage)).toBe(true);
  });

  test('should generate discharge summary', async () => {
    // First transition patient to AWAITING_DISCHARGE
    await service.transitionPatient('pat-001', 'AWAITING_DISCHARGE', 'doc-001', 'doctor');

    const summary = await service.generateDischargeSummary('pat-001', 'doc-001');
    
    expect(summary.patientId).toBe('pat-001');
    expect(summary.doctorId).toBe('doc-001');
    expect(summary.followUpRequired).toBe(true);
    expect(summary.medications.length).toBeGreaterThan(0);
  });

  test('should get metrics', async () => {
    const metrics = await service.getMetrics();
    
    expect(metrics.totalPatients).toBeGreaterThan(0);
    expect(metrics.byStatus).toBeDefined();
    expect(metrics.byPriority).toBeDefined();
  });
});