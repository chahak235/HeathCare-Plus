import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Doctor } from '../entities/Doctor.entity';
import { Patient } from '../entities/Patient.entity';
import { Appointment } from '../entities/Appointment.entity';
import { Admission } from '../entities/Admission.entity';
import { User } from '../entities/User.entity';

export class DoctorDashboardController {
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private patientRepository = AppDataSource.getRepository(Patient);
  private appointmentRepository = AppDataSource.getRepository(Appointment);
  private admissionRepository = AppDataSource.getRepository(Admission);
  private userRepository = AppDataSource.getRepository(User);

  // Get doctor's assigned patients
  async getAssignedPatients(req: Request, res: Response) {
    try {
      const doctorId = parseInt(req.params.doctorId);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ success: false, error: 'Invalid doctor ID' });
      }

      // Get admissions assigned to this doctor
      const admissions = await this.admissionRepository
        .createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('patient.user', 'user')
        .leftJoinAndSelect('admission.bed', 'bed')
        .where('admission.doctorId = :doctorId', { doctorId })
        .andWhere('admission.status IN (:...statuses)', { 
          statuses: ['waiting', 'assigned', 'in-bed', 'under-treatment'] 
        })
        .orderBy('admission.priority', 'ASC')
        .addOrderBy('admission.createdAt', 'DESC')
        .getMany();

      const formattedPatients = admissions.map(adm => {
        const patient = adm.patient;
        const user = patient?.user;
        
        // Calculate age from dateOfBirth
        let age = 0;
        if (patient?.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Get symptoms from admitting diagnosis
        let symptoms: string[] = [];
        if (adm.admittingDiagnosis) {
          symptoms = adm.admittingDiagnosis.split(',').map(s => s.trim());
        }

        return {
          id: patient?.id?.toString() || 'unknown',
          name: user?.name || 'Unknown Patient',
          age: age,
          // Removed gender field completely
          priority: adm.priority || 3,
          symptoms: symptoms,
          status: adm.status || 'unknown',
          bedId: adm.bed?.id?.toString(),
          bedNumber: adm.bed?.bedNumber,
          ward: adm.bed?.ward,
          floor: adm.bed?.floor,
          doctorId: doctorId,
          admissionId: adm.id
        };
      });

      return res.json({ success: true, data: formattedPatients });
    } catch (error) {
      console.error('Error getting assigned patients:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get doctor's today's schedule
  async getTodaySchedule(req: Request, res: Response) {
    try {
      const doctorId = parseInt(req.params.doctorId);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ success: false, error: 'Invalid doctor ID' });
      }

      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .leftJoinAndSelect('patient.user', 'user')
        .where('appointment.doctorId = :doctorId', { doctorId })
        .andWhere('appointment.scheduledTime BETWEEN :start AND :end', {
          start: startOfDay,
          end: endOfDay
        })
        .orderBy('appointment.scheduledTime', 'ASC')
        .getMany();

      const formatted = appointments.map(apt => ({
        id: apt.id,
        patientName: apt.patient?.user?.name || 'Unknown',
        time: apt.scheduledTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: apt.appointmentType || 'in-person',
        status: apt.status || 'scheduled'
      }));

      return res.json({ success: true, data: formatted });
    } catch (error) {
      console.error('Error getting schedule:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Accept/assign patient to doctor
  async assignPatient(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { doctorId } = req.body;

      if (!patientId || !doctorId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Patient ID and Doctor ID are required' 
        });
      }

      // Find the most recent admission for this patient
      const admission = await this.admissionRepository
        .createQueryBuilder('admission')
        .where('admission.patientId = :patientId', { patientId: parseInt(patientId) })
        .andWhere('admission.status IN (:...statuses)', { 
          statuses: ['waiting', 'assigned'] 
        })
        .orderBy('admission.createdAt', 'DESC')
        .getOne();

      if (admission) {
        // Update existing admission
        admission.doctorId = parseInt(doctorId);
        admission.status = 'assigned';
        await this.admissionRepository.save(admission);
      } else {
        // Create new admission
        const newAdmission = this.admissionRepository.create({
          patientId: parseInt(patientId),
          doctorId: parseInt(doctorId),
          status: 'assigned',
          admissionType: 'emergency',
          priority: 2,
          admittedAt: new Date()
        });
        await this.admissionRepository.save(newAdmission);
      }

      return res.json({ 
        success: true, 
        message: 'Patient assigned successfully' 
      });
    } catch (error) {
      console.error('Error assigning patient:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get doctor details
  async getDoctorDetails(req: Request, res: Response) {
    try {
      const doctorId = parseInt(req.params.doctorId);
      
      const doctor = await this.doctorRepository.findOne({
        where: { id: doctorId }
      });

      if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
      }

      return res.json({ success: true, data: doctor });
    } catch (error) {
      console.error('Error getting doctor details:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
