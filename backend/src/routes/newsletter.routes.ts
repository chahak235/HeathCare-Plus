import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { NewsletterSubscriber } from '../entities/NewsletterSubscriber.entity';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }

    const repo = AppDataSource.getRepository(NewsletterSubscriber);
    const existing = await repo.findOne({ where: { email } });
    if (existing) {
      return res.json({ success: true, message: 'Already subscribed' });
    }

    await repo.save(repo.create({ email }));
    return res.status(201).json({ success: true, message: 'Subscribed' });
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
