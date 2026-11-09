import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { SocketService } from './socket.service';
import { AppDataSource } from '../config/database.config';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NOTIFICATION_TEMPLATES
} from '../types/notification.types';
import { randomUUID } from 'crypto';

export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private socketService: SocketService;
  private notifications: Map<string, Notification>;
  private patientRepository = AppDataSource.getRepository(Patient);
  private doctorRepository = AppDataSource.getRepository(Doctor);

  constructor(socketService: SocketService) {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.socketService = socketService;
    this.notifications = new Map();

    console.log('🔔 Notification service initialized');
  }

  // Resolve a real email/phone for this notification's recipient. `userId`
  // is the Patient or Doctor row's own id (not the login User's id — see
  // how appointment.service.ts calls sendNotification), so this needs an
  // actual DB lookup, not just the id passed through.
  private async resolveContact(userId: string, userType: string): Promise<{ email?: string; phone?: string; socketUserId?: string }> {
    const id = parseInt(userId, 10);
    if (isNaN(id)) return {};

    if (userType === 'patient') {
      const patient = await this.patientRepository.findOne({ where: { id }, relations: ['user'] });
      return { email: patient?.user?.email, phone: patient?.user?.phone, socketUserId: patient?.user?.id?.toString() };
    }
    if (userType === 'doctor') {
      const doctor = await this.doctorRepository.findOne({ where: { id } });
      return { email: doctor?.email, phone: doctor?.phone, socketUserId: doctor?.userId?.toString() };
    }
    return {};
  }

  // Dispatches a single notification. Runs directly (no Redis/queue dependency —
  // this app doesn't provision Redis, and a queue that can't reach it would hang
  // every caller indefinitely). Failures here must never block the caller
  // (e.g. appointment booking), so errors are logged and swallowed.
  //
  // Notification (id/userId/title/message) and EmailNotification/SMSNotification
  // (to/subject/html, to/body) are different shapes — this used to blindly cast
  // one to the other with `as any`, so `to` was always undefined and every send
  // failed with "No recipients defined" regardless of SMTP/Twilio configuration.
  private async dispatch(notification: Notification, channel: NotificationChannel) {
    try {
      const { email, phone, socketUserId } = await this.resolveContact(notification.userId, notification.userType);
      
      switch (channel) {
        case 'email': {
          if (!email) {
            console.warn(`⚠️ No email on file for ${notification.userType} ${notification.userId}, skipping email notification`);
            return { success: false };
          }
          return await this.emailService.sendEmail({
            to: email,
            subject: notification.title,
            html: `<p>${notification.message.replace(/\n/g, '<br>')}</p>`,
            text: notification.message,
          });
        }
        case 'sms': {
          if (!phone) {
            console.warn(`⚠️ No phone on file for ${notification.userType} ${notification.userId}, skipping SMS notification`);
            return { success: false };
          }
          return await this.smsService.sendSMS({
            to: phone,
            body: `${notification.title}: ${notification.message}`,
          });
        }
        case 'push':
          console.log('Push notification:', notification);
          return { success: true };
        case 'inapp':
          if (socketUserId) {
            this.socketService.sendNotificationToUser(socketUserId, notification);
          } else {
            // Fallback just in case
            this.socketService.sendNotificationToUser(notification.userId, notification);
          }
          return { success: true };
      }
    } catch (error) {
      console.warn(`⚠️ Notification ${notification.id} via ${channel} failed (non-fatal):`, error);
      return { success: false };
    }
  }

  async sendNotification(
    userId: string,
    userType: string,
    channel: NotificationChannel,
    priority: NotificationPriority,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<string> {
    const notificationId = randomUUID();
    
    const notification: Notification = {
      id: notificationId,
      userId,
      userType: userType as any,
      channel,
      priority,
      title,
      message,
      data,
      status: 'pending',
      createdAt: new Date()
    };

    this.notifications.set(notificationId, notification);

    // Fire-and-forget: don't let a slow/broken email or SMS provider block
    // whatever triggered this notification (e.g. booking an appointment).
    this.dispatch(notification, channel)
      .then((result) => {
        notification.status = result?.success ? 'sent' : 'failed';
      })
      .catch(() => {
        notification.status = 'failed';
      });

    console.log(`📨 Notification ${notificationId} dispatched for ${userId} via ${channel}`);

    return notificationId;
  }

  async sendEmergencyNotification(
    userId: string,
    userType: string,
    patientName: string,
    priority: number,
    eta?: number,
    bedNumber?: string,
    doctorName?: string
  ) {
    const template = NOTIFICATION_TEMPLATES.EMERGENCY_ADMIT;
    let message = '';
    let title = '';

    if (userType === 'doctor') {
      message = template.doctor.sms
        .replace('{priority}', priority.toString())
        .replace('{eta}', eta?.toString() || '?')
        .replace('{condition}', 'Critical')
        .replace('{bedNumber}', bedNumber || 'TBD');
      title = `🚨 Priority ${priority} Patient`;
    } else if (userType === 'patient') {
      message = template.patient.sms
        .replace('{ambulanceId}', 'AMB-001')
        .replace('{eta}', eta?.toString() || '?')
        .replace('{ward}', 'Emergency')
        .replace('{doctorName}', doctorName || 'the doctor');
      title = '🚨 Emergency Alert';
    } else {
      message = template.admin.sms
        .replace('{priority}', priority.toString())
        .replace('{bedNumber}', bedNumber || 'TBD')
        .replace('{staffCount}', '5');
      title = '⚠️ Emergency Override';
    }

    // Send via multiple channels for emergency
    const smsId = await this.sendNotification(
      userId, 
      userType, 
      'sms', 
      'emergency', 
      title, 
      message,
      { patientName, priority, eta, bedNumber }
    );

    const inAppId = await this.sendNotification(
      userId, 
      userType, 
      'inapp', 
      'emergency', 
      title, 
      message,
      { patientName, priority, eta, bedNumber }
    );

    return { smsId, inAppId };
  }

  async sendBedReadyNotification(
    userId: string,
    userType: string,
    patientName: string,
    bedNumber: string,
    ward: string,
    floor: number
  ) {
    const template = NOTIFICATION_TEMPLATES.BED_READY;
    let message = '';

    if (userType === 'patient') {
      message = template.patient.sms
        .replace('{ward}', ward)
        .replace('{bedNumber}', bedNumber)
        .replace('{floor}', floor.toString());
    } else {
      message = template.nurse.sms
        .replace('{patientName}', patientName)
        .replace('{bedNumber}', bedNumber)
        .replace('{equipment}', 'monitor, oxygen');
    }

    return this.sendNotification(
      userId,
      userType,
      'sms',
      'high',
      '✅ Bed Ready',
      message,
      { bedNumber, ward, floor }
    );
  }

  async getNotificationStatus(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return userNotifications;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date();
      return true;
    }
    return false;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    this.notifications.forEach((notification) => {
      if (notification.userId === userId && notification.status !== 'read') {
        notification.status = 'read';
        notification.readAt = new Date();
        count++;
      }
    });
    return count;
  }
}
