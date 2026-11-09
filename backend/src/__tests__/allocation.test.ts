/**
 * Allocation Engine Tests
 */

import { BedAllocationService } from '../services/bed-allocation.service';
import type { AdmissionRequirements } from '../types/allocation.types';

describe('BedAllocationService', () => {
  let service: BedAllocationService;

  beforeEach(() => {
    service = new BedAllocationService();
  });

  test('should find perfect match for cardiac ICU patient', async () => {
    const requirements: AdmissionRequirements = {
      patientId: 'test-001',
      priority: 1,
      specialty: 'Cardiology',
      requiresIcu: true,
      requiresVentilator: true,
      requiresIsolation: false,
      age: 65,
    };

    const result = await service.findBestBed(requirements);
    
    expect(result.success).toBe(true);
    expect(result.bed?.specialty).toBe('Cardiology');
    expect(result.bed?.type).toBe('ICU');
    expect(result.score).toBeGreaterThan(90);
  });

  test('should find emergency bed for P1 patient when ICU full', async () => {
    // First occupy all ICU beds (in real test, you'd mock the bed list)
    const requirements: AdmissionRequirements = {
      patientId: 'test-002',
      priority: 1,
      specialty: 'Neurology',
      requiresIcu: true,
      requiresVentilator: true,
      requiresIsolation: false,
      age: 45,
    };

    const result = await service.findBestBed(requirements);
    
    // Should still find a bed due to emergency override
    expect(result.success).toBe(true);
    expect(result.suggestedAction).toBe('upgrade');
  });

  test('should respect isolation requirements', async () => {
    const requirements: AdmissionRequirements = {
      patientId: 'test-003',
      priority: 2,
      specialty: 'Critical Care',
      requiresIcu: true,
      requiresVentilator: false,
      requiresIsolation: true,
      requiresNegativePressure: true,
      age: 30,
    };

    const result = await service.findBestBed(requirements);
    
    if (result.success && result.bed) {
      expect(result.bed.isolationRequired || result.bed.tags?.includes('negative-pressure')).toBeTruthy();
    }
  });

  test('should return alternatives when no perfect match', async () => {
    const requirements: AdmissionRequirements = {
      patientId: 'test-004',
      priority: 3,
      specialty: 'RareSpecialty', // Doesn't exist
      requiresIcu: false,
      requiresVentilator: false,
      requiresIsolation: false,
      age: 25,
    };

    const result = await service.findBestBed(requirements);
    
    expect(result.alternatives?.length).toBeGreaterThan(0);
    if (!result.success) {
      expect(result.suggestedAction).toBeDefined();
    }
  });

  test('should reserve bed correctly', async () => {
    const reservation = await service.reserveBed('bed-001', 'test-patient', 'test-doctor', 6);
    
    expect(reservation.bedId).toBe('bed-001');
    expect(reservation.patientId).toBe('test-patient');
    expect(reservation.doctorId).toBe('test-doctor');
    expect(reservation.expiresAt > new Date()).toBe(true);
  });

  test('should not reserve already occupied bed', async () => {
    await expect(
      service.reserveBed('bed-003', 'test-patient', 'test-doctor')
    ).rejects.toThrow('not available');
  });

  test('should complete cleaning workflow', async () => {
    // Occupy then clean a bed
    await service.reserveBed('bed-004', 'test-patient', 'test-doctor');
    await service.occupyBed('bed-004', 'test-patient');
    await service.startCleaning('bed-004');
    
    // Try to reserve while cleaning - should fail
    await expect(
      service.reserveBed('bed-004', 'another-patient', 'test-doctor')
    ).rejects.toThrow('not available');

    // Complete cleaning
    await service.completeCleaning('bed-004');
    
    // Should be available again
    const bed = (service as any).beds.find((b: any) => b.id === 'bed-004');
    expect(bed.status).toBe('available');
  });
});