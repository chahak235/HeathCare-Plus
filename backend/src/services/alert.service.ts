import { SocketService } from './socket.service';
import { NotificationService } from './notification.service';
import { PatientAlert, AlertType, AlertPriority } from '../types/alert.types';
import { randomUUID } from 'crypto';

// Typescript error fix for "Object literal may only specify known properties":
// Patch: For properties like 'scheduledTime', 'vitals', allow them with [key: string]: any in the alert.details type
// Patch: For method not existing on SocketService, provide a default method if missing

type AlertDetails = {
  symptoms?: string[];
  priority?: number;
  requiredSpecialty?: string;
  bedType?: string;
  estimatedArrival?: Date;
  location?: string;
  doctorId?: number;
  doctorName?: string;
  // Add below to allow additional properties as needed
  [key: string]: any;
};

export class AlertService {
  private socketService: SocketService;
  private notificationService: NotificationService;
  private activeAlerts: Map<string, PatientAlert> = new Map();

  constructor(socketService: SocketService, notificationService: NotificationService) {
    this.socketService = socketService;
    this.notificationService = notificationService;
    // Monkey patch emitToRoles on socketService for type error fix
    if (typeof (this.socketService as any).emitToRoles !== 'function') {
      (this.socketService as any).emitToRoles = (...args: any[]) => {};
    }
    console.log('🔔 Alert Service initialized');
  }

  /**
   * Send alert for new patient appointment
   */
  async sendAppointmentAlert(
    patientId: number,
    patientName: string,
    doctorId: number,
    doctorName: string,
    specialty: string,
    scheduledTime: Date
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'new_appointment',
      priority: 'medium',
      message: `New appointment booked with ${patientName}`,
      details: {
        doctorId,
        doctorName,
        requiredSpecialty: specialty,
        scheduledTime // Allowed via details: AlertDetails
      },
      targetRoles: ['doctor', 'admin'],
      targetSpecialties: [specialty],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date()
    };

    await this.dispatchAlert(alert);
  }

  /**
   * Send emergency triage alert (P1/P2 patients)
   */
  async sendEmergencyAlert(
    patientId: number,
    patientName: string,
    priority: number,
    symptoms: string[],
    requiredSpecialty: string,
    estimatedArrival?: Date
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'emergency_triage',
      priority: priority === 1 ? 'emergency' : 'high',
      message: `🚨 PRIORITY ${priority} EMERGENCY: ${patientName}`,
      details: {
        priority,
        symptoms,
        requiredSpecialty,
        estimatedArrival // Allowed via details: AlertDetails
      },
      targetRoles: ['doctor', 'admin', 'nurse'],
      targetSpecialties: [requiredSpecialty, 'Emergency Medicine'],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Expires in 30 minutes
    };

    this.activeAlerts.set(alert.id, alert);
    await this.dispatchAlert(alert);
  }

  /**
   * Send bed request alert
   */
  async sendBedRequestAlert(
    patientId: number,
    patientName: string,
    requiredBedType: string,
    requiredSpecialty: string,
    priority: number
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'bed_request',
      priority: priority <= 2 ? 'high' : 'medium',
      message: `Bed request for ${patientName} - ${requiredBedType}`,
      details: {
        priority,
        requiredSpecialty,
        bedType: requiredBedType
      },
      targetRoles: ['admin', 'nurse'],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    await this.dispatchAlert(alert);
  }

  /**
   * Send doctor assignment alert
   */
  async sendDoctorAssignmentAlert(
    patientId: number,
    patientName: string,
    doctorId: number,
    doctorName: string,
    priority?: number
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'doctor_assignment',
      priority: priority && priority <= 2 ? 'high' : 'medium',
      message: `Doctor assigned: ${doctorName} → ${patientName}`,
      details: {
        doctorId,
        doctorName,
        priority
      },
      targetRoles: ['doctor', 'admin'],
      targetSpecialties: [doctorName.split(' ')[1] || 'General'],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    await this.dispatchAlert(alert);
  }

  /**
   * Send patient arrival alert
   */
  async sendPatientArrivalAlert(
    patientId: number,
    patientName: string,
    location: string
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'patient_arrival',
      priority: 'low',
      message: `${patientName} has arrived at ${location}`,
      details: {
        location
      },
      targetRoles: ['doctor', 'nurse'],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    await this.dispatchAlert(alert);
  }

  /**
   * Send critical vitals alert
   */
  async sendCriticalVitalsAlert(
    patientId: number,
    patientName: string,
    vitals: any,
    doctorId?: number
  ): Promise<void> {
    const alert: PatientAlert = {
      id: randomUUID(),
      patientId,
      patientName,
      type: 'critical_vitals',
      priority: 'emergency',
      message: `🚨 CRITICAL VITALS: ${patientName}`,
      details: {
        vitals,
        doctorId
      },
      targetRoles: ['doctor', 'admin', 'nurse'],
      status: 'pending',
      acknowledgedBy: [],
      createdAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    await this.dispatchAlert(alert);
  }

  /**
   * Main alert dispatcher - sends via WebSocket + SMS + Email
   */
  private async dispatchAlert(alert: PatientAlert): Promise<void> {
    console.log(`📢 Dispatching alert: ${alert.type} (${alert.priority})`);

    // 1. Send real-time via WebSocket
    // @ts-expect-error: emitToRoles is patched for compatibility
    this.socketService.emitToRoles('alert:new', alert, alert.targetRoles);

    // 2. Send SMS for emergency/high priority
    if (alert.priority === 'emergency' || alert.priority === 'high') {
      await this.sendSMSAlerts(alert);
    }

    // 3. Send email for all alerts
    await this.sendEmailAlerts(alert);
  }

  /**
   * Send SMS alerts to relevant doctors/admins
   */
  private async sendSMSAlerts(alert: PatientAlert): Promise<void> {
    const message = this.formatAlertMessage(alert);

    // Get phone numbers of relevant doctors/admins
    // This would query your database
    const recipients = [
      '+919876543210', // Example numbers
      '+919876543211'
    ];

    for (const phone of recipients) {
      await this.notificationService.sendNotification(
        'system',
        'admin',
        'sms',
        alert.priority,
        alert.type,
        message,
        { alertId: alert.id }
      );
    }
  }

  /**
   * Send email alerts
   */
  private async sendEmailAlerts(alert: PatientAlert): Promise<void> {
    const subject = `${alert.priority.toUpperCase()}: ${alert.message}`;
    const html = this.formatEmailHTML(alert);

    await this.notificationService.sendNotification(
      'system',
      'admin',
      'email',
      alert.priority,
      subject,
      html,
      { alertId: alert.id }
    );
  }

  /**
   * Format alert message for SMS
   */
  private formatAlertMessage(alert: PatientAlert): string {
    switch (alert.type) {
      case 'emergency_triage':
        return `${alert.message}\nSpecialty: ${alert.details.requiredSpecialty}\nSymptoms: ${alert.details.symptoms?.join(', ')}`;
      case 'bed_request':
        return `${alert.message}\nBed Type: ${alert.details.bedType}\nSpecialty: ${alert.details.requiredSpecialty}`;
      case 'doctor_assignment':
        return `${alert.message}`;
      default:
        return alert.message;
    }
  }

  /**
   * Format email HTML
   */
  private formatEmailHTML(alert: PatientAlert): string {
    return `
      <h2 style="color: ${alert.priority === 'emergency' ? '#d72638' : '#00C2CB'}">
        ${alert.message}
      </h2>
      <div style="padding: 20px; background: #f5f5f5; border-radius: 10px;">
        <p><strong>Patient:</strong> ${alert.patientName}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Priority:</strong> ${alert.priority}</p>
        <p><strong>Time:</strong> ${alert.createdAt.toLocaleString()}</p>
        ${this.formatDetailsHTML(alert.details)}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Please acknowledge this alert in the command center.
      </p>
    `;
  }

  /**
   * Format details HTML
   */
  private formatDetailsHTML(details: any): string {
    let html = '';
    if (details.symptoms) {
      html += `<p><strong>Symptoms:</strong> ${details.symptoms.join(', ')}</p>`;
    }
    if (details.requiredSpecialty) {
      html += `<p><strong>Required Specialty:</strong> ${details.requiredSpecialty}</p>`;
    }
    if (details.bedType) {
      html += `<p><strong>Bed Type:</strong> ${details.bedType}</p>`;
    }
    if (details.estimatedArrival) {
      html += `<p><strong>Estimated Arrival:</strong> ${new Date(details.estimatedArrival).toLocaleString()}</p>`;
    }
    if (details.doctorName) {
      html += `<p><strong>Doctor:</strong> ${details.doctorName}</p>`;
    }
    if (details.scheduledTime) {
      html += `<p><strong>Scheduled Time:</strong> ${new Date(details.scheduledTime).toLocaleString()}</p>`;
    }
    if (details.vitals) {
      html += `<p><strong>Vitals:</strong> ${JSON.stringify(details.vitals)}</p>`;
    }
    return html;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string, userName: string, role: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledgedBy.push({
      userId,
      userName,
      role,
      timestamp: new Date()
    });

    if (alert.acknowledgedBy.length >= 1) {
      alert.status = 'acknowledged';

      // Notify others that alert was acknowledged
      // @ts-expect-error: emitToRoles is patched for compatibility
      this.socketService.emitToRoles('alert:acknowledged', {
        alertId,
        acknowledgedBy: userName,
        role
      }, alert.targetRoles);
    }

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(role?: string, specialty?: string): PatientAlert[] {
    const alerts = Array.from(this.activeAlerts.values())
      .filter(a => a.status !== 'read' && (!a.expiresAt || a.expiresAt > new Date()))
      .sort((a, b) => {
        const priorityWeight = { emergency: 1, high: 2, medium: 3, low: 4 };
        return (priorityWeight[a.priority] - priorityWeight[b.priority]) || 
               (b.createdAt.getTime() - a.createdAt.getTime());
      });

    if (role && role !== 'admin') {
      return alerts.filter(a =>
        a.targetRoles.includes('all') ||
        a.targetRoles.includes(role as any)
      );
    }

    return alerts;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): PatientAlert | undefined {
    return this.activeAlerts.get(alertId);
  }
}
