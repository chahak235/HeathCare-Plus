import { Request, Response } from 'express';
import { BedAllocationService } from '../services/bed-allocation.service';
import { Bed } from '../entities/Bed.entity';

const allocationService = new BedAllocationService();

// Shape a raw Bed row (+ optionally-loaded currentPatient.user relation) to
// match the frontend's Bed type (types/bed.types.ts): string ids,
// isolationRequired instead of isIsolation, ISO date strings, and a
// human-readable currentPatientName instead of just an id.
function toClientShape(b: Bed) {
  return {
    id: String(b.id),
    hospitalId: String(b.hospitalId),
    bedNumber: b.bedNumber,
    ward: b.ward,
    floor: b.floor,
    type: b.type,
    specialty: b.specialty,
    status: b.status,
    equipment: b.equipment || [],
    lastCleaned: b.lastCleaned ? new Date(b.lastCleaned).toISOString() : undefined,
    isolationRequired: b.isIsolation,
    isFemaleOnly: b.isFemaleOnly,
    isPediatric: b.isPediatric,
    tags: b.tags || undefined,
    currentPatientId: b.currentPatientId != null ? String(b.currentPatientId) : undefined,
    currentPatientName: (b as any).currentPatient?.user?.name,
    estimatedVacancy: b.estimatedVacancy ? new Date(b.estimatedVacancy).toISOString() : undefined,
    lastUpdated: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class BedsController {
  /**
   * GET /api/beds
   * Get all beds with optional filters
   */
  async getAllBeds(req: Request, res: Response) {
    try {
      const { specialty, status, type, hospitalId } = req.query;

      const beds = await allocationService.getAllBedsRaw({
        specialty: specialty as string | undefined,
        status: status as string | undefined,
        type: type as string | undefined,
        hospitalId: hospitalId ? parseInt(hospitalId as string) : undefined,
      });

      return res.json({
        success: true,
        data: beds.map(toClientShape),
      });
    } catch (error) {
      console.error('Get beds error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/beds/stats
   * Get bed statistics (optionally scoped to one hospital via ?hospitalId=)
   */
  async getBedStats(req: Request, res: Response) {
    try {
      const { hospitalId } = req.query;
      const metrics = await allocationService.getMetrics(
        hospitalId ? parseInt(hospitalId as string) : undefined
      );

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Get bed stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/beds/:id
   * Get bed by ID
   */
  async getBedById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid bed id required' });
      }

      const bed = await allocationService.getBedRawById(id);
      if (!bed) {
        return res.status(404).json({
          success: false,
          error: 'Bed not found',
        });
      }

      return res.json({
        success: true,
        data: toClientShape(bed),
      });
    } catch (error) {
      console.error('Get bed error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/beds
   * Create a new bed (hospital managing its own inventory)
   */
  async createBed(req: Request, res: Response) {
    try {
      const bed = await allocationService.createBed(req.body);
      return res.status(201).json({ success: true, data: toClientShape(bed) });
    } catch (error: any) {
      console.error('Create bed error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to create bed' });
    }
  }

  /**
   * PATCH /api/beds/:id
   * Update a bed's fields (status, ward, equipment, etc.)
   */
  async updateBed(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid bed id required' });
      }
      const bed = await allocationService.updateBed(id, req.body);
      return res.json({ success: true, data: toClientShape(bed) });
    } catch (error: any) {
      console.error('Update bed error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to update bed' });
    }
  }

  /**
   * DELETE /api/beds/:id
   */
  async deleteBed(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid bed id required' });
      }
      await allocationService.deleteBed(id);
      return res.json({ success: true, message: 'Bed deleted' });
    } catch (error: any) {
      console.error('Delete bed error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to delete bed' });
    }
  }
}
