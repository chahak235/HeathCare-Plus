import { EmailService } from './email.service';

const emailService = new EmailService();

export interface AppointmentEmailDetails {
  appointmentId: number;
  patientName: string;
  patientEmail?: string | null;
  doctorName: string;
  doctorEmail?: string | null;
  doctorSpecialty?: string | null;
  hospitalName?: string | null;
  hospitalAddress?: string | null;
  start: Date;
  end: Date;
  isOnline: boolean;
  meetLink?: string | null;
  symptoms?: string[];
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** A standard calendar file, so the visit can be added to any calendar app. */
export function buildIcs(d: AppointmentEmailDetails): string {
  const where = d.isOnline ? d.meetLink || 'Online (Google Meet link to follow)' : [d.hospitalName, d.hospitalAddress].filter(Boolean).join(', ');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HealthCare+//Appointments//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appointment-${d.appointmentId}@healthcareplus`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(d.start)}`,
    `DTEND:${icsDate(d.end)}`,
    `SUMMARY:${icsText(`${d.isOnline ? 'Online consultation' : 'Clinic visit'}: ${d.doctorName} & ${d.patientName}`)}`,
    `LOCATION:${icsText(where)}`,
    `DESCRIPTION:${icsText(d.meetLink ? `Join: ${d.meetLink}` : 'HealthCare+ appointment')}`,
    ...(d.meetLink ? [`URL:${d.meetLink}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Appointment in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function buildHtml(d: AppointmentEmailDetails, audience: 'patient' | 'doctor'): string {
  const when = d.start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
  const heading = audience === 'patient' ? 'Your appointment is confirmed' : 'New appointment booked';
  const intro =
    audience === 'patient'
      ? `Hi ${escapeHtml(d.patientName)}, your ${d.isOnline ? 'online consultation' : 'clinic visit'} with ${escapeHtml(d.doctorName)} is booked.`
      : `${escapeHtml(d.patientName)} has booked a ${d.isOnline ? 'video consultation' : 'clinic visit'} with you.`;
  const where = d.isOnline
    ? d.meetLink
      ? `<a href="${escapeHtml(d.meetLink)}" style="color:#0284c7">${escapeHtml(d.meetLink)}</a>`
      : 'Online. The Google Meet link will be shared before the appointment.'
    : escapeHtml([d.hospitalName, d.hospitalAddress].filter(Boolean).join(', ') || 'Clinic');
  const symptoms = d.symptoms && d.symptoms.length ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Reason</td><td>${escapeHtml(d.symptoms.join(', '))}</td></tr>` : '';

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0">
    <h2 style="margin:0 0 8px;color:#0284c7">${heading}</h2>
    <p>${intro}</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">When</td><td><strong>${escapeHtml(when)}</strong> (IST)</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Doctor</td><td>${escapeHtml(d.doctorName)}${d.doctorSpecialty ? `, ${escapeHtml(d.doctorSpecialty)}` : ''}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Patient</td><td>${escapeHtml(d.patientName)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">${d.isOnline ? 'Join' : 'Where'}</td><td>${where}</td></tr>
      ${symptoms}
    </table>
    ${d.meetLink ? `<p><a href="${escapeHtml(d.meetLink)}" style="display:inline-block;background:#0284c7;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Join Google Meet</a></p>` : ''}
    <p style="color:#64748b;font-size:13px">The attached calendar file adds this appointment to Google Calendar, Outlook or Apple Calendar.</p>
    <p style="color:#64748b;font-size:12px">HealthCare+ · Booking reference #${d.appointmentId}</p>
  </div></body></html>`;
}

/** Email both the patient and the doctor. Never throws; returns who was emailed. */
export async function sendAppointmentConfirmationEmails(d: AppointmentEmailDetails): Promise<{ patient: boolean; doctor: boolean }> {
  const attachment = { filename: 'appointment.ics', content: buildIcs(d), contentType: 'text/calendar; charset=utf-8' };
  const subjectTime = d.start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  const send = async (to: string | null | undefined, audience: 'patient' | 'doctor') => {
    if (!to) return false;
    try {
      const result = await emailService.sendEmail({
        to,
        subject:
          audience === 'patient'
            ? `Confirmed: ${d.isOnline ? 'Online consultation' : 'Clinic visit'} with ${d.doctorName}, ${subjectTime}`
            : `New booking: ${d.patientName}, ${subjectTime}`,
        html: buildHtml(d, audience),
        attachments: [attachment],
      } as any);
      return result.success;
    } catch (err) {
      console.error(`Appointment email to ${audience} failed:`, err);
      return false;
    }
  };

  const [patient, doctor] = await Promise.all([send(d.patientEmail, 'patient'), send(d.doctorEmail, 'doctor')]);
  return { patient, doctor };
}
