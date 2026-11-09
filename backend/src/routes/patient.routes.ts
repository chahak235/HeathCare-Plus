/**
 * Patient Routes
 */

import { Router } from 'express';
import { PatientStateController } from '../controllers/patient-state.controller';

const router = Router();
const controller = new PatientStateController();

// Get all patients (with optional status filter)
router.get('/', controller.getPatients.bind(controller));

// Get patient metrics
router.get('/metrics', controller.getMetrics.bind(controller));

// Get patients waiting for specific resource
router.get('/waiting/:resource', controller.getWaitingPatients.bind(controller));

// Get patient by ID
router.get('/:id', controller.getPatient.bind(controller));

// Get patient journey
router.get('/:id/journey', controller.getPatientJourney.bind(controller));

// Get transition history
router.get('/:id/transitions', controller.getTransitionHistory.bind(controller));

// Transition patient
router.post('/:id/transition', controller.transitionPatient.bind(controller));

// Generate discharge summary
router.post('/:id/discharge-summary', controller.generateDischargeSummary.bind(controller));

export default router;