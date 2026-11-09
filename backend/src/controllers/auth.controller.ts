import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const result = await authService.signup(req.body);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Signup controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      
      if (!result.success) {
        return res.status(401).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Login controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      // @ts-ignore - user added by auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const result = await authService.getCurrentUser(userId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
