import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.config';
import { AccessLog } from '../entities/AccessLog.entity';
import { getJwtSecret } from '../config/secrets';

/**
 * Records every request that reads or changes health records (audit trail).
 * Mounted in app.ts in front of the emergency, appointment and patient routers.
 * The entry is written after the response is sent and never blocks or breaks it.
 */
export const accessLog = (area: string) => (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    // Only requests about people's records (not public slot/availability lookups)
    if (area === 'appointments' && /^\/(slots|availability|default-hospital)\b/.test(req.path)) return;

    let user: { id?: number; role?: string } = (req as any).user || {};
    if (!user.id) {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          user = jwt.verify(token, getJwtSecret()) as any;
        } catch {
          /* invalid token: logged as anonymous */
        }
      }
    }
    const pid = Number((req.params as any)?.patientId ?? req.path.match(/\/patient(?:-profile)?\/(\d+)/)?.[1]);
    const verb = req.method === 'GET' ? 'view' : req.method === 'DELETE' ? 'delete' : 'change';
    const entry: Partial<AccessLog> = {
      userId: user.id ? Number(user.id) : null,
      userRole: user.role || null,
      action: `${verb}_${area}`,
      patientId: Number.isFinite(pid) ? pid : null,
      path: req.originalUrl.split('?')[0].slice(0, 200),
      method: req.method,
      statusCode: res.statusCode,
      ip: (req.ip || '').slice(0, 64) || null,
    };
    if (!AppDataSource.isInitialized) return;
    AppDataSource.getRepository(AccessLog)
      .insert(entry)
      .catch((err) => console.error('Access log write failed:', err?.message));
  });
  next();
};
