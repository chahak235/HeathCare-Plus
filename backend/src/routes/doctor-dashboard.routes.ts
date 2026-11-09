import { Router } from 'express';
import { DoctorDashboardController } from '../controllers/doctor-dashboard.controller';

const router = Router();
const controller = new DoctorDashboardController();

// Get doctor details
router.get('/:doctorId', controller.getDoctorDetails.bind(controller));

// Get doctor's assigned patients
router.get('/:doctorId/patients', controller.getAssignedPatients.bind(controller));

// Get doctor's today's schedule
router.get('/:doctorId/schedule/today', controller.getTodaySchedule.bind(controller));

// Assign patient to doctor
router.post('/patients/:patientId/assign', controller.assignPatient.bind(controller));

export default router;
