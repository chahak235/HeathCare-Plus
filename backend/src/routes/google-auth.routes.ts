import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { AppDataSource } from '../config/database.config';
import { Doctor } from '../entities/Doctor.entity';
import { authenticate } from '../middleware/auth.middleware';
import { ownDoctorParam } from '../middleware/appointment-access';
import { getJwtSecret } from '../config/secrets';

const router = Router();
const calendarService = new GoogleCalendarService();

// Frontend URL to redirect back to after connect succeeds/fails.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// The doctor's id travels through Google's `state` param so the callback knows
// which doctor to save the refresh token against. It is signed and expires, so
// nobody can attach their own Google account to another doctor's profile.
const STATE_TTL_MS = 10 * 60 * 1000;
const stateKey = () => getJwtSecret();

function signState(doctorId: number): string {
  const body = `${doctorId}.${Date.now() + STATE_TTL_MS}`;
  const sig = crypto.createHmac('sha256', stateKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readState(state: string): number | null {
  const [id, exp, sig] = state.split('.');
  if (!id || !exp || !sig) return null;
  const expected = crypto.createHmac('sha256', stateKey()).update(`${id}.${exp}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(exp)) return null;
  const doctorId = parseInt(id, 10);
  return Number.isFinite(doctorId) ? doctorId : null;
}

// Step 1: the logged-in doctor asks for a Google consent link for their own profile.
router.get('/connect-url/:doctorId', authenticate as any, ownDoctorParam as any, (req: Request, res: Response) => {
  const doctorId = parseInt(req.params.doctorId, 10);
  res.json({ success: true, url: calendarService.getAuthUrl(signState(doctorId)) });
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

    const doctorId = readState(state);
    if (doctorId === null) {
      return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=error`);
    }
    const doctorRepo = AppDataSource.getRepository(Doctor);
    await doctorRepo.update({ id: doctorId }, { googleRefreshToken: tokens.refresh_token });

    return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${FRONTEND_URL}/doctor-dashboard?calendar=error`);
  }
});

export default router;
