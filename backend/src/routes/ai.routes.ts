import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';

const router = Router();
const controller = new AIController();

router.get('/status', controller.getStatus.bind(controller));
router.post('/chat', controller.chat.bind(controller));
router.post('/analyze', controller.analyzeSymptoms.bind(controller));
router.post('/analyze-image', controller.analyzeImage.bind(controller));

export default router;
