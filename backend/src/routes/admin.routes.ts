import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Appointment } from '../entities/Appointment.entity';
import { Hospital } from '../entities/Hospital.entity';
import { Review } from '../entities/Review.entity';
import { AccessLog } from '../entities/AccessLog.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Patient } from '../entities/Patient.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../entities/User.entity';
import { adminOnly } from '../middleware/staff-guards';
import { forgetAccountStatus } from '../utils/account-status';
import { EmergencyAlert } from '../entities/EmergencyAlert.entity';
import { In } from 'typeorm';

/**
 * Hospital/admin dashboard data. Mounted behind hospitalStaff in app.ts.
 * A hospital account sees its own hospital's bookings; an admin sees everything.
 */
const router = Router();

/** Hospital id for a hospital account, or null for admins (all hospitals). */
async function scopeHospitalId(req: AuthRequest): Promise<number | null | 'none'> {
  if (req.user?.role === 'admin') return null;
  const h = await AppDataSource.getRepository(Hospital).findOne({ where: { userId: Number(req.user?.id) } as any });
  return h ? h.id : 'none';
}

router.get('/summary', async (req: AuthRequest, res: Response) => {
  const scope = await scopeHospitalId(req);
  if (scope === 'none') return res.json({ success: true, data: null });
  const appt = AppDataSource.getRepository(Appointment).createQueryBuilder('a');
  if (scope) appt.where('a.hospital_id = :h', { h: scope });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [total, upcoming, today, online, cancelled] = await Promise.all([
    appt.clone().getCount(),
    appt.clone().andWhere("a.scheduled_time > NOW() AND a.status NOT IN ('cancelled','completed')").getCount(),
    appt.clone().andWhere('a.scheduled_time >= :s AND a.scheduled_time < :e', { s: startOfDay, e: new Date(startOfDay.getTime() + 864e5) }).getCount(),
    appt.clone().andWhere("a.appointment_type = 'online'").getCount(),
    appt.clone().andWhere("a.status = 'cancelled'").getCount(),
  ]);
  const doctors = await AppDataSource.getRepository(Doctor).count(scope ? ({ where: { hospitalId: scope } } as any) : undefined);
  const patients = await AppDataSource.getRepository(Patient).count();
  const rev = await AppDataSource.getRepository(Review)
    .createQueryBuilder('r')
    .select('COUNT(*)', 'n')
    .addSelect('AVG(r.rating)', 'avg')
    .where('r.is_published = true')
    .getRawOne();
  res.json({
    success: true,
    data: { appointments: { total, upcoming, today, online, cancelled }, doctors, patients, reviews: { count: Number(rev?.n || 0), average: rev?.avg ? Number(Number(rev.avg).toFixed(2)) : null } },
  });
});

router.get('/appointments', async (req: AuthRequest, res: Response) => {
  const scope = await scopeHospitalId(req);
  if (scope === 'none') return res.json({ success: true, data: [] });
  const qb = AppDataSource.getRepository(Appointment)
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.patient', 'p')
    .leftJoinAndSelect('p.user', 'u')
    .leftJoinAndSelect('a.doctor', 'd')
    .orderBy('a.scheduledTime', req.query.when === 'past' ? 'DESC' : 'ASC')
    .take(Math.min(Number(req.query.limit) || 100, 300));
  if (scope) qb.where('a.hospital_id = :h', { h: scope });
  if (req.query.status) qb.andWhere('a.status = :st', { st: String(req.query.status) });
  if (req.query.when === 'upcoming') qb.andWhere('a.scheduled_time > NOW()');
  if (req.query.when === 'past') qb.andWhere('a.scheduled_time <= NOW()');
  const list = await qb.getMany();
  res.json({
    success: true,
    data: list.map((a: any) => ({
      id: a.id,
      scheduledTime: a.scheduledTime,
      status: a.status,
      appointmentType: a.appointmentType,
      meetingLink: a.meetingLink,
      symptoms: a.symptoms || [],
      patientName: a.patient?.user?.name || 'Patient',
      patientPhone: a.patient?.user?.phone || null,
      patientEmail: a.patient?.user?.email || null,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name || 'Doctor',
      doctorSpecialty: a.doctor?.specialty || null,
    })),
  });
});

// All reviews, including hidden ones, for moderation
router.get('/reviews', async (_req: AuthRequest, res: Response) => {
  const list = await AppDataSource.getRepository(Review).find({ order: { createdAt: 'DESC' } as any, take: 200 });
  res.json({ success: true, data: list });
});

// Audit trail of access to health records
router.get('/access-logs', async (req: AuthRequest, res: Response) => {
  const qb = AppDataSource.getRepository(AccessLog).createQueryBuilder('l').orderBy('l.created_at', 'DESC').take(Math.min(Number(req.query.limit) || 100, 500));
  if (req.query.patientId) qb.where('l.patient_id = :p', { p: Number(req.query.patientId) });
  if (req.query.userId) qb.andWhere('l.user_id = :u', { u: Number(req.query.userId) });
  res.json({ success: true, data: await qb.getMany() });
});

// Admin: doctor and hospital accounts waiting for approval
router.get('/pending-accounts', adminOnly as any, async (_req: AuthRequest, res: Response) => {
  const users = await AppDataSource.getRepository(User).find({
    where: [{ role: 'doctor', isVerified: false }, { role: 'hospital', isVerified: false }] as any,
    order: { id: 'DESC' } as any,
  });
  res.json({ success: true, data: users.map((u: any) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt })) });
});

// Admin: approve (or revoke) a doctor or hospital account
router.patch('/users/:id/verify', adminOnly as any, async (req: AuthRequest, res: Response) => {
  const repo = AppDataSource.getRepository(User);
  const user: any = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!user || !['doctor', 'hospital'].includes(user.role)) return res.status(404).json({ success: false, error: 'Doctor or hospital account not found' });
  user.isVerified = req.body?.verified !== false;
  await repo.save(user);
  forgetAccountStatus(user.id);
  res.json({ success: true, data: { id: user.id, role: user.role, isVerified: user.isVerified } });
});

// ---- SOS alerts -----------------------------------------------------------

/** A hospital sees SOS alerts within this distance of its own address. */
const SOS_RADIUS_KM = 50;

function distanceKm(a: [number, number], b: [number, number]) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
const parseLoc = (s: string | null): [number, number] | null => {
  const m = s?.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const hospitalPoint = (h: Hospital | null): [number, number] | null =>
  h && h.latitude != null && h.longitude != null ? [Number(h.latitude), Number(h.longitude)] : null;

/**
 * Alerts this account may see: admins see all; a hospital sees alerts near it
 * (or naming it as the nearest hospital). Location is only decrypted here.
 */
async function visibleAlerts(req: AuthRequest, days: number) {
  const since = new Date(Date.now() - days * 864e5);
  const alerts = await AppDataSource.getRepository(EmergencyAlert)
    .createQueryBuilder('e')
    .where('e.created_at >= :since', { since })
    .orderBy('e.created_at', 'DESC')
    .take(500)
    .getMany();
  if (req.user?.role === 'admin') return { alerts, hospital: null as Hospital | null };
  const hospital = await AppDataSource.getRepository(Hospital).findOne({ where: { userId: Number(req.user?.id) } as any });
  if (!hospital) return { alerts: [] as EmergencyAlert[], hospital: null };
  const here = hospitalPoint(hospital);
  const name = hospital.name?.toLowerCase();
  return {
    hospital,
    alerts: alerts.filter((a) => {
      const loc = parseLoc(a.location);
      if (here && loc && distanceKm(here, loc) <= SOS_RADIUS_KM) return true;
      return !!name && !!a.nearestHospital && a.nearestHospital.toLowerCase().includes(name);
    }),
  };
}

router.get('/sos-alerts', async (req: AuthRequest, res: Response) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
  const { alerts, hospital } = await visibleAlerts(req, days);
  const userIds = [...new Set(alerts.map((a) => a.userId))];
  const users: any[] = userIds.length ? await AppDataSource.getRepository(User).find({ where: { id: In(userIds) } as any }) : [];
  const patients: any[] = userIds.length ? await AppDataSource.getRepository(Patient).find({ where: { userId: In(userIds) } as any }) : [];
  const here = hospitalPoint(hospital);
  res.json({
    success: true,
    data: alerts.map((a) => {
      const u = users.find((x) => x.id === a.userId);
      const p = patients.find((x) => x.userId === a.userId);
      const loc = parseLoc(a.location);
      return {
        id: a.id,
        createdAt: a.createdAt,
        status: a.status,
        handledAt: a.handledAt,
        nearestHospital: a.nearestHospital,
        contactsEmailed: a.contactsEmailed,
        mapsLink: loc ? `https://www.google.com/maps?q=${loc[0]},${loc[1]}` : null,
        distanceKm: here && loc ? Math.round(distanceKm(here, loc) * 10) / 10 : null,
        patient: {
          name: u?.name || 'Patient',
          phone: u?.phone || null,
          bloodGroup: p?.bloodGroup || null,
          allergies: p?.allergies || [],
          conditions: p?.chronicConditions || [],
          medications: p?.currentMedications || [],
        },
      };
    }),
  });
});

router.patch('/sos-alerts/:id', async (req: AuthRequest, res: Response) => {
  const status = String(req.body?.status || '');
  if (!['acknowledged', 'resolved', 'open'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be open, acknowledged or resolved' });
  }
  const { alerts } = await visibleAlerts(req, 90);
  const alert = alerts.find((a) => a.id === Number(req.params.id));
  if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
  await AppDataSource.getRepository(EmergencyAlert).update(alert.id, {
    status,
    handledBy: status === 'open' ? null : Number(req.user?.id),
    // Keep the first response time so the average response time stays honest
    // Database clock (same as created_at) so the response time is right in any server time zone
    handledAt: status === 'open' ? null : alert.handledAt ? alert.handledAt : (() => 'CURRENT_TIMESTAMP') as any,
  } as any);
  res.json({ success: true, data: { id: alert.id, status } });
});

// ---- Analytics (real numbers only) ----------------------------------------

router.get('/analytics', async (req: AuthRequest, res: Response) => {
  const scope = await scopeHospitalId(req);
  if (scope === 'none') return res.json({ success: true, data: null });
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date(Date.now() - days * 864e5);

  const appt = () => {
    const qb = AppDataSource.getRepository(Appointment).createQueryBuilder('a').where('a.created_at >= :since', { since });
    if (scope) qb.andWhere('a.hospital_id = :h', { h: scope });
    return qb;
  };
  const [perDay, byType, byStatus, bySpecialty, topDoctors] = await Promise.all([
    appt()
      .select("TO_CHAR(a.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'n')
      .groupBy('day')
      .orderBy('day')
      .getRawMany(),
    appt().select('a.appointment_type', 'type').addSelect('COUNT(*)', 'n').groupBy('a.appointment_type').getRawMany(),
    appt().select('a.status', 'status').addSelect('COUNT(*)', 'n').groupBy('a.status').getRawMany(),
    appt()
      .leftJoin('a.doctor', 'd')
      .select("COALESCE(d.specialty, 'Other')", 'specialty')
      .addSelect('COUNT(*)', 'n')
      .groupBy('specialty')
      .orderBy('n', 'DESC')
      .limit(8)
      .getRawMany(),
    appt()
      .leftJoin('a.doctor', 'd')
      .select('d.name', 'name')
      .addSelect('d.specialty', 'specialty')
      .addSelect('d.rating', 'rating')
      .addSelect('COUNT(*)', 'n')
      .groupBy('d.id')
      .addGroupBy('d.name')
      .addGroupBy('d.specialty')
      .addGroupBy('d.rating')
      .orderBy('n', 'DESC')
      .limit(5)
      .getRawMany(),
  ]);
  const newPatients = await AppDataSource.getRepository(User)
    .createQueryBuilder('u')
    .where("u.role = 'patient' AND u.created_at >= :since", { since })
    .getCount();
  const { alerts } = await visibleAlerts(req, Math.min(days, 90));
  const answered = alerts.filter((a) => a.handledAt);
  const avgResponseMin = answered.length
    ? Math.round(answered.reduce((t, a) => t + (new Date(a.handledAt!).getTime() - new Date(a.createdAt).getTime()), 0) / answered.length / 60000)
    : null;
  const n = (rows: any[]) => rows.map((r) => ({ ...r, n: Number(r.n) }));
  res.json({
    success: true,
    data: {
      days,
      bookingsPerDay: n(perDay),
      byType: n(byType),
      byStatus: n(byStatus),
      bySpecialty: n(bySpecialty),
      topDoctors: n(topDoctors).map((d) => ({ ...d, rating: d.rating != null ? Number(d.rating) : null })),
      newPatients,
      sos: { total: alerts.length, open: alerts.filter((a) => a.status === 'open').length, avgResponseMin },
    },
  });
});

export default router;
