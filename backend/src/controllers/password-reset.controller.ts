import { Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User.entity';
import { EmailService } from '../services/email.service';
import { normaliseEmail, passwordProblem, recordLoginSuccess } from '../middleware/login-guard';

/**
 * Forgot password:
 *   POST /api/auth/forgot-password { email }  → always the same answer (no hint whether the account exists)
 *   POST /api/auth/reset-password  { token, password }
 *
 * The emailed link carries a random token; only its SHA-256 hash is stored,
 * it works once, and it expires after 30 minutes.
 */
const TOKEN_TTL_MS = 30 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MAX_PER_EMAIL_HOUR = 3;
const MAX_PER_IP_HOUR = 10;

const emailService = new EmailService();
const requests = new Map<string, number[]>();
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const siteUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** True if this key made fewer than `max` requests in the last hour (and records this one). */
function allow(key: string, max: number) {
  const t = Date.now();
  const recent = (requests.get(key) || []).filter((x) => t - x < HOUR);
  if (recent.length >= max) return false;
  recent.push(t);
  requests.set(key, recent);
  return true;
}
setInterval(() => {
  const t = Date.now();
  for (const [k, v] of requests) if (v.every((x) => t - x > HOUR)) requests.delete(k);
}, HOUR).unref();

const GENERIC = 'If an account exists for that email, we have sent a link to reset the password. It works for 30 minutes.';

async function sendResetEmail(user: User, token: string) {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a">
    <h2 style="color:#0284c7">Reset your HealthCare+ password</h2>
    <p>Hi ${esc(user.name || 'there')},</p>
    <p>Someone (hopefully you) asked to reset the password for this account.</p>
    <p><a href="${link}" style="display:inline-block;background:#0284c7;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
    <p style="font-size:13px;color:#475569">The link works once, for 30 minutes. If you did not ask for this, ignore this email: your password stays the same.</p>
  </body></html>`;
  await emailService.sendEmail({ to: user.email, subject: 'Reset your HealthCare+ password', html } as any);
}

async function sendChangedEmail(user: User) {
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a">
    <h2 style="color:#0284c7">Your password was changed</h2>
    <p>Hi ${esc(user.name || 'there')}, the password for your HealthCare+ account was just changed.</p>
    <p>If this was not you, reset it again now at <a href="${siteUrl()}/forgot-password">${siteUrl()}/forgot-password</a> and reply to this email.</p>
  </body></html>`;
  await emailService.sendEmail({ to: user.email, subject: 'Your HealthCare+ password was changed', html } as any);
}

export class PasswordResetController {
  async forgot(req: Request, res: Response) {
    const email = normaliseEmail(req.body?.email);
    const ip = (req.ip || 'unknown').slice(0, 64);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!allow(`ip:${ip}`, MAX_PER_IP_HOUR) || !allow(`email:${email}`, MAX_PER_EMAIL_HOUR)) {
      return res.status(429).json({ success: false, error: 'Too many reset requests. Please try again in an hour.' });
    }
    // Answer straight away and do the work afterwards, so the response time
    // does not reveal whether the account exists
    res.json({ success: true, message: GENERIC });

    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.createQueryBuilder('u').where('LOWER(u.email) = :email', { email }).getOne();
      if (!user) return;
      const token = randomBytes(32).toString('base64url');
      // Database clock for the expiry, so it is right whatever time zone the server runs in
      await repo
        .createQueryBuilder()
        .update(User)
        .set({ resetToken: hash(token), resetTokenExpires: () => `NOW() + INTERVAL '${TOKEN_TTL_MS / 60000} minutes'` } as any)
        .where('id = :id', { id: user.id })
        .execute();
      await sendResetEmail(user, token);
    } catch (err: any) {
      console.error('Password reset email failed:', err?.message);
    }
  }

  async reset(req: Request, res: Response) {
    const token = String(req.body?.token || '');
    const password = req.body?.password;
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
      return res.status(400).json({ success: false, error: 'This reset link is not valid. Please ask for a new one.' });
    }
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ success: false, error: problem });

    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo
        .createQueryBuilder('u')
        .where('u.reset_token = :h AND u.reset_token_expires > NOW()', { h: hash(token) })
        .getOne();
      if (!user) {
        return res.status(400).json({ success: false, error: 'This reset link has expired or was already used. Please ask for a new one.' });
      }
      if (await bcrypt.compare(String(password), user.password)) {
        return res.status(400).json({ success: false, error: 'Please choose a password different from your old one.' });
      }
      await repo.update(user.id, { password: await bcrypt.hash(String(password), 10), resetToken: null, resetTokenExpires: null } as any);
      recordLoginSuccess(normaliseEmail(user.email)); // lift any wrong-password lockout
      sendChangedEmail(user).catch((err) => console.error('Password changed email failed:', err?.message));
      return res.json({ success: true, message: 'Your password has been changed. You can log in now.' });
    } catch (err: any) {
      console.error('Password reset failed:', err?.message);
      return res.status(500).json({ success: false, error: 'Could not change the password. Please try again.' });
    }
  }
}
