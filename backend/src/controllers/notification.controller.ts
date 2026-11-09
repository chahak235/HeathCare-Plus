import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { SocketService } from '../services/socket.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(socketService: SocketService) {
    this.notificationService = new NotificationService(socketService);
  }

  async sendEmergency(req: Request, res: Response) {
    try {
      const { userId, userType, patientName, priority, eta, bedNumber, doctorName } = req.body;

      if (!userId || !userType || !patientName || !priority) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const result = await this.notificationService.sendEmergencyNotification(
        userId,
        userType,
        patientName,
        priority,
        eta,
        bedNumber,
        doctorName
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Send emergency error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async sendBedReady(req: Request, res: Response) {
    try {
      const { userId, userType, patientName, bedNumber, ward, floor } = req.body;

      if (!userId || !userType || !patientName || !bedNumber) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const result = await this.notificationService.sendBedReadyNotification(
        userId,
        userType,
        patientName,
        bedNumber,
        ward,
        floor
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Send bed ready error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit ? parseInt(limit as string) : 50
      );

      return res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.notificationService.markAsRead(id);

      return res.json({
        success: result,
        message: result ? 'Notification marked as read' : 'Notification not found'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const count = await this.notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        data: { count },
        message: `${count} notifications marked as read`
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getNotificationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await this.notificationService.getNotificationStatus(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      return res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Get notification status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
