/**
 * Bed Allocation Service
 * Core intelligence for matching patients to beds.
 *
 * Data source: the real `beds` table (entities/Bed.entity.ts), via TypeORM.
 * Previously this ran entirely against a hardcoded in-memory mock array —
 * every reservation/occupy/clean call mutated fake objects that reset on
 * every server restart. All state here is now persisted for real.
 */

import { AppDataSource } from '../config/database.config';
import { Bed as BedEntity } from '../entities/Bed.entity';
import { WaitTimeSample } from '../entities/WaitTimeSample.entity';
import type { Bed, AdmissionRequirements, AllocationResult, BedReservation, AllocationMetrics } from '../types/allocation.types';

export class BedAllocationService {
  private bedRepository = AppDataSource.getRepository(BedEntity);
  private waitTimeRepository = AppDataSource.getRepository(WaitTimeSample);

  // Map a DB row onto the allocation engine's Bed shape. IDs are stringified
  // to keep the public API (bedId: string, hospitalId: string) unchanged for
  // every existing caller (controllers, socket service, admission workflow).
  private toAllocationBed(b: BedEntity): Bed {
    return {
      id: String(b.id),
      hospitalId: String(b.hospitalId),
      bedNumber: b.bedNumber,
      specialty: b.specialty || 'General Medicine',
      type: (b.type as any) || 'General',
      ward: b.ward || '',
      floor: b.floor ?? 0,
      status: b.status as any,
      equipment: b.equipment || [],
      isolationRequired: b.isIsolation,
      currentPatientId: b.currentPatientId != null ? String(b.currentPatientId) : undefined,
      estimatedVacancy: b.estimatedVacancy || undefined,
      lastCleaned: b.lastCleaned || b.createdAt,
      isFemaleOnly: b.isFemaleOnly,
      isPediatric: b.isPediatric,
      tags: b.tags || undefined,
    };
  }

  private async loadBeds(hospitalId?: number): Promise<Bed[]> {
    const rows = await this.bedRepository.find(
      hospitalId ? { where: { hospitalId } } : {}
    );
    return rows.map((b) => this.toAllocationBed(b));
  }

  /**
   * Get all available beds (status = 'available' or 'reserved' with estimated vacancy soon)
   */
  private getAvailableBeds(beds: Bed[]): Bed[] {
    return beds.filter(bed =>
      bed.status === 'available' ||
      (bed.status === 'reserved' && bed.estimatedVacancy && bed.estimatedVacancy < new Date(Date.now() + 30 * 60 * 1000))
    );
  }

  /**
   * Score a bed against patient requirements (0-100)
   */
  private calculateMatchScore(bed: Bed, requirements: AdmissionRequirements): number {
    let score = 0;
    const weights = {
      specialtyMatch: 40,
      typeMatch: 25,
      equipmentMatch: 15,
      isolationMatch: 10,
      demographicMatch: 10,
    };

    // Specialty match (weight: 40)
    if (bed.specialty === requirements.specialty) {
      score += weights.specialtyMatch;
    } else {
      // Partial credit for related specialties
      const relatedSpecialties: Record<string, string[]> = {
        'Cardiology': ['Critical Care', 'Internal Medicine'],
        'Neurology': ['Critical Care', 'Neurosurgery'],
        'Pediatrics': ['Neonatology', 'General Medicine'],
        'Emergency Medicine': ['Critical Care', 'General Medicine'],
      };
      if (relatedSpecialties[requirements.specialty]?.includes(bed.specialty)) {
        score += weights.specialtyMatch * 0.5;
      }
    }

    // Bed type match (weight: 25)
    if (requirements.requiresIcu) {
      if (bed.type === 'ICU' || bed.type === 'NICU' || bed.type === 'CCU') {
        score += weights.typeMatch;
      } else if (bed.type === 'Emergency') {
        score += weights.typeMatch * 0.7; // Emergency can temporarily hold ICU
      }
    } else {
      if (bed.type === 'General') {
        score += weights.typeMatch;
      } else if (bed.type === 'Emergency') {
        score += weights.typeMatch * 0.5;
      }
    }

    // Equipment match (weight: 15)
    if (requirements.requiresVentilator) {
      if (bed.equipment.includes('ventilator')) {
        score += weights.equipmentMatch * 0.6;
      }
    } else {
      score += weights.equipmentMatch * 0.3; // Non-ventilator patients always get partial
    }

    // Additional equipment bonuses
    const requiredEquip = requirements.requiresVentilator ? ['ventilator'] : [];
    const matchingEquip = requiredEquip.filter(e => bed.equipment.includes(e)).length;
    const equipScore = (matchingEquip / Math.max(requiredEquip.length, 1)) * weights.equipmentMatch;
    score += equipScore;

    // Isolation requirements (weight: 10)
    if (requirements.requiresIsolation === bed.isolationRequired) {
      score += weights.isolationMatch;
    } else if (bed.tags?.includes('negative-pressure') && requirements.requiresNegativePressure) {
      score += weights.isolationMatch * 0.8;
    }

    // Demographic constraints (weight: 10)
    if (requirements.isPediatric && bed.isPediatric) {
      score += weights.demographicMatch * 0.5;
    }
    if (requirements.gender && bed.isFemaleOnly && requirements.gender === 'female') {
      score += weights.demographicMatch * 0.5;
    } else if (requirements.gender && bed.isFemaleOnly && requirements.gender !== 'female') {
      score -= weights.demographicMatch; // Penalty for wrong gender
    }

    // Penalty for beds that are reserved (but will be free soon)
    if (bed.status === 'reserved') {
      score *= 0.8;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Find the best bed for a patient based on requirements.
   * Pass hospitalId to restrict the search to one hospital's beds; omit to
   * search across every hospital in the system.
   */
  async findBestBed(requirements: AdmissionRequirements, hospitalId?: number): Promise<AllocationResult> {
    const allBeds = await this.loadBeds(hospitalId);
    const availableBeds = this.getAvailableBeds(allBeds);

    if (availableBeds.length === 0) {
      return {
        success: false,
        reason: 'No beds available',
        suggestedAction: 'wait',
        alternatives: [],
      };
    }

    // Score all available beds
    const scoredBeds = availableBeds.map(bed => ({
      bed,
      score: this.calculateMatchScore(bed, requirements),
    }));

    // Sort by score descending
    scoredBeds.sort((a, b) => b.score - a.score);

    // Get top 3 alternatives
    const alternatives = scoredBeds.slice(0, 3).map(sb => sb.bed);

    // If top score is below threshold, no good match
    if (scoredBeds.length === 0 || scoredBeds[0].score < 50) {
      // Check for emergency override (P1 only)
      if (requirements.priority === 1) {
        // For P1, take any bed that can stabilize patient
        const anyIcu = availableBeds.find(b => b.type === 'ICU' || b.type === 'Emergency');
        if (anyIcu) {
          return {
            success: true,
            bed: anyIcu,
            score: this.calculateMatchScore(anyIcu, requirements),
            alternatives,
            reason: 'Emergency override: P1 patient allocated to any ICU bed',
            suggestedAction: 'upgrade',
          };
        }
      }

      return {
        success: false,
        reason: 'No suitable bed found (match score below threshold)',
        suggestedAction: requirements.priority <= 2 ? 'transfer' : 'wait',
        alternatives,
      };
    }

    // Return best match
    return {
      success: true,
      bed: scoredBeds[0].bed,
      score: scoredBeds[0].score,
      alternatives: alternatives.slice(1),
      suggestedAction: scoredBeds[0].score > 80 ? undefined : 'downgrade',
    };
  }

  private async getBedOrThrow(bedId: string): Promise<BedEntity> {
    const id = parseInt(bedId, 10);
    if (isNaN(id)) throw new Error('Invalid bed id');
    const bed = await this.bedRepository.findOne({ where: { id } });
    if (!bed) throw new Error('Bed not found');
    return bed;
  }

  /**
   * Get a single bed in the allocation engine's Bed shape (used by the
   * socket-broadcasting subclass instead of reaching into private state).
   */
  async getBedById(bedId: string): Promise<Bed | null> {
    try {
      const bed = await this.getBedOrThrow(bedId);
      return this.toAllocationBed(bed);
    } catch {
      return null;
    }
  }

  /**
   * Reserve a bed for a patient
   */
  async reserveBed(bedId: string, patientId: string, doctorId: string, duration?: number): Promise<BedReservation> {
    const bed = await this.getBedOrThrow(bedId);

    if (bed.status !== 'available' && bed.status !== 'reserved') {
      throw new Error(`Bed is not available (current status: ${bed.status})`);
    }

    bed.status = 'reserved';
    bed.currentPatientId = parseInt(patientId, 10);
    bed.estimatedVacancy = new Date(Date.now() + (duration || 4) * 60 * 60 * 1000); // Default 4 hours
    await this.bedRepository.save(bed);

    return {
      bedId,
      patientId,
      doctorId,
      reservedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minute reservation timeout
      estimatedDuration: duration,
    };
  }

  /**
   * Release a bed reservation (if patient doesn't show up)
   */
  async releaseReservation(bedId: string): Promise<void> {
    const bed = await this.getBedOrThrow(bedId);

    if (bed.status !== 'reserved') {
      throw new Error(`Bed is not reserved (current status: ${bed.status})`);
    }

    bed.status = 'available';
    bed.currentPatientId = null as any;
    bed.estimatedVacancy = null as any;
    await this.bedRepository.save(bed);
  }

  /**
   * Occupy a bed (patient arrives)
   */
  async occupyBed(bedId: string, patientId: string): Promise<void> {
    const bed = await this.getBedOrThrow(bedId);

    if (bed.status !== 'reserved') {
      throw new Error(`Bed is not reserved (current status: ${bed.status})`);
    }

    if (String(bed.currentPatientId) !== patientId) {
      throw new Error(`Bed reserved for different patient (expected: ${bed.currentPatientId})`);
    }

    bed.status = 'occupied';
    await this.bedRepository.save(bed);
  }

  /**
   * Start cleaning a bed (after discharge)
   */
  async startCleaning(bedId: string): Promise<void> {
    const bed = await this.getBedOrThrow(bedId);

    if (bed.status !== 'occupied') {
      throw new Error(`Bed is not occupied (current status: ${bed.status})`);
    }

    bed.status = 'cleaning';
    bed.currentPatientId = null as any;
    bed.lastCleaned = new Date();
    await this.bedRepository.save(bed);
  }

  /**
   * Complete cleaning (bed becomes available)
   */
  async completeCleaning(bedId: string): Promise<void> {
    const bed = await this.getBedOrThrow(bedId);

    if (bed.status !== 'cleaning') {
      throw new Error(`Bed is not being cleaned (current status: ${bed.status})`);
    }

    bed.status = 'available';
    bed.estimatedVacancy = null as any;
    await this.bedRepository.save(bed);
  }

  /**
   * Get allocation metrics, optionally scoped to one hospital.
   */
  async getMetrics(hospitalId?: number): Promise<AllocationMetrics> {
    const beds = await this.loadBeds(hospitalId);
    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'available').length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;

    const specialtyMap = new Map<string, { total: number; occupied: number }>();
    beds.forEach(bed => {
      const current = specialtyMap.get(bed.specialty) || { total: 0, occupied: 0 };
      current.total++;
      if (bed.status === 'occupied') current.occupied++;
      specialtyMap.set(bed.specialty, current);
    });

    // Real wait-time telemetry (wait_time_samples) only has data once
    // something actually writes to it, which nothing in this codebase does
    // yet. Use a real average per specialty when samples exist; otherwise
    // fall back to a clearly-labeled estimate rather than pretending it's
    // measured.
    const bottlenecks = await Promise.all(
      Array.from(specialtyMap.entries())
        .filter(([_, stats]) => stats.total > 0 && stats.occupied / stats.total > 0.8) // >80% occupancy
        .map(async ([specialty, stats]) => {
          const samples = await this.waitTimeRepository
            .createQueryBuilder('w')
            .select('AVG(w.wait_time_minutes)', 'avg')
            .where('w.appointment_type = :specialty', { specialty })
            .getRawOne();
          const avgWaitTime = samples?.avg ? Math.round(Number(samples.avg)) : 45; // fallback estimate — no samples recorded yet

          return {
            specialty,
            waitCount: Math.round(stats.total * 0.2), // estimate — no queue-length telemetry exists
            avgWaitTime,
          };
        })
    );

    return {
      totalBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      avgAllocationTime: 3.5, // estimate — no allocation-time telemetry exists yet
      bottlenecks,
    };
  }

  // ==========================================================================
  // Direct bed management (hospital dashboard) — plain CRUD against the real
  // table, independent of the matching algorithm above.
  // ==========================================================================

  async getAllBedsRaw(filters: { hospitalId?: number; specialty?: string; status?: string; type?: string }): Promise<BedEntity[]> {
    const where: any = {};
    if (filters.hospitalId) where.hospitalId = filters.hospitalId;
    if (filters.specialty) where.specialty = filters.specialty;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    return this.bedRepository.find({
      where,
      relations: ['currentPatient', 'currentPatient.user'],
      order: { hospitalId: 'ASC', bedNumber: 'ASC' },
    });
  }

  async getBedRawById(id: number): Promise<BedEntity | null> {
    return this.bedRepository.findOne({ where: { id }, relations: ['currentPatient', 'currentPatient.user'] });
  }

  async createBed(data: Partial<BedEntity>): Promise<BedEntity> {
    if (!data.hospitalId || !data.bedNumber) {
      throw new Error('hospitalId and bedNumber are required');
    }
    const bed = this.bedRepository.create({
      status: 'available',
      ...data,
    });
    return this.bedRepository.save(bed);
  }

  async updateBed(id: number, data: Partial<BedEntity>): Promise<BedEntity> {
    const bed = await this.bedRepository.findOne({ where: { id } });
    if (!bed) throw new Error('Bed not found');
    Object.assign(bed, data);
    return this.bedRepository.save(bed);
  }

  async deleteBed(id: number): Promise<void> {
    const result = await this.bedRepository.delete(id);
    if (!result.affected) throw new Error('Bed not found');
  }
}
