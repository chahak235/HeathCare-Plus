import { Router } from 'express';
import { TriageController } from '../controllers/triage.controller';
import { socketService, notificationService } from '../services';

// Ensure services are initialized
if (!socketService || !notificationService) {
  console.warn('⚠️ Services not initialized yet. Triage routes may not work properly.');
}

const router = Router();
const controller = new TriageController(socketService, notificationService);

// Triage evaluation
router.post('/evaluate', controller.evaluateTriage.bind(controller));

// Get triage rules (for frontend reference)
router.get('/rules', controller.getTriageRules.bind(controller));

export default router;