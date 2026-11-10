import { Router, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Review } from '../entities/Review.entity';
import { Appointment } from '../entities/Appointment.entity';
import { Patient } from '../entities/Patient.entity';
import { Doctor } from '../entities/Doctor.entity';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { hospitalStaff } from '../middleware/staff-guards';

/**
 * Real patient reviews. A review can only be written by the patient of an
 * appointment that has already happened, once per appointment, and it updates
 * the doctor's rating from the actual reviews.
 */
const router = Router();
const repo = () => AppDataSource.getRepository(Review);

/** "Chahak Anchliya" -> "Chahak A." */
const displayName = (full?: string | null) => {
  const parts = String(full || 'Patient').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

const publicShape = (r: Review & { doctorName?: string; doctorSpecialty?: string }) => ({
  id: r.id,
  doctorId: r.doctorId,
  doctorName: r.doctorName,
  doctorSpecialty: r.doctorSpecialty,
  name: r.displayName,
  rating: r.rating,
  comment: r.comment,
  createdAt: r.createdAt,
});

async function refreshDoctorRating(doctorId: number) {
  const row = await repo()
    .createQueryBuilder('r')
    .select('AVG(r.rating)', 'avg')
    .addSelect('COUNT(*)', 'n')
    .where('r.doctor_id = :doctorId AND r.is_published = true', { doctorId })
    .getRawOne();
  const n = Number(row?.n || 0);
  if (n > 0) {
    await AppDataSource.getRepository(Doctor).update({ id: doctorId }, { rating: Number(Number(row.avg).toFixed(2)), reviewCount: n } as any);
  }
}

async function withDoctors(list: Review[]) {
  const ids = [...new Set(list.map((r) => r.doctorId))];
  const doctors = ids.length ? await AppDataSource.getRepository(Doctor).findByIds(ids) : [];
  const byId = new Map(doctors.map((d: any) => [d.id, d]));
  return list.map((r) => publicShape({ ...r, doctorName: byId.get(r.doctorId)?.name, doctorSpecialty: byId.get(r.doctorId)?.specialty } as any));
}

// Public: published reviews, newest first; ?doctorId= to filter, ?featured=1 for 4-5 stars with a comment
router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const qb = repo().createQueryBuilder('r').where('r.is_published = true').orderBy('r.created_at', 'DESC').take(limit);
  if (req.query.doctorId) qb.andWhere('r.doctor_id = :d', { d: Number(req.query.doctorId) });
  if (req.query.featured) qb.andWhere("r.rating >= 4 AND r.comment IS NOT NULL AND r.comment <> ''");
  const list = await qb.getMany();
  res.json({ success: true, data: await withDoctors(list) });
});

// Patient: which of my appointments can I still review?
router.get('/mine', authenticate as any, async (req: AuthRequest, res: Response) => {
  const patient = await AppDataSource.getRepository(Patient).findOne({ where: { userId: Number(req.user?.id) } });
  if (!patient) return res.json({ success: true, data: { reviewed: [], reviews: [] } });
  const reviews = await repo().find({ where: { patientId: patient.id } });
  res.json({ success: true, data: { reviewed: reviews.map((r) => r.appointmentId), reviews: reviews.map((r) => publicShape(r as any)) } });
});

// Patient: review a past appointment
router.post('/', authenticate as any, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'patient') return res.status(403).json({ success: false, error: 'Only patients can write reviews.' });
  const appointmentId = Number(req.body?.appointmentId);
  const rating = Math.round(Number(req.body?.rating));
  const comment = String(req.body?.comment || '').trim().slice(0, 600) || null;
  if (!Number.isFinite(appointmentId)) return res.status(400).json({ success: false, error: 'appointmentId is required.' });
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ success: false, error: 'Rating must be 1 to 5 stars.' });

  const patient = await AppDataSource.getRepository(Patient).findOne({ where: { userId: Number(req.user.id) }, relations: ['user'] });
  const appt = await AppDataSource.getRepository(Appointment).findOne({ where: { id: appointmentId } });
  if (!patient || !appt || Number(appt.patientId) !== patient.id) {
    return res.status(403).json({ success: false, error: 'You can only review your own appointments.' });
  }
  if (appt.status === 'cancelled') return res.status(400).json({ success: false, error: 'Cancelled appointments cannot be reviewed.' });
  if (new Date(appt.scheduledTime).getTime() > Date.now()) {
    return res.status(400).json({ success: false, error: 'You can review this visit after it has taken place.' });
  }
  if (await repo().findOne({ where: { appointmentId } })) {
    return res.status(409).json({ success: false, error: 'You have already reviewed this appointment.' });
  }

  const saved = await repo().save(
    repo().create({ appointmentId, doctorId: Number(appt.doctorId), patientId: patient.id, displayName: displayName(patient.user?.name), rating, comment })
  );
  await refreshDoctorRating(saved.doctorId);
  res.status(201).json({ success: true, data: publicShape(saved as any) });
});

// Hospital/admin: hide or show a review (abusive or contains personal details)
router.patch('/:id', hospitalStaff as any, async (req: AuthRequest, res: Response) => {
  const review = await repo().findOne({ where: { id: Number(req.params.id) } });
  if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
  review.isPublished = !!req.body?.isPublished;
  await repo().save(review);
  await refreshDoctorRating(review.doctorId);
  res.json({ success: true, data: { id: review.id, isPublished: review.isPublished } });
});

export default router;
