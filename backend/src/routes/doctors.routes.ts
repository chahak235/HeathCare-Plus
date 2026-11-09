import { Router } from 'express';
import { DoctorsController } from '../controllers/doctors.controller';

const router = Router();
const controller = new DoctorsController();

// Specialties route - MUST come before /:id
router.get('/specialties', controller.getAllSpecialties.bind(controller));

// Get available doctors
router.get('/available', controller.getAvailableDoctors.bind(controller));

// Doctor profiles with no login account linked yet (used by the signup form)
router.get('/unclaimed', controller.getUnclaimedDoctors.bind(controller));

// Resolve the Doctor profile id for a logged-in user (users.id -> doctors.id)
router.get('/doctor-for-user/:userId', controller.getDoctorForUser.bind(controller));

// Doctor toggling their own "accepting patients" status
router.patch('/:id/availability', controller.updateAvailability.bind(controller));

// Get all doctors
router.get('/', controller.getAllDoctors.bind(controller));

// Get doctor by ID - this should be LAST
router.get('/:id', controller.getDoctorById.bind(controller));

export default router;
