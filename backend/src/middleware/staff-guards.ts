import { NextFunction, Response } from 'express';
import { AuthRequest, authenticate, authorize } from './auth.middleware';
import { isTrustedStaff } from '../utils/account-status';

/**
 * Route-level guards for the hospital-operations APIs (patients, beds,
 * allocation, hospital profile, notifications). Mounted in app.ts.
 */

type Mw = (req: AuthRequest, res: Response, next: NextFunction) => unknown;

/** Run several middlewares in order. */
const chain = (...mws: Mw[]): Mw => (req, res, next) => {
  let i = 0;
  const step = (err?: unknown) => {
    if (err) return next(err);
    const mw = mws[i++];
    if (!mw) return next();
    return mw(req, res, step as NextFunction);
  };
  return step();
};

/** Doctor and hospital accounts must be approved by an admin first. */
const approved: Mw = (req, res, next) => {
  isTrustedStaff(req.user)
    .then((ok) => (ok ? next() : res.status(403).json({ success: false, error: 'Your account is waiting for approval by HealthCare+.' })))
    .catch(next);
};

/** Logged-in, approved clinical staff only: doctors, hospital accounts, admins. */
export const clinicalStaff: Mw = chain(authenticate as Mw, authorize('doctor', 'hospital', 'admin') as Mw, approved);

/** Logged-in, approved hospital accounts and admins only. */
export const hospitalStaff: Mw = chain(authenticate as Mw, authorize('hospital', 'admin') as Mw, approved);

/** Admins only (account approval). */
export const adminOnly: Mw = chain(authenticate as Mw, authorize('admin') as Mw);

/** Anyone may read (GET); changes need a hospital or admin login. */
export const readPublicWriteHospital: Mw = (req, res, next) =>
  req.method === 'GET' || req.method === 'HEAD' ? next() : hospitalStaff(req, res, next);

/** Any logged-in user. */
export const loggedIn: Mw = authenticate as Mw;
