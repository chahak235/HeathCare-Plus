import twilio from 'twilio';
import { SMSNotification } from '../types/notification.types';

export class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isEnabled: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      try {
        this.client = twilio(accountSid, authToken);
      } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error);
        this.isEnabled = false;
        console.warn('⚠️ Twilio credentials not valid. SMS disabled. Using mock mode.');
      }
      this.isEnabled = true;
      console.log('📱 Twilio SMS service initialized');
    } else {
      this.isEnabled = false;
      console.warn('⚠️ Twilio credentials not found. SMS disabled. Using mock mode.');
    }
  }

  async sendSMS(notification: SMSNotification): Promise<{ success: boolean; sid?: string }> {
    if (!this.isEnabled) {
      // Mock mode for development
      console.log('📱 [MOCK] SMS sent to:', notification.to);
      console.log('📱 [MOCK] Body:', notification.body);
      return { success: true, sid: 'mock-sid-123' };
    }

    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      const message = await this.client.messages.create({
        body: notification.body,
        to: notification.to,
        from: this.fromNumber,
        mediaUrl: notification.mediaUrl,
        statusCallback: notification.statusCallback
      });

      console.log(`📱 SMS sent to ${notification.to}: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      return { success: false };
    }
  }

  async sendEmergencyAlert(to: string, patientName: string, priority: number, eta?: number) {
    let body = `🚨 EMERGENCY: Priority ${priority} patient - ${patientName}`;
    if (eta) {
      body += ` (ETA: ${eta} min)`;
    }
    body += `. Please check command center.`;

    return this.sendSMS({
      to,
      body
    });
  }

  async sendBedReady(to: string, bedNumber: string, ward: string, floor: number) {
    const body = `✅ Bed Ready: ${bedNumber || 'TBD'} in ${ward}, Floor ${floor}. Please proceed.`;

    return this.sendSMS({
      to,
      body
    });
  }

  async sendDoctorAssigned(to: string, doctorName: string, patientName: string, priority: number) {
    const body = `👨‍⚕️ Dr. ${doctorName || 'TBD'} assigned to ${patientName || 'TBD' || 'the patient'} (Priority ${priority}).`;

    return this.sendSMS({
      to,
      body
    });
  }
}
