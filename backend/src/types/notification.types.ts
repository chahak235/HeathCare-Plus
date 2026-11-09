export type NotificationChannel = 'sms' | 'email' | 'push' | 'inapp';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'emergency';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  id: string;
  userId: string;
  userType: 'patient' | 'doctor' | 'nurse' | 'admin' | 'paramedic';
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface SMSNotification {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface EmailNotification {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
    contentType?: string;
  }>;
}

export interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  android?: {
    channelId: string;
    priority?: 'high' | 'normal';
    sound?: string;
  };
  ios?: {
    sound?: string;
    badge?: number;
    category?: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Pre-defined templates for common scenarios
export const NOTIFICATION_TEMPLATES = {
  EMERGENCY_ADMIT: {
    patient: {
      sms: "🚨 EMERGENCY: Ambulance #{ambulanceId} arriving in {eta}min. Your bed is reserved in {ward}. Doctor {doctorName} will attend.",
      email: "Emergency Admission - {hospitalName}",
      push: "🚨 Emergency - Ambulance ETA: {eta}min"
    },
    doctor: {
      sms: "🚨 CRITICAL ALERT: Priority {priority} patient ed. ETA: {eta}min. Condition: {condition}. Bed: {bedNumber}.",
      email: "Critical Patient Assigned - Priority {priority}",
      push: "🚨 New Critical Patient - Priority {priority}"
    },
    admin: {
      sms: "⚠️ EMERGENCY OVERRIDE: Bed {bedNumber} reserved for Priority {priority}. Available staff: {staffCount}",
      email: "Emergency Override Alert - {hospitalName}",
      push: "⚠️ Emergency Override - Bed {bedNumber}"
    }
  },
  BED_READY: {
    patient: {
      sms: "✅ Your bed is ready – {ward}, Bed {bedNumber}. Please proceed to floor {floor}.",
      push: "✅ Bed Ready - {ward}, Bed {bedNumber}"
    },
    nurse: {
      sms: "Patient {patientName} arriving for Bed {bedNumber}. Prepare {equipment}.",
      push: "Patient arriving - Bed {bedNumber}"
    }
  },
  DOCTOR_ASSIGNED: {
    patient: {
      sms: "👨‍⚕️ Dr. {doctorName} ({specialty}) has been assigned to your case.",
      push: "👨‍⚕️ Doctor Assigned - {doctorName}"
    },
    doctor: {
      sms: "👨‍⚕️ Dr. {doctorName} ({specialty}) has been assigned to your case.",
      push: "👨‍⚕️ Doctor Assigned - {doctorName}"
    }
  },
  DISCHARGE: {
    patient: {
      sms: "✅ You have been discharged. Please collect your discharge summary from the reception.",
      email: "Discharge Summary - {hospitalName}",
      push: "✅ Discharge Complete"
    },
    family: {
      sms: "{patientName} has been discharged from {hospitalName}.",
      push: "Patient Discharged - {patientName}"
    }
  },
  APPOINTMENT_REMINDER: {
    patient: {
      sms: "📅 Appointment Reminder: Dr. {doctorName} on {date} at {time}. Location: {location}",
      email: "Appointment Reminder - {doctorName}",
      push: "📅 Appointment Tomorrow"
    }
  }
};
