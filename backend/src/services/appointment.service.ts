import { AppDataSource } from '../config/database.config';
import { Appointment } from '../entities/Appointment.entity';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Hospital } from '../entities/Hospital.entity';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { GoogleCalendarService } from './google-calendar.service';
import { sendAppointmentConfirmationEmails } from './appointment-email';
import { CreateAppointmentDto, AppointmentWithDetails, TimeSlot, AppointmentType, ACTIVE_APPOINTMENT_STATUSES } from '../types/appointment.types';
import { Between, In, QueryFailedError } from 'typeorm';
import {
  addDays, buildDaySlots, BookedRange, clinicDateKey, clinicTime, DEFAULT_DAYS, MAX_BOOKING_DAYS, toClinicDateKey,
} from '../utils/schedule';

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

    const dateKey = toClinicDateKey(date);
    if (!dateKey) return [];

    const booked = await this.getBookedRanges(doctorId, dateKey, dateKey);
    return buildDaySlots(doctor, dateKey, booked).map((s) => ({ ...s, doctorId }));
  }

  /**
   * Open-slot counts for each day from today, so the booking calendar can
   * show which dates have openings. One database query for the whole range.
   */
  async getAvailabilityRange(doctorId: number, days: number = MAX_BOOKING_DAYS) {
    const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
    if (!doctor) throw new Error('Doctor not found');

    const count = Math.min(Math.max(days, 1), MAX_BOOKING_DAYS);
    const first = clinicDateKey(new Date());
    const last = addDays(first, count - 1);
    const booked = await this.getBookedRanges(doctorId, first, last);

    const result: { date: string; openSlots: number }[] = [];
    for (let i = 0; i < count; i++) {
      const dateKey = addDays(first, i);
      const openSlots = buildDaySlots(doctor, dateKey, booked).filter((s) => s.available).length;
      result.push({ date: dateKey, openSlots });
    }
    return {
      doctorId,
      acceptingPatients: doctor.isAcceptingPatients !== false,
      workingDays: doctor.availableDays?.length ? doctor.availableDays : DEFAULT_DAYS,
      workingHours: doctor.availableHours || '9:00 AM - 5:00 PM',
      slotMinutes: doctor.consultationDuration || 30,
      days: result,
    };
  }

  private async getBookedRanges(doctorId: number, fromKey: string, toKey: string): Promise<BookedRange[]> {
    const existing = await this.appointmentRepository.find({
      where: {
        doctorId,
        scheduledTime: Between(clinicTime(fromKey, 0), clinicTime(addDays(toKey, 1), 0)),
        status: In(ACTIVE_APPOINTMENT_STATUSES),
      },
    });
    return existing.map((apt) => ({ start: new Date(apt.scheduledTime), durationMinutes: apt.duration || 30 }));
  }

  /**
   * Create a new appointment, validate entities, check for availability,
   * generate meeting link if online, trigger alerts, send notifications,
   * and emit real-time event.
   */
  async createAppointment(
    data: CreateAppointmentDto
  ): Promise<AppointmentWithDetails & { calendarEventCreated: boolean; emailsSent: { patient: boolean; doctor: boolean } }> {
    // symptoms is a text[] column: accept a comma-separated string too, so a
    // client sending plain text gets a booking instead of a database error.
    const rawSymptoms = data.symptoms as unknown;
    if (typeof rawSymptoms === 'string') {
      data.symptoms = rawSymptoms.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (rawSymptoms != null && !Array.isArray(rawSymptoms)) {
      data.symptoms = [];
    }

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

    // By default a booked slot is confirmed straight away, because the slots
    // shown are the doctor's own published availability. Set
    // APPOINTMENT_AUTO_CONFIRM=false to make doctors approve each request
    // (the Meet link is then created when they confirm).
    const autoConfirm = process.env.APPOINTMENT_AUTO_CONFIRM !== 'false';

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
      status: autoConfirm ? 'confirmed' : 'pending_confirmation',
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

    // Confirmed: put it on Google Calendar (with Meet for online visits)
    // and email both people. Failures here never undo the booking.
    let calendarEventCreated = false;
    let emailsSent = { patient: false, doctor: false };
    if (autoConfirm) {
      const isOnline = data.appointmentType === 'online';
      const meet = await this.calendarService.createMeetingEvent(
        patient.user?.name || 'Patient',
        doctor.name,
        new Date(data.scheduledTime),
        endTime,
        patient.user?.email,
        doctor.email,
        doctor.googleRefreshToken,
        isOnline
      );
      calendarEventCreated = !!meet.success;
      if (meet.success && meet.meetLink) {
        appointment.meetingLink = meet.meetLink;
        await this.appointmentRepository.save(appointment);
      } else if (!meet.success) {
        console.warn(`Google Calendar event not created for appointment ${appointment.id}: ${meet.error}`);
      }

      emailsSent = await sendAppointmentConfirmationEmails({
        appointmentId: appointment.id,
        patientName: patient.user?.name || 'Patient',
        patientEmail: patient.user?.email,
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        doctorSpecialty: doctor.specialty,
        hospitalName: hospital.name,
        hospitalAddress: hospital.address,
        start: new Date(data.scheduledTime),
        end: endTime,
        isOnline,
        meetLink: appointment.meetingLink,
        symptoms: data.symptoms,
      });
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

    // Send notifications. A confirmed booking already emailed both people;
    // just let the doctor's dashboard know live.
    if (autoConfirm) {
      await this.notificationService.sendNotification(
        data.doctorId.toString(),
        'doctor',
        'inapp',
        'high',
        'New Appointment Booked',
        `${appointmentWithDetails.patientName} booked a ${data.appointmentType} appointment for ${new Date(data.scheduledTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}.`
      );
    } else {
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

    return { ...appointmentWithDetails, calendarEventCreated, emailsSent };
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