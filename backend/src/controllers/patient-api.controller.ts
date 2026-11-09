import { Request, Response } from 'express';
import { PatientAPIService } from '../services/patient-api.service';

const patientService = new PatientAPIService();

export class PatientAPIController {
  async createPatient(req: Request, res: Response) {
    try {
      const patientData = req.body;
      
      if (!patientData.firstName || !patientData.lastName || !patientData.dateOfBirth || !patientData.gender || !patientData.hospitalId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const patient = await patientService.createPatient(patientData);
      return res.status(201).json({ success: true, data: patient });
    } catch (error) {
      console.error('Create patient error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async getPatients(req: Request, res: Response) {
    try {
      const options = {
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await patientService.getPatients(options);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get patients error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async getPatientById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patient = await patientService.getPatientById(id);

      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }

      return res.json({ success: true, data: patient });
    } catch (error) {
      console.error('Get patient error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async updatePatient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const patient = await patientService.updatePatient(id, updates);

      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }

      return res.json({ success: true, data: patient });
    } catch (error) {
      console.error('Update patient error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async searchPatients(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ success: false, error: 'Search query required' });
      }

      const patients = await patientService.searchPatients(q);
      return res.json({ success: true, data: patients });
    } catch (error) {
      console.error('Search patients error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async getPatientStats(req: Request, res: Response) {
    try {
      const stats = await patientService.getPatientStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get patient stats error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async getPatientJourney(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const journey = await patientService.getPatientJourney(id);

      if (!journey) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }

      return res.json({ success: true, data: journey });
    } catch (error) {
      console.error('Get journey error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async transitionPatient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { toStatus, actorId } = req.body;

      if (!toStatus || !actorId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const patient = await patientService.transitionPatientStatus(id, toStatus, actorId);
      return res.json({ success: true, data: patient });
    } catch (error: any) {
      console.error('Transition error:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async getWaitingPatients(req: Request, res: Response) {
    try {
      const { resource } = req.params;
      const patients = await patientService.getWaitingPatients(resource as any);
      return res.json({ success: true, data: patients });
    } catch (error) {
      console.error('Get waiting patients error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
