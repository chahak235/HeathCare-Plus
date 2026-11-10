import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.config';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import { Appointment } from '../entities/Appointment.entity';
import { AuthRequest } from './auth.middleware';
import { isApprovedAccount } from '../utils/account-status';

/**
 * Ownership checks for appointment and doctor routes (run after `authenticate`).
 *
 * - Admins, and hospital accounts approved by an admin, may act on any record.
 * - Doctor accounts need admin approval before they can see patients' data.
 * - A patient may only see and book for their own Patient row.
 * - A doctor may only see their own schedule and change their own settings;
 *   doctors may read patient records (they need them for consultations).
 * - Either side of an appointment may update it (cancel, confirm, add a link).
 */
const STAFF = new Set(['hospital', 'admin']);

const deny = (res: Response, msg = 'You do not have access to this record') =>
  res.status(403).json({ success: false, error: msg });

const isStaff = async (req: AuthRequest) =>
  req.user?.role === 'admin' || (STAFF.has(req.user?.role) && (await isApprovedAccount(Number(req.user?.id))));
const isApprovedDoctor = async (req: AuthRequest) => req.user?.role === 'doctor' && (await isApprovedAccount(Number(req.user?.id)));
const userId = (req: AuthRequest) => Number(req.user?.id);

async function patientOwnedBy(patientId: number, uid: number): Promise<boolean> {
  if (!Number.isFinite(patientId)) return false;
  const p = await AppDataSource.getRepository(Patient).findOne({ where: { id: patientId }, select: ['id', 'userId'] });
  return !!p && Number(p.userId) === uid;
}

async function doctorOwnedBy(doctorId: number, uid: number): Promise<boolean> {
  if (!Number.isFinite(doctorId)) return false;
  const d = await AppDataSource.getRepository(Doctor).findOne({ where: { id: doctorId }, select: ['id', 'userId'] });
  return !!d && d.userId != null && Number(d.userId) === uid;
}

const wrap =
  (check: (req: AuthRequest) => Promise<boolean | string>) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Please log in' });
      if (await isStaff(req)) return next();
      const ok = await check(req);
      if (ok === true) return next();
      return deny(res, typeof ok === 'string' ? ok : undefined);
    } catch (err) {
      console.error('Access check failed:', err);
      return res.status(500).json({ success: false, error: 'Access check failed' });
    }
  };

/** :userId must be the logged-in user. */
export const ownUserParam = wrap(async (req) => Number(req.params.userId) === userId(req));

/** :patientId must be the logged-in patient's own row (doctors may read). */
export const patientParamReadable = wrap(async (req) => {
  if (await isApprovedDoctor(req)) return true;
  return patientOwnedBy(Number(req.params.patientId), userId(req));
});

/** :doctorId (or :id on doctor routes) must belong to the logged-in doctor. */
export const ownDoctorParam = wrap(async (req) => {
  if (!(await doctorOwnedBy(Number(req.params.doctorId ?? req.params.id), userId(req)))) return false;
  return (await isApprovedAccount(userId(req))) || 'Your doctor account is waiting for approval by HealthCare+.';
});

/** Booking body: patients book only for themselves. */
export const canBookForBodyPatient = wrap(async (req) => {
  if (req.user?.role !== 'patient') return 'Only patients can book appointments';
  return (await patientOwnedBy(Number(req.body?.patientId), userId(req))) || 'You can only book for your own account';
});

/** :id appointment: its patient or its doctor may change it. */
export const partyToAppointment = wrap(async (req) => {
  const appt = await AppDataSource.getRepository(Appointment).findOne({
    where: { id: Number(req.params.id) },
    select: ['id', 'patientId', 'doctorId'],
  });
  if (!appt) return 'Appointment not found';
  const uid = userId(req);
  if (await patientOwnedBy(Number(appt.patientId), uid)) return true;
  return (await doctorOwnedBy(Number(appt.doctorId), uid)) && (await isApprovedAccount(uid));
});

/** Staff and doctors only (e.g. the clinic-wide upcoming list). */
export const doctorOrStaff = wrap(async (req) => isApprovedDoctor(req));
