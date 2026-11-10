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

export default router;
