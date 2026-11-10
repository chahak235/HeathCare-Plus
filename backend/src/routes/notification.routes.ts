import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { socketService } from '../websocket';
import { hospitalStaff } from '../middleware/staff-guards';
import { ownUserParam } from '../middleware/appointment-access';

// The whole router is mounted behind a login (app.ts).

const router = Router();
const controller = new NotificationController(socketService);

// Send notifications
router.post('/emergency', hospitalStaff as any, controller.sendEmergency.bind(controller));
router.post('/bed-ready', hospitalStaff as any, controller.sendBedReady.bind(controller));

// Get notifications
router.get('/user/:userId', ownUserParam as any, controller.getUserNotifications.bind(controller));
router.get('/status/:id', controller.getNotificationStatus.bind(controller));

// Update notifications
router.patch('/:id/read', controller.markAsRead.bind(controller));
router.post('/user/:userId/read-all', ownUserParam as any, controller.markAllAsRead.bind(controller));

export default router;
