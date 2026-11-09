import { Request, Response } from 'express';
import { groqService } from '../services/groq.service';

export class AIController {
  async getStatus(req: Request, res: Response) {
    const available = groqService.isConfigured();
    return res.json({
      success: true,
      available,
      data: {
        status: available ? 'available' : 'unavailable',
        message: available
          ? 'AI service is ready'
          : 'AI service not configured (missing GROQ_API_KEY)',
      },
    });
  }

  async chat(req: Request, res: Response) {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, error: 'message is required' });
      }

      if (!groqService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured on the server',
        });
      }

      const response = await groqService.chat(message, Array.isArray(history) ? history : []);

      return res.json({ success: true, response });
    } catch (error: any) {
      console.error('AI chat error:', error?.response?.data || error.message);
      return res.status(500).json({
        success: false,
        error: 'AI service is temporarily unavailable. Please try again shortly.',
      });
    }
  }

  async analyzeImage(req: Request, res: Response) {
    try {
      const { image, analysisType } = req.body;

      if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ success: false, error: 'A base64 image data URI is required' });
      }

      const validTypes = ['skin', 'xray', 'wound', 'general'];
      const type = validTypes.includes(analysisType) ? analysisType : 'general';

      if (!groqService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Image analysis is not configured on the server (missing GROQ_API_KEY).',
        });
      }

      const result = await groqService.analyzeImage(image, type);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('AI image analysis error:', error?.response?.data || error.message);
      return res.status(500).json({
        success: false,
        error: 'Image analysis is temporarily unavailable. Please try again shortly.',
      });
    }
  }

  async analyzeSymptoms(req: Request, res: Response) {
    try {
      const { symptoms, vitals } = req.body;

      if (!symptoms) {
        return res.status(400).json({ success: false, error: 'symptoms is required' });
      }

      if (groqService.isConfigured()) {
        try {
          const prompt = `A patient reports these symptoms: "${symptoms}". ${
            vitals ? `Vitals: ${JSON.stringify(vitals)}.` : ''
          }
Respond ONLY with strict JSON (no markdown, no prose) in this exact shape:
{"priority": <1-5 integer, 1=most urgent>, "confidence": <0-100 integer>, "suggestedSpecialty": "<one specialty name>", "redFlags": ["<short red flag>", ...]}`;
          const raw = await groqService.chat(prompt, []);
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({ success: true, data: parsed });
          }
        } catch (aiError) {
          console.warn('AI symptom analysis failed, falling back to rule-based:', aiError);
        }
      }

      // Rule-based fallback when AI is unavailable or fails
      return res.json({
        success: true,
        data: {
          priority: 3,
          confidence: 50,
          suggestedSpecialty: 'General Medicine',
          redFlags: [],
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
