import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { SocketService } from '../services/socket.service';
import { NotificationService } from '../services/notification.service';
import { AppDataSource } from '../config/database.config';
import { Patient } from '../entities/Patient.entity';
import { Hospital } from '../entities/Hospital.entity';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor(socketService: SocketService, notificationService: NotificationService) {
    this.appointmentService = new AppointmentService(socketService, notificationService);
  }

  /**
   * GET /api/appointments/slots?doctorId=1&date=2024-01-01
   * Get available time slots for a doctor
   */
  async getAvailableSlots(req: Request, res: Response) {
    try {
      const doctorId = parseInt(req.query.doctorId as string);
      const date = new Date(req.query.date as string);

      if (isNaN(doctorId) || isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Valid doctorId and date are required'
        });
      }

      const slots = await this.appointmentService.getAvailableSlots(doctorId, date);
      
      return res.json({
        success: true,
        data: slots
      });
    } catch (error: any) {
      console.error('Get slots error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * POST /api/appointments
   * Create a new appointment
   */
  async createAppointment(req: Request, res: Response) {
    try {
      const appointment = await this.appointmentService.createAppointment(req.body);
      
      return res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      console.error('Create appointment error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to create appointment'
      });
    }
  }

  /**
   * GET /api/appointments/patient/:patientId
   * Get all appointments for a patient
   */
  async getPatientAppointments(req: Request, res: Response) {
    try {
      const patientId = parseInt(req.params.patientId);
      
      if (isNaN(patientId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid patient ID is required'
        });
      }

      const appointments = await this.appointmentService.getPatientAppointments(patientId);
      
      return res.json({
        success: true,
        data: appointments
      });
    } catch (error: any) {
      console.error('Get patient appointments error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * GET /api/appointments/doctor/:doctorId
   * Get all appointments for a doctor
   */
  async getDoctorAppointments(req: Request, res: Response) {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      if (isNaN(doctorId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid doctor ID is required'
        });
      }

      const appointments = await this.appointmentService.getDoctorAppointments(doctorId, date);
      
      return res.json({
        success: true,
        data: appointments
      });
    } catch (error: any) {
      console.error('Get doctor appointments error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  /**
   * PATCH /api/appointments/:id/status
   * Update appointment status
   */
  async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status, reason } = req.body;

      if (isNaN(id) || !status) {
        return res.status(400).json({
          success: false,
          error: 'Valid appointment ID and status are required'
        });
      }

      const appointment = await this.appointmentService.updateAppointmentStatus(id, status, reason);
      
      return res.json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to update appointment'
      });
    }
  }

  /**
   * POST /api/appointments/:id/meeting
   * Generate meeting link for online consultation
   */
  async generateMeetingLink(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Valid appointment ID is required'
        });
      }

      const meetingLink = await this.appointmentService.generateMeetingLink(id);
      
      return res.json({
        success: true,
        data: { meetingLink }
      });
    } catch (error: any) {
      console.error('Generate meeting link error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate meeting link'
      });
    }
  }

  /**
   * GET /api/appointments/patient-for-user/:userId
   * Get patient ID for a user (for booking flow)
   */
  async getPatientForUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Valid user ID required' });
      }

      const patientRepo = AppDataSource.getRepository(Patient);
      const patient = await patientRepo.findOne({ where: { userId } });
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'No patient profile found. Please complete your profile first.'
        });
      }

      return res.json({ success: true, data: { patientId: patient.id } });
    } catch (error: any) {
      console.error('Get patient for user error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/appointments/patient-profile/:patientId
   * Real medical profile data (allergies, conditions, medications, etc.) —
   * distinct from the separate mock ER/triage "patient state" system.
   */
  async getPatientProfile(req: Request, res: Response) {
    try {
      const patientId = parseInt(req.params.patientId);
      if (isNaN(patientId)) {
        return res.status(400).json({ success: false, error: 'Valid patient ID required' });
      }

      const patientRepo = AppDataSource.getRepository(Patient);
      const patient = await patientRepo.findOne({ where: { id: patientId }, relations: ['user'] });
      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }

      return res.json({
        success: true,
        data: {
          name: patient.user?.name,
          email: patient.user?.email,
          phone: patient.user?.phone,
          dateOfBirth: patient.dateOfBirth,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies || [],
          chronicConditions: patient.chronicConditions || [],
          currentMedications: patient.currentMedications || [],
          emergencyContact: patient.emergencyContact,
        },
      });
    } catch (error: any) {
      console.error('Get patient profile error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/appointments/default-hospital
   * Get first available hospital (for when doctor has no hospitalId)
   */
  async getDefaultHospital(req: Request, res: Response) {
    try {
      const hospitalRepo = AppDataSource.getRepository(Hospital);
      // TypeORM version in this repo doesn't support `findOne({ take })`
      const [hospital] = await hospitalRepo.find({
        order: { id: 'ASC' as any },
        take: 1,
      });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'No hospital found' });
      }
      return res.json({ success: true, data: { id: hospital.id } });
    } catch (error: any) {
      console.error('Get default hospital error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/appointments/upcoming
   * Get upcoming appointments (next 24 hours)
   */
  async getUpcomingAppointments(req: Request, res: Response) {
    try {
      const appointments = await this.appointmentService.getUpcomingAppointments();
      
      return res.json({
        success: true,
        data: appointments
      });
    } catch (error: any) {
      console.error('Get upcoming appointments error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
}
