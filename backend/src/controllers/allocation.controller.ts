/**
 * Allocation Controller
 * Exposes bed allocation endpoints
 */

import { Request, Response } from 'express';
import { BedAllocationService } from '../services/bed-allocation.service';

const allocationService = new BedAllocationService();

export class AllocationController {
  /**
   * POST /api/allocation/find-bed
   * Find best bed for patient
   */
  async findBed(req: Request, res: Response) {
    try {
      const requirements = req.body;
      
      // Validate required fields
      if (!requirements.patientId || !requirements.specialty || !requirements.priority) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, specialty, priority',
        });
      }

      const result = await allocationService.findBestBed(requirements);
      
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Find bed error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/allocation/reserve
   * Reserve a bed for patient
   */
  async reserveBed(req: Request, res: Response) {
    try {
      const { bedId, patientId, doctorId, duration } = req.body;

      if (!bedId || !patientId || !doctorId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: bedId, patientId, doctorId',
        });
      }

      const reservation = await allocationService.reserveBed(bedId, patientId, doctorId, duration);

      return res.json({
        success: true,
        data: reservation,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/allocation/release
   * Release a bed reservation
   */
  async releaseBed(req: Request, res: Response) {
    try {
      const { bedId } = req.body;

      if (!bedId) {
        return res.status(400).json({
          success: false,
          error: 'Missing bedId',
        });
      }

      await allocationService.releaseReservation(bedId);

      return res.json({
        success: true,
        message: 'Bed released successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/allocation/occupy
   * Occupy a bed (patient arrives)
   */
  async occupyBed(req: Request, res: Response) {
    try {
      const { bedId, patientId } = req.body;

      if (!bedId || !patientId) {
        return res.status(400).json({
          success: false,
          error: 'Missing bedId or patientId',
        });
      }

      await allocationService.occupyBed(bedId, patientId);

      return res.json({
        success: true,
        message: 'Bed occupied successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/allocation/clean/start
   * Start cleaning a bed
   */
  async startCleaning(req: Request, res: Response) {
    try {
      const { bedId } = req.body;

      if (!bedId) {
        return res.status(400).json({
          success: false,
          error: 'Missing bedId',
        });
      }

      await allocationService.startCleaning(bedId);

      return res.json({
        success: true,
        message: 'Cleaning started',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/allocation/clean/complete
   * Complete cleaning
   */
  async completeCleaning(req: Request, res: Response) {
    try {
      const { bedId } = req.body;

      if (!bedId) {
        return res.status(400).json({
          success: false,
          error: 'Missing bedId',
        });
      }

      await allocationService.completeCleaning(bedId);

      return res.json({
        success: true,
        message: 'Cleaning completed',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/allocation/metrics
   * Get allocation metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await allocationService.getMetrics();

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Metrics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}