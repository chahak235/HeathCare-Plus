/**
 * Patient State Controller
 * Exposes patient lifecycle endpoints
 */

import { Request, Response } from 'express';
import { PatientStateService } from '../services/patient-state.service';

const stateService = new PatientStateService();

export class PatientStateController {
  /**
   * GET /api/patients/:id
   * Get patient by ID
   */
  async getPatient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patient = await stateService.getPatient(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found',
        });
      }

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error('Get patient error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/patients
   * Get all patients (optional status filter)
   */
  async getPatients(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const patients = await stateService.getPatients(status as any);

      return res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error('Get patients error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/patients/:id/transition
   * Transition patient to new status
   */
  async transitionPatient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { toStatus, actorId, actorType, reason, metadata } = req.body;

      if (!toStatus || !actorId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: toStatus, actorId',
        });
      }

      const patient = await stateService.transitionPatient(
        id,
        toStatus,
        actorId,
        actorType,
        reason,
        metadata
      );

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/patients/:id/journey
   * Get patient journey timeline
   */
  async getPatientJourney(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const journey = await stateService.getPatientJourney(id);

      if (!journey) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found',
        });
      }

      return res.json({
        success: true,
        data: journey,
      });
    } catch (error) {
      console.error('Get journey error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/patients/waiting/:resource
   * Get patients waiting for specific resource
   */
  async getWaitingPatients(req: Request, res: Response) {
    try {
      const { resource } = req.params;
      
      if (!['bed', 'doctor', 'triage'].includes(resource)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid resource. Must be bed, doctor, or triage',
        });
      }

      const patients = await stateService.getWaitingPatients(resource as any);

      return res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error('Get waiting patients error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/patients/:id/discharge-summary
   * Generate discharge summary
   */
  async generateDischargeSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!doctorId) {
        return res.status(400).json({
          success: false,
          error: 'Missing doctorId',
        });
      }

      const summary = await stateService.generateDischargeSummary(id, doctorId);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/patients/metrics
   * Get patient metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await stateService.getMetrics();

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/patients/:id/transitions
   * Get transition history
   */
  async getTransitionHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const transitions = await stateService.getTransitionHistory(id);

      return res.json({
        success: true,
        data: transitions,
      });
    } catch (error) {
      console.error('Get transitions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}