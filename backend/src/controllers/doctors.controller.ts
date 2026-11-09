import { Request, Response } from 'express';
import { In, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Doctor } from '../entities/Doctor.entity';
import { Hospital } from '../entities/Hospital.entity';

export class DoctorsController {
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private hospitalRepository = AppDataSource.getRepository(Hospital);

  // PATCH /api/doctors/:id/availability
  async updateAvailability(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { isAcceptingPatients, availableDays, availableHours, consultationDuration } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Valid doctor id required' });
      }
      const doctor = await this.doctorRepository.findOne({ where: { id } });
      if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
      }
      
      if (typeof isAcceptingPatients === 'boolean') {
        doctor.isAcceptingPatients = isAcceptingPatients;
      }
      if (Array.isArray(availableDays)) {
        doctor.availableDays = availableDays;
      }
      if (typeof availableHours === 'string') {
        doctor.availableHours = availableHours;
      }
      if (typeof consultationDuration === 'number') {
        doctor.consultationDuration = consultationDuration;
      }

      await this.doctorRepository.save(doctor);
      return res.json({ success: true, data: { 
        isAcceptingPatients: doctor.isAcceptingPatients,
        availableDays: doctor.availableDays,
        availableHours: doctor.availableHours,
        consultationDuration: doctor.consultationDuration
      } });
    } catch (error: any) {
      console.error('Update doctor availability error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/doctors/unclaimed
  // Doctor profiles with no login account linked yet — used by the signup
  // form so a real person can pick "I am Dr. X" instead of a fragile
  // exact-email match that silently creates an orphaned duplicate on typo.
  async getUnclaimedDoctors(req: Request, res: Response) {
    try {
      const unclaimed = await this.doctorRepository.find({ where: { userId: IsNull() } });
      const enriched = await this.withHospitalInfo(unclaimed);
      return res.json({ success: true, data: enriched });
    } catch (error: any) {
      console.error('Get unclaimed doctors error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/doctors/doctor-for-user/:userId
  // Resolves the Doctor profile linked to a logged-in user, the same way
  // /appointments/patient-for-user/:userId resolves a Patient profile.
  async getDoctorForUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Valid user ID required' });
      }

      const doctor = await this.doctorRepository.findOne({ where: { userId } });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'No doctor profile linked to this account yet.'
        });
      }

      return res.json({ success: true, data: { doctorId: doctor.id } });
    } catch (error: any) {
      console.error('Get doctor for user error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // Attach real hospital name/city/state to each doctor instead of leaving the
  // frontend to fall back to hardcoded placeholder hospital data.
  private async withHospitalInfo(doctors: Doctor[]) {
    const hospitalIds = [...new Set(doctors.map((d) => d.hospitalId).filter(Boolean))] as number[];
    const hospitals = hospitalIds.length
      ? await this.hospitalRepository.findBy({ id: In(hospitalIds) })
      : [];
    const hospitalById = new Map(hospitals.map((h) => [h.id, h]));

    return doctors.map((doc) => {
      const hospital = doc.hospitalId ? hospitalById.get(doc.hospitalId) : undefined;
      // Never send the raw Google OAuth refresh token to any client — this
      // spread previously leaked it verbatim on every public, unauthenticated
      // doctor lookup. Only whether a calendar is connected is ever needed
      // client-side.
      const { googleRefreshToken, ...safeDoc } = doc as any;
      return {
        ...safeDoc,
        googleCalendarConnected: !!googleRefreshToken,
        hospital_name: hospital?.name || null,
        hospital_city: hospital?.city || null,
        hospital_state: hospital?.state || null,
        hospital_address: hospital?.address || null,
        // Real coordinates, so the frontend can compute a real distance to
        // THIS doctor's actual hospital instead of a hardcoded reference
        // point (see patient/Portal.tsx — it was measuring distance to a
        // fixed Mumbai coordinate for every doctor regardless of where
        // they actually are).
        hospital_latitude: hospital?.latitude != null ? Number(hospital.latitude) : null,
        hospital_longitude: hospital?.longitude != null ? Number(hospital.longitude) : null,
      };
    });
  }

  async getAllDoctors(req: Request, res: Response) {
    try {
      console.log('📊 Fetching all doctors from database...');

      const { specialty, city, hospitalId } = req.query;
      let doctors = hospitalId
        ? await this.doctorRepository.find({ where: { hospitalId: parseInt(hospitalId as string) } })
        : await this.doctorRepository.find();

      if (specialty && typeof specialty === 'string') {
        doctors = doctors.filter((d) => d.specialty === specialty);
      }

      let enriched = await this.withHospitalInfo(doctors);

      if (city && typeof city === 'string') {
        enriched = enriched.filter(
          (d) => d.hospital_city && d.hospital_city.toLowerCase().includes(city.toLowerCase())
        );
      }

      console.log(`✅ Found ${enriched.length} doctors`);

      return res.json({
        success: true,
        data: {
          doctors: enriched,
          total: enriched.length,
          limit: 20,
          offset: 0
        }
      });

    } catch (error) {
      console.error('❌ Get doctors error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getDoctorById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // Check if id is a valid number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid doctor ID'
        });
      }

      const doctor = await this.doctorRepository.findOne({
        where: { id }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found'
        });
      }

      const [enriched] = await this.withHospitalInfo([doctor]);

      return res.json({
        success: true,
        data: enriched
      });
    } catch (error) {
      console.error('❌ Get doctor error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getAllSpecialties(req: Request, res: Response) {
    try {
      console.log('🔍 Fetching all specialties...');
      
      const doctors = await this.doctorRepository.find();
      
      // Extract unique specialties and filter out null/undefined
      const specialties = [...new Set(
        doctors
          .map(d => d.specialty)
          .filter(s => s && s.trim() !== '')
      )];
      
      console.log(`✅ Found ${specialties.length} unique specialties`);
      
      return res.json({ 
        success: true, 
        data: specialties 
      });
    } catch (error) {
      console.error('❌ Get specialties error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async getAvailableDoctors(req: Request, res: Response) {
    try {
      const { specialty } = req.query;
      
      let doctors = await this.doctorRepository.find();
      
      // Filter by specialty if provided
      if (specialty && typeof specialty === 'string') {
        doctors = doctors.filter(d => d.specialty === specialty);
      }
      
      // Transform to available doctors format
      const transformedDoctors = doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        isAvailable: true
      }));

      return res.json({ 
        success: true, 
        data: transformedDoctors 
      });
    } catch (error) {
      console.error('❌ Get available doctors error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}
