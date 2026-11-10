import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { HospitalAdminController } from '../controllers/hospitalAdmin.controller';
import { AppDataSource } from '../config/database.config';
import { Hospital } from '../entities/Hospital.entity';
import { AuthRequest } from '../middleware/auth.middleware';

// PATCH is mounted behind a hospital/admin login (app.ts); a hospital account
// may only edit its own hospital.
async function ownHospital(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();
  const h = await AppDataSource.getRepository(Hospital).findOne({ where: { id: Number(req.params.id) }, select: ['id', 'userId'] as any });
  if (h && Number((h as any).userId) === Number(req.user?.id)) return next();
  return res.status(403).json({ success: false, error: 'You can only edit your own hospital' });
}

const router = Router();
const controller = new HospitalAdminController();

router.get('/hospital-for-user/:userId', controller.getHospitalForUser.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', ownHospital as any, controller.update.bind(controller));

export default router;
