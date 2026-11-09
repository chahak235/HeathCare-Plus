import { Request, Response } from 'express';
import { OllamaService } from '../services/ollama.service';
import { NotificationService } from '../services/notification.service';
import { SocketService } from '../services/socket.service';
import { TriageInput } from '../types/ai.types';

export class TriageController {
  private ollamaService: OllamaService;
  private notificationService: NotificationService;
  private socketService: SocketService;

  constructor(socketService: SocketService, notificationService: NotificationService) {
    this.ollamaService = new OllamaService();
    this.socketService = socketService;
    this.notificationService = notificationService;
  }

  async evaluateTriage(req: Request, res: Response) {
    try {
      const input: TriageInput = req.body;
      
      // Validate input
      if (!input.symptoms || !input.vitals || !input.context) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: symptoms, vitals, context'
        });
      }

      // Get AI analysis
      const result = await this.ollamaService.analyzeSymptoms(input);

      // If critical (P1), send emergency notifications
      if (result.priority === 1) {
        await this.handleCriticalCase(input, result);
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Triage evaluation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  private async handleCriticalCase(input: TriageInput, result: any) {
    // Send alert via WebSocket
    this.socketService.sendEmergencyAlert({
      alertId: `alert-${Date.now()}`,
      type: 'P1',
      patientId: 'pending', // Will be assigned after registration
      patientName: 'Unknown',
      location: 'Triage',
      message: result.primaryConcern,
      requiredSpecialty: result.suggestedSpecialty,
      timestamp: new Date(),
      acknowledgedBy: []
    });

    // Notify on-call doctors (in production, get actual doctor list)
    const onCallDoctors = ['doc-001', 'doc-002', 'doc-003']; // This would come from a service
    for (const doctorId of onCallDoctors) {
      await this.notificationService.sendEmergencyNotification(
        doctorId,
        'doctor',
        'Critical Patient',
        1,
        0,
        'Triage',
        'On-call doctor'
      );
    }

    console.log('🚨 Critical case alert sent to command center');
  }

  async getTriageRules(req: Request, res: Response) {
    try {
      const { TRIAGE_RULES } = await import('../types/ai.types');
      return res.json({
        success: true,
        data: TRIAGE_RULES
      });
    } catch (error) {
      console.error('❌ Get triage rules error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
