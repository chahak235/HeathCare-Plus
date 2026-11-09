import { Router, Request, Response } from 'express';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { AppDataSource } from '../config/database.config';
import { Doctor } from '../entities/Doctor.entity';

const router = Router();
const calendarService = new GoogleCalendarService();

// Frontend URL to redirect back to after connect succeeds/fails.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Step 1: doctor clicks "Connect Google Calendar" -> here -> Google consent screen.
// The doctor's id travels through Google's `state` param so the callback knows
// which doctor to save the refresh token against.
router.get('/connect/:doctorId', (req: Request, res: Response) => {
  const { doctorId } = req.params;
  if (!doctorId || isNaN(parseInt(doctorId))) {
    return res.status(400).send('Invalid doctor id');
  }
  const url = calendarService.getAuthUrl(doctorId);
  res.redirect(url);
});

// Step 2: Google redirects back here with a one-time code + our state (doctorId).
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=error`);
  }
  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    return res.status(400).send('Missing code or state');
  }

  try {
    const tokens = await calendarService.getTokensFromCode(code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token the first time a user consents.
      // If the doctor already connected before and is reconnecting, Google may
      // omit it — ask them to revoke access at myaccount.google.com and retry.
      return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=no_refresh_token`);
    }

    const doctorRepo = AppDataSource.getRepository(Doctor);
    const doctorId = parseInt(state);
    await doctorRepo.update({ id: doctorId }, { googleRefreshToken: tokens.refresh_token });

    return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=error`);
  }
});

export default router;
