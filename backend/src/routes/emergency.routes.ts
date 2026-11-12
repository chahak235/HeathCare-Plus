import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Patient } from '../entities/Patient.entity';
import { User } from '../entities/User.entity';
import { EmergencyAlert } from '../entities/EmergencyAlert.entity';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();
const MAX_CONTACTS = 5;
const ALERT_COOLDOWN_MS = 60_000;
const lastAlert = new Map<number, number>();

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, max = 30) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((x) => str(x, 100))
    .filter(Boolean)
    .slice(0, max);
const num = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function findPatient(userId: number) {
  const repo = AppDataSource.getRepository(Patient);
  let patient = await repo.findOne({ where: { userId } });
  if (!patient) {
    patient = repo.create({ userId, allergies: [], chronicConditions: [], currentMedications: [] });
    await repo.save(patient);
  }
  return patient;
}

function toProfile(p: Patient, user?: User | null) {
  const heightM = p.heightCm ? p.heightCm / 100 : null;
  return {
    name: user?.name ?? null,
    phone: user?.phone ?? null,
    email: user?.email ?? null,
    dateOfBirth: p.dateOfBirth ?? null,
    gender: p.gender ?? null,
    bloodGroup: p.bloodGroup ?? null,
    heightCm: p.heightCm ?? null,
    weightKg: p.weightKg ?? null,
    bmi: heightM && p.weightKg ? Math.round((p.weightKg / (heightM * heightM)) * 10) / 10 : null,
    allergies: p.allergies ?? [],
    chronicConditions: p.chronicConditions ?? [],
    currentMedications: p.currentMedications ?? [],
    medicalNotes: p.medicalNotes ?? '',
    emergencyContacts: p.emergencyContacts ?? (p.emergencyContact ? [p.emergencyContact] : []),
    preferredHospital: p.preferredHospital ?? null,
  };
}

router.use(authenticate);

// GET /api/emergency/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const [patient, user] = await Promise.all([
      findPatient(userId),
      AppDataSource.getRepository(User).findOne({ where: { id: userId } }),
    ]);
    res.json({ success: true, data: toProfile(patient, user) });
  } catch (err) {
    console.error('Get emergency profile failed:', err);
    res.status(500).json({ success: false, error: 'Could not load your health profile' });
  }
});

// PUT /api/emergency/profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    const contacts = (Array.isArray(b.emergencyContacts) ? b.emergencyContacts : [])
      .map((c: any) => ({
        name: str(c?.name, 80),
        relation: str(c?.relation, 40),
        phone: str(c?.phone, 30).replace(/[^\d+\-\s()]/g, ''),
        email: str(c?.email, 120),
      }))
      .filter((c: any) => c.name && c.phone)
      .slice(0, MAX_CONTACTS);

    for (const c of contacts) {
      if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
        return res.status(400).json({ success: false, error: `Email for ${c.name} doesn't look right` });
      }
    }

    const patient = await findPatient(req.user.id);
    const dob = b.dateOfBirth ? new Date(b.dateOfBirth) : null;
    patient.dateOfBirth = dob && !isNaN(dob.getTime()) && dob < new Date() ? dob : patient.dateOfBirth;
    patient.gender = str(b.gender, 20) || (null as any);
    patient.bloodGroup = /^(A|B|AB|O)[+-]$/.test(str(b.bloodGroup, 5)) ? str(b.bloodGroup, 5) : (null as any);
    patient.heightCm = num(b.heightCm, 30, 260) as any;
    patient.weightKg = num(b.weightKg, 1, 400) as any;
    patient.allergies = list(b.allergies);
    patient.chronicConditions = list(b.chronicConditions);
    patient.currentMedications = list(b.currentMedications);
    patient.medicalNotes = str(b.medicalNotes, 1000);
    patient.emergencyContacts = contacts;
    const h = b.preferredHospital;
    patient.preferredHospital =
      h && str(h.name, 150)
        ? { name: str(h.name, 150), phone: str(h.phone, 30), address: str(h.address, 250), lat: num(h.lat, -90, 90) ?? undefined, lng: num(h.lng, -180, 180) ?? undefined }
        : null;
    patient.updatedAt = new Date();
    await AppDataSource.getRepository(Patient).save(patient);

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: req.user.id } });
    res.json({ success: true, data: toProfile(patient, user) });
  } catch (err) {
    console.error('Save emergency profile failed:', err);
    res.status(500).json({ success: false, error: 'Could not save your health profile' });
  }
});

// POST /api/emergency/alert — emails the patient's family with location and health details
router.post('/alert', async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const now = Date.now();
  if (now - (lastAlert.get(userId) ?? 0) < ALERT_COOLDOWN_MS) {
    return res.status(429).json({ success: false, error: 'An alert was just sent. Please wait a minute before sending another.' });
  }

  try {
    const [patient, user] = await Promise.all([
      findPatient(userId),
      AppDataSource.getRepository(User).findOne({ where: { id: userId } }),
    ]);
    const profile = toProfile(patient, user);
    const lat = num(req.body?.lat, -90, 90);
    const lng = num(req.body?.lng, -180, 180);
    const hospital = req.body?.hospital;
    const mapsLink = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
    const name = profile.name || 'Your family member';

    const recipients = profile.emergencyContacts.filter((c: any) => c.email);
    // Record every SOS so hospital staff see it in the dashboard, even when
    // no family email can be sent
    const alertRepo = AppDataSource.getRepository(EmergencyAlert);
    const alert = await alertRepo.save(
      alertRepo.create({
        userId,
        location: lat != null && lng != null ? `${lat.toFixed(5)},${lng.toFixed(5)}` : null,
        nearestHospital: hospital?.name ? str(hospital.name, 200) : null,
      })
    );
    if (recipients.length === 0) {
      lastAlert.set(userId, now);
      return res.status(400).json({ success: false, error: 'None of your emergency contacts has an email address. Add one in your health profile.' });
    }
    lastAlert.set(userId, now);

    const health = [
      profile.bloodGroup && `Blood group: ${profile.bloodGroup}`,
      profile.allergies.length && `Allergies: ${profile.allergies.join(', ')}`,
      profile.chronicConditions.length && `Conditions: ${profile.chronicConditions.join(', ')}`,
      profile.currentMedications.length && `Medications: ${profile.currentMedications.join(', ')}`,
      profile.heightCm && profile.weightKg && `Height/weight: ${profile.heightCm} cm, ${profile.weightKg} kg`,
    ].filter(Boolean) as string[];

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a">
      <h2 style="color:#dc2626">Emergency alert from ${esc(name)}</h2>
      <p>${esc(name)} pressed the emergency button on HealthCare+ at ${esc(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))} (IST).</p>
      ${mapsLink ? `<p><a href="${mapsLink}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open their location in Google Maps</a></p>` : '<p>Their location was not available.</p>'}
      ${profile.phone ? `<p>Their phone: <a href="tel:${esc(profile.phone)}">${esc(profile.phone)}</a></p>` : ''}
      ${hospital?.name ? `<p>Nearest hospital: <strong>${esc(str(hospital.name, 150))}</strong>${hospital.phone ? `, phone ${esc(str(hospital.phone, 30))}` : ''}${hospital.distanceKm ? ` (${esc(String(hospital.distanceKm))} km away)` : ''}</p>` : ''}
      ${health.length ? `<h3>Health details for responders</h3><ul>${health.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      <p>If you cannot reach them, call emergency services on <strong>112</strong>.</p>
    </body></html>`;

    const results = await Promise.all(
      recipients.map((c: any) =>
        emailService
          .sendEmail({ to: c.email, subject: `EMERGENCY: ${name} needs help`, html } as any)
          .then((r) => ({ name: c.name, emailed: r.success }))
          .catch(() => ({ name: c.name, emailed: false }))
      )
    );
    await alertRepo.update(alert.id, { contactsEmailed: results.filter((r) => r.emailed).length });
    res.json({ success: true, data: { contacts: results, location: mapsLink, alertId: alert.id } });
  } catch (err) {
    console.error('Emergency alert failed:', err);
    res.status(500).json({ success: false, error: 'Could not send the alert emails. Call your family directly.' });
  }
});

export default router;
