import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Hospital } from '../entities/Hospital.entity';

// Admin-facing endpoints for a hospital managing its *own* profile — real
// bed/OT/ambulance counts entered at signup, editable here. Distinct from
// hospitals.controller.ts, which serves the public "browse hospitals"
// directory (India-specific search/filter shape).
export class HospitalAdminController {
  private hospitalRepository = AppDataSource.getRepository(Hospital);

  // GET /api/hospitals/hospital-for-user/:userId
  async getHospitalForUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Valid user ID required' });
      }

      const hospital = await this.hospitalRepository.findOne({ where: { userId } });
      if (!hospital) {
        return res.status(404).json({
          success: false,
          error: 'No hospital profile linked to this account yet.'
        });
      }

      return res.json({ success: true, data: { hospitalId: hospital.id } });
    } catch (error: any) {
      console.error('Get hospital for user error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/hospitals/:id — full raw profile (own dashboard use)
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid hospital ID required' });
      }
      const hospital = await this.hospitalRepository.findOne({ where: { id } });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Hospital not found' });
      }
      return res.json({ success: true, data: hospital });
    } catch (error: any) {
      console.error('Get hospital error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // PATCH /api/hospitals/:id — update own profile (beds, OT, ambulances, etc.)
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid hospital ID required' });
      }
      const hospital = await this.hospitalRepository.findOne({ where: { id } });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Hospital not found' });
      }

      // Only allow updating real operational fields from this endpoint —
      // not id/userId, which would let a hospital reassign ownership.
      const allowed = [
        'name', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'type',
        'totalBeds', 'icuBeds', 'operationTheatres', 'ambulancesTotal', 'ambulancesAvailable',
        'emergencyContact', 'specialties',
      ] as const;
      for (const key of allowed) {
        if (key in req.body) (hospital as any)[key] = req.body[key];
      }

      await this.hospitalRepository.save(hospital);
      return res.json({ success: true, data: hospital });
    } catch (error: any) {
      console.error('Update hospital error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to update hospital' });
    }
  }
}
