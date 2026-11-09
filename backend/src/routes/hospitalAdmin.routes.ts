import { Router } from 'express';
import { HospitalAdminController } from '../controllers/hospitalAdmin.controller';

const router = Router();
const controller = new HospitalAdminController();

router.get('/hospital-for-user/:userId', controller.getHospitalForUser.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));

export default router;
