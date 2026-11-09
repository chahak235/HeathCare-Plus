/**
 * Allocation Routes
 */

import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';

const router = Router();
const controller = new AllocationController();

// Find best bed for patient
router.post('/find-bed', controller.findBed.bind(controller));

// Reserve a bed
router.post('/reserve', controller.reserveBed.bind(controller));

// Release a reservation
router.post('/release', controller.releaseBed.bind(controller));

// Occupy a bed
router.post('/occupy', controller.occupyBed.bind(controller));

// Cleaning workflow
router.post('/clean/start', controller.startCleaning.bind(controller));
router.post('/clean/complete', controller.completeCleaning.bind(controller));

// Get metrics
router.get('/metrics', controller.getMetrics.bind(controller));

export default router;