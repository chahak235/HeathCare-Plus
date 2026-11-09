/**
 * Patient API Routes
 */

import { Router } from 'express';
import { PatientAPIController } from '../controllers/patient-api.controller';

const router = Router();
const controller = new PatientAPIController();

// Public routes
router.post('/', controller.createPatient.bind(controller));
router.get('/', controller.getPatients.bind(controller));
router.get('/stats', controller.getPatientStats.bind(controller));
router.get('/search', controller.searchPatients.bind(controller));
router.get('/waiting/:resource', controller.getWaitingPatients.bind(controller));

// Patient specific routes
router.get('/:id', controller.getPatientById.bind(controller));
router.put('/:id', controller.updatePatient.bind(controller));
router.get('/:id/journey', controller.getPatientJourney.bind(controller));
router.post('/:id/transition', controller.transitionPatient.bind(controller));

export default router;
