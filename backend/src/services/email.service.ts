import nodemailer from 'nodemailer';
import { EmailNotification } from '../types/notification.types';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private transporterReady: Promise<void>;
  private defaultFrom: string = 'noreply@healthcareplus.demo';
  private isTestAccount = false;

  constructor() {
    this.transporterReady = this.initTransporter();
  }

  private async initTransporter(): Promise<void> {
    const hasRealSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasRealSmtp) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.defaultFrom = process.env.EMAIL_FROM || (process.env.SMTP_USER as string);
      console.log('📧 Email service using real SMTP:', process.env.SMTP_HOST || 'smtp.gmail.com');
      return;
    }

    // No real SMTP credentials configured (SMTP_USER/SMTP_PASS env vars).
    // The previous version of this file hardcoded fake Ethereal credentials
    // ('test@ethereal.email'/'testpass') that were never valid — every send
    // silently failed, in dev AND production, regardless of NODE_ENV. This
    // creates a real, working Ethereal test inbox instead, so the actual
    // send pipeline (templates, attachments, error handling) is genuinely
    // exercised end-to-end — emails land in a viewable test inbox rather
    // than real recipients' mailboxes until real SMTP creds are added.
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.defaultFrom = testAccount.user;
      this.isTestAccount = true;
      console.log('📧 No SMTP_USER/SMTP_PASS configured — using a real Ethereal test inbox.');
      console.log('📧 Sent emails will NOT reach real recipients. View them via the previewUrl logged on each send.');
      console.log('📧 To send real email, set SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM (e.g. a Gmail App Password, or Resend/SendGrid).');
    } catch (err) {
      console.error('📧 Failed to create Ethereal test account — email sending is unavailable:', err);
      this.transporter = null;
    }
  }

  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    await this.transporterReady;
    if (!this.transporter) {
      console.warn('📧 Email not sent — no transporter available:', notification.subject);
      return { success: false };
    }

    try {
      const mailOptions = {
        from: this.defaultFrom,
        to: notification.to,
        cc: notification.cc,
        bcc: notification.bcc,
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
        attachments: notification.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      const previewUrl = this.isTestAccount ? nodemailer.getTestMessageUrl(info) || undefined : undefined;

      console.log(`📧 Email sent: ${info.messageId}`);
      if (previewUrl) console.log(`📧 Preview (test inbox, not a real recipient): ${previewUrl}`);

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false };
    }
  }

  async sendEmergencyAlert(to: string | string[], patientName: string, priority: number, eta?: number) {
    const subject = `🚨 EMERGENCY ALERT: Priority ${priority} Patient`;
    const html = `
      <h1 style="color: #d72638;">🚨 Emergency Alert</h1>
      <p><strong>Priority:</strong> P${priority}</p>
      <p><strong>Patient:</strong> ${patientName}</p>
      ${eta ? `<p><strong>ETA:</strong> ${eta} minutes</p>` : ''}
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>Please check the command center for details.</p>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendBedReadyNotification(to: string, patientName: string, bedNumber: string, ward: string) {
    const subject = `Bed Ready — ${patientName}`;
    const html = `
      <h2>🛏️ Bed Assignment Confirmed</h2>
      <p><strong>Patient:</strong> ${patientName}</p>
      <p><strong>Bed:</strong> ${bedNumber}</p>
      <p><strong>Ward:</strong> ${ward}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }
}
