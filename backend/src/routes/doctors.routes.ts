import { Router } from 'express';
import { DoctorsController } from '../controllers/doctors.controller';
import { authenticate } from '../middleware/auth.middleware';
import { ownUserParam, ownDoctorParam } from '../middleware/appointment-access';

const router = Router();
const controller = new DoctorsController();

// Specialties route - MUST come before /:id
router.get('/specialties', controller.getAllSpecialties.bind(controller));

// Get available doctors
router.get('/available', controller.getAvailableDoctors.bind(controller));

// Doctor profiles with no login account linked yet (used by the signup form)
router.get('/unclaimed', controller.getUnclaimedDoctors.bind(controller));

// Resolve the Doctor profile id for a logged-in user (users.id -> doctors.id)
router.get('/doctor-for-user/:userId', authenticate as any, ownUserParam as any, controller.getDoctorForUser.bind(controller));

// Doctor toggling their own "accepting patients" status
// Only the doctor themself (or hospital staff) may change their days and hours
router.patch('/:id/availability', authenticate as any, ownDoctorParam as any, controller.updateAvailability.bind(controller));

// Get all doctors
router.get('/', controller.getAllDoctors.bind(controller));

// Get doctor by ID - this should be LAST
router.get('/:id', controller.getDoctorById.bind(controller));

export default router;
