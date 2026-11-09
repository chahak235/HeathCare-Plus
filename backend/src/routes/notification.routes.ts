import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { socketService } from '../websocket';

const router = Router();
const controller = new NotificationController(socketService);

// Send notifications
router.post('/emergency', controller.sendEmergency.bind(controller));
router.post('/bed-ready', controller.sendBedReady.bind(controller));

// Get notifications
router.get('/user/:userId', controller.getUserNotifications.bind(controller));
router.get('/status/:id', controller.getNotificationStatus.bind(controller));

// Update notifications
router.patch('/:id/read', controller.markAsRead.bind(controller));
router.post('/user/:userId/read-all', controller.markAllAsRead.bind(controller));

export default router;
