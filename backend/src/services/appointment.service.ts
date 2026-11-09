import { AppDataSource } from '../config/database.config';
import { Appointment } from '../entities/Appointment.entity';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Hospital } from '../entities/Hospital.entity';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CreateAppointmentDto, AppointmentWithDetails, TimeSlot, AppointmentType, ACTIVE_APPOINTMENT_STATUSES } from '../types/appointment.types';
import { Between, In, QueryFailedError } from 'typeorm';

// If you use alertService you must import its type and inject/define it properly; here we add it as optional on the class.
export class AppointmentService {
  private appointmentRepository = AppDataSource.getRepository(Appointment);
  private patientRepository = AppDataSource.getRepository(Patient);
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private hospitalRepository = AppDataSource.getRepository(Hospital);
  private notificationService: NotificationService;
  private socketService: SocketService;
  private calendarService: GoogleCalendarService;
  private alertService?: any; // Set correct type if available

  constructor(socketService: SocketService, notificationService: NotificationService, alertService?: any) {
    this.socketService = socketService;
    this.notificationService = notificationService;
    this.calendarService = new GoogleCalendarService();
    if (alertService) {
      this.alertService = alertService;
    }
  }

  /**
   * Get available time slots for a doctor on a given date
   */
  async getAvailableSlots(doctorId: number, date: Date | string): Promise<TimeSlot[]> {
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) throw new Error('Doctor not found');

    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const availableDays = doctor.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (!availableDays.includes(dayName)) {
      return [];
    }

    let startHour = 9;
    let endHour = 17;
    if (doctor.availableHours) {
      const parts = doctor.availableHours.split('-');
      if (parts.length === 2) {
        const parseTime = (timeStr: string) => {
          const match = timeStr.trim().match(/(\d+)(?::\d+)?\s*(AM|PM)?/i);
          if (!match) return null;
          let hour = parseInt(match[1], 10);
          const ampm = match[2]?.toUpperCase();
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
          return hour;
        };
        startHour = parseTime(parts[0]) ?? 9;
        endHour = parseTime(parts[1]) ?? 17;
      }
    }

    const slotDuration = doctor.consultationDuration || 30;

    const startOfDay = new Date(date);
    startOfDay.setHours(startHour, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(endHour, 0, 0, 0);

    const existingAppointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        scheduledTime: Between(startOfDay, endOfDay),
        status: In(ACTIVE_APPOINTMENT_STATUSES),
      }
    });

    const slots: TimeSlot[] = [];
    let currentSlot = new Date(startOfDay);

    while (currentSlot < endOfDay) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      if (slotEnd > endOfDay) break;

      const isBooked = existingAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledTime);
        const aptEnd = new Date(aptStart);
        aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
        
        return (currentSlot >= aptStart && currentSlot < aptEnd) ||
               (slotEnd > aptStart && slotEnd <= aptEnd);
      });

      slots.push({
        startTime: new Date(currentSlot),
        endTime: new Date(slotEnd),
        available: !isBooked,
        doctorId
      });

      currentSlot = new Date(slotEnd);
    }

    return slots;
  }

  /**
   * Create a new appointment, validate entities, check for availability,
   * generate meeting link if online, trigger alerts, send notifications,
   * and emit real-time event.
   */
  async createAppointment(data: CreateAppointmentDto): Promise<AppointmentWithDetails> {
    // Validate patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: data.patientId },
      relations: ['user']
    });
    if (!patient) throw new Error('Patient not found');

    // Validate doctor exists
    const doctor = await this.doctorRepository.findOne({
      where: { id: data.doctorId }
    });
    if (!doctor) throw new Error('Doctor not found');

    // Use provided hospitalId, doctor's hospitalId, or first available hospital
    let hospitalId = data.hospitalId || doctor.hospitalId;
    if (!hospitalId) {
      // TypeORM version in this repo doesn't support `findOne({ take })`
      const [firstHospital] = await this.hospitalRepository.find({
        order: { id: 'ASC' as any },
        take: 1,
      });
      if (!firstHospital) throw new Error('No hospital available for appointments');
      hospitalId = firstHospital.id;
    }

    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId }
    });
    if (!hospital) throw new Error('Hospital not found');

    // Check if slot is available
    const slots = await this.getAvailableSlots(data.doctorId, data.scheduledTime);
    const requestedSlot = slots.find(s =>
      s.startTime.getTime() === new Date(data.scheduledTime).getTime() && s.available
    );
    if (!requestedSlot) {
      throw new Error('Selected time slot is not available');
    }

    // Calculate end time
    const duration = data.duration || doctor.consultationDuration || 30;
    const endTime = new Date(data.scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Booking only *requests* the slot — the doctor must confirm before it's
    // final. The Google Meet link is generated on confirmation (see
    // updateAppointmentStatus), not here, so we never hand a patient a
    // meeting link for a visit the doctor hasn't actually accepted yet.
    const appointment = this.appointmentRepository.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: hospitalId,
      appointmentType: data.appointmentType,
      scheduledTime: data.scheduledTime,
      endTime,
      duration,
      symptoms: data.symptoms || [],
      notes: data.notes,
      status: 'pending_confirmation',
      meetingLink: null,
    });

    try {
      await this.appointmentRepository.save(appointment);
    } catch (err: unknown) {
      // Postgres error code 23505 = unique_violation. Two requests can both
      // pass the getAvailableSlots check above before either INSERT lands;
      // the partial unique index on (doctorId, scheduledTime) is the actual
      // guard, and this is where a losing request finds out.
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        throw new Error('This time slot was just booked by someone else — please pick another time.');
      }
      throw err;
    }

    // Prepare response with details
    const appointmentWithDetails: AppointmentWithDetails = {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      hospitalId: appointment.hospitalId,
      appointmentType: appointment.appointmentType as AppointmentType,
      status: appointment.status as any,
      scheduledTime: appointment.scheduledTime,
      endTime: appointment.endTime,
      actualTime: appointment.actualTime,
      duration: appointment.duration,
      symptoms: appointment.symptoms || undefined,
      priority: appointment.priority || undefined,
      notes: appointment.notes || undefined,
      cancellationReason: appointment.cancellationReason || undefined,
      meetingLink: appointment.meetingLink,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      patientName: patient.user?.name || 'Patient',
      patientPhone: patient.user?.phone || '',
      patientEmail: patient.user?.email,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorEmail: doctor.email,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address || ''
    };

    // 🔔 TRIGGER ALERTS - NEW APPOINTMENT
    if (this.alertService && typeof this.alertService.sendAppointmentAlert === "function") {
      await this.alertService.sendAppointmentAlert(
        data.patientId,
        appointmentWithDetails.patientName,
        data.doctorId,
        doctor.name,
        doctor.specialty,
        data.scheduledTime
      );
      // Emergency alert condition (if emergency symptoms)
      if (data.symptoms && data.symptoms.length > 0) {
        const emergencyKeywords = ['chest pain', 'heart', 'stroke', 'bleeding', 'unconscious', 'severe'];
        const hasEmergency = data.symptoms.some(s =>
          emergencyKeywords.some(keyword => s.toLowerCase().includes(keyword))
        );
        if (hasEmergency && typeof this.alertService.sendEmergencyAlert === "function") {
          await this.alertService.sendEmergencyAlert(
            data.patientId,
            appointmentWithDetails.patientName,
            1, // Example code for emergency priority/level
            data.symptoms,
            doctor.specialty,
            data.scheduledTime
          );
        }
      }
    }

    // Send notifications
    if (typeof this.sendAppointmentNotifications === "function") {
      await this.sendAppointmentNotifications(appointmentWithDetails);
    }

    // Emit real-time event
    if (this.socketService && typeof this.socketService.broadcastPatientTransition === "function") {
      this.socketService.broadcastPatientTransition({
        patientId: data.patientId.toString(),
        patientName: appointmentWithDetails.patientName,
        fromStatus: 'none',
        toStatus: 'appointment-requested',
        priority: data.symptoms?.length ? 3 : 5,
        timestamp: new Date()
      });
    }

    return appointmentWithDetails;
  }

  // Fired right after a patient submits a booking request — nothing is
  // confirmed yet, so the copy here must not claim otherwise. The doctor
  // gets the actionable notification; the patient gets a "we'll let you
  // know" one. Compare to the confirmation-time messaging sent from
  // updateAppointmentStatus once the doctor actually accepts.
  private async sendAppointmentNotifications(appointment: AppointmentWithDetails) {
    const appointmentTime = new Date(appointment.scheduledTime).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const patientMessage = `Your appointment request with ${appointment.doctorName} for ${appointmentTime} has been sent. You'll get a confirmation as soon as the doctor accepts.`;

    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'sms',
      'medium',
      'Appointment Request Sent',
      patientMessage
    );

    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'email',
      'medium',
      `Appointment Request Sent to ${appointment.doctorName}`,
      patientMessage
    );

    await this.notificationService.sendNotification(
      appointment.doctorId.toString(),
      'doctor',
      'inapp',
      'high',
      'New Appointment Request',
      `${appointment.patientName} requested a ${appointment.appointmentType} appointment for ${appointmentTime}. Please confirm or decline.`
    );
  }

  async getPatientAppointments(patientId: number): Promise<AppointmentWithDetails[]> {
    const appointments = await this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor', 'hospital'],
      order: { scheduledTime: 'DESC' }
    });

    const result = await Promise.all(appointments.map(async apt => {
      const patient = await this.patientRepository.findOne({
        where: { id: patientId },
        relations: ['user']
      });

      return {
        id: apt.id,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        hospitalId: apt.hospitalId,
        appointmentType: apt.appointmentType as AppointmentType,
        status: apt.status as any,
        scheduledTime: apt.scheduledTime,
        endTime: apt.endTime,
        actualTime: apt.actualTime,
        duration: apt.duration,
        symptoms: apt.symptoms || undefined,
        priority: apt.priority || undefined,
        notes: apt.notes || undefined,
        cancellationReason: apt.cancellationReason || undefined,
        meetingLink: apt.meetingLink,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
        patientName: patient?.user?.name || 'Patient',
        patientPhone: patient?.user?.phone || '',
        patientEmail: patient?.user?.email,
        doctorName: apt.doctor?.name || '',
        doctorSpecialty: apt.doctor?.specialty || '',
        doctorEmail: apt.doctor?.email || '',
        hospitalName: apt.hospital?.name || '',
        hospitalAddress: apt.hospital?.address || ''
      };
    }));

    return result;
  }

  async getDoctorAppointments(doctorId: number, date?: Date): Promise<AppointmentWithDetails[]> {
    const whereClause: any = { doctorId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.scheduledTime = Between(startOfDay, endOfDay);
    }

    const appointments = await this.appointmentRepository.find({
      where: whereClause,
      relations: ['patient', 'patient.user', 'hospital'],
      order: { scheduledTime: 'ASC' }
    });

    return appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      hospitalId: apt.hospitalId,
      appointmentType: apt.appointmentType as AppointmentType,
      status: apt.status as any,
      scheduledTime: apt.scheduledTime,
      endTime: apt.endTime,
      actualTime: apt.actualTime,
      duration: apt.duration,
      symptoms: apt.symptoms || undefined,
      priority: apt.priority || undefined,
      notes: apt.notes || undefined,
      cancellationReason: apt.cancellationReason || undefined,
      meetingLink: apt.meetingLink,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      patientName: apt.patient?.user?.name || 'Patient',
      patientPhone: apt.patient?.user?.phone || '',
      patientEmail: apt.patient?.user?.email,
      doctorName: apt.doctor?.name || '',
      doctorSpecialty: apt.doctor?.specialty || '',
      doctorEmail: apt.doctor?.email || '',
      hospitalName: apt.hospital?.name || '',
      hospitalAddress: apt.hospital?.address || ''
    }));
  }

  async updateAppointmentStatus(id: number, status: string, reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'doctor']
    });

    if (!appointment) throw new Error('Appointment not found');

    const wasPending = appointment.status === 'pending_confirmation';

    appointment.status = status;
    if (reason) appointment.cancellationReason = reason;
    if (status === 'completed') appointment.actualTime = new Date();

    // Doctor just confirmed a pending request: this is when we actually
    // generate the Google Calendar event, not at booking time —
    // a patient should never hold a meeting link for a visit that wasn't
    // accepted yet.
    if (status === 'confirmed' && !appointment.meetingLink) {
      const endTime = appointment.endTime || new Date(new Date(appointment.scheduledTime).getTime() + (appointment.duration || 30) * 60000);
      const meetResult = await this.calendarService.createMeetingEvent(
        appointment.patient?.user?.name || 'Patient',
        appointment.doctor?.name || 'Doctor',
        appointment.scheduledTime,
        endTime,
        appointment.patient?.user?.email,
        appointment.doctor?.email,
        appointment.doctor?.googleRefreshToken,
        appointment.appointmentType === 'online' // Only add Meet link if online
      );
      if (meetResult.success && meetResult.meetLink) {
        appointment.meetingLink = meetResult.meetLink;
      }
    }

    await this.appointmentRepository.save(appointment);

    const appointmentTime = new Date(appointment.scheduledTime).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    let title: string;
    let message: string;

    if (status === 'confirmed') {
      title = 'Appointment Confirmed';
      message = `Your appointment with ${appointment.doctor?.name || ''} on ${appointmentTime} has been confirmed.`;
      if (appointment.meetingLink) {
        message += `\n\n📹 Video Consultation Link: ${appointment.meetingLink}\n\nThis link will be active at the scheduled time.`;
      } else if (appointment.appointmentType === 'online') {
        message += `\n\nYour doctor hasn't connected Google Calendar yet, so a video link couldn't be generated automatically — the clinic will follow up with details.`;
      }
    } else if (status === 'cancelled') {
      title = wasPending ? 'Appointment Request Declined' : 'Appointment Cancelled';
      message = wasPending
        ? `${appointment.doctor?.name || ''} was unable to accept your request for ${appointmentTime}${reason ? `: ${reason}` : '.'} Please choose another time.`
        : `Your appointment has been cancelled${reason ? ': ' + reason : '.'}`;
    } else {
      title = `Appointment ${status}`;
      message = `Your appointment status has been updated to ${status}`;
    }

    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'sms',
      status === 'confirmed' ? 'high' : 'medium',
      title,
      message
    );

    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'email',
      status === 'confirmed' ? 'high' : 'medium',
      title,
      message
    );

    // Let the patient's open tab react live instead of waiting for a refresh.
    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'inapp',
      status === 'confirmed' ? 'high' : 'medium',
      title,
      message
    );

    this.socketService.broadcastPatientTransition({
      patientId: appointment.patientId.toString(),
      patientName: appointment.patient?.user?.name || 'Patient',
      fromStatus: wasPending ? 'appointment-requested' : 'appointment-booked',
      toStatus: `appointment-${status}`,
      timestamp: new Date()
    });

    // Never let a password hash leave this service — `patient.user` is only
    // loaded here to read name/email/phone.
    if (appointment.patient?.user) {
      delete (appointment.patient.user as any).password;
    }

    return appointment;
  }

  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.appointmentRepository.find({
      where: {
        scheduledTime: Between(now, tomorrow),
        status: In(ACTIVE_APPOINTMENT_STATUSES),
      },
      relations: ['patient', 'patient.user', 'doctor', 'hospital'],
      order: { scheduledTime: 'ASC' }
    });

    return appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      hospitalId: apt.hospitalId,
      appointmentType: apt.appointmentType as AppointmentType,
      status: apt.status as any,
      scheduledTime: apt.scheduledTime,
      endTime: apt.endTime,
      actualTime: apt.actualTime,
      duration: apt.duration,
      symptoms: apt.symptoms || undefined,
      priority: apt.priority || undefined,
      notes: apt.notes || undefined,
      cancellationReason: apt.cancellationReason || undefined,
      meetingLink: apt.meetingLink,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      patientName: apt.patient?.user?.name || 'Patient',
      patientPhone: apt.patient?.user?.phone || '',
      patientEmail: apt.patient?.user?.email,
      doctorName: apt.doctor?.name || '',
      doctorSpecialty: apt.doctor?.specialty || '',
      doctorEmail: apt.doctor?.email || '',
      hospitalName: apt.hospital?.name || '',
      hospitalAddress: apt.hospital?.address || ''
    }));
  }

  async getRefreshToken() {
    const authUrl = this.calendarService.getAuthUrl('manual-setup');
    console.log('Visit this URL to authorize:', authUrl);
    console.log('After authorization, you\'ll get a code. Use it to get refresh token.');
    return { authUrl };
  }

  async generateMeetingLink(id: number): Promise<string> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'patient.user', 'doctor']
    });

    if (!appointment) throw new Error('Appointment not found');

    if (appointment.appointmentType !== 'online') {
      throw new Error('Meeting links are only available for online appointments');
    }

    if (appointment.meetingLink) {
      return appointment.meetingLink;
    }

    const endTime = new Date(appointment.scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + (appointment.duration || 30));

    const patientEmail = appointment.patient?.user?.email;
    const doctorEmail = appointment.doctor?.email;

    const meetResult = await this.calendarService.createMeetingEvent(
      appointment.patient?.user?.name || 'Patient',
      appointment.doctor?.name || 'Doctor',
      appointment.scheduledTime,
      endTime,
      patientEmail,
      doctorEmail,
      appointment.doctor?.googleRefreshToken
    );

    if (!meetResult.success) {
      throw new Error(meetResult.error || 'Failed to create meeting link');
    }

    appointment.meetingLink = meetResult.meetLink;
    await this.appointmentRepository.save(appointment);

    await this.notificationService.sendNotification(
      appointment.patientId.toString(),
      'patient',
      'sms',
      'high',
      'Meeting Link Generated',
      `Your video consultation link: ${meetResult.meetLink}`
    );

    return meetResult.meetLink;
  }
}