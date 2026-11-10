import { NextFunction, Response } from 'express';
import { AuthRequest, authenticate, authorize } from './auth.middleware';

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

/** Logged-in clinical staff only: doctors, hospital accounts, admins. */
export const clinicalStaff: Mw = chain(authenticate as Mw, authorize('doctor', 'hospital', 'admin') as Mw);

/** Logged-in hospital accounts and admins only. */
export const hospitalStaff: Mw = chain(authenticate as Mw, authorize('hospital', 'admin') as Mw);

/** Anyone may read (GET); changes need a hospital or admin login. */
export const readPublicWriteHospital: Mw = (req, res, next) =>
  req.method === 'GET' || req.method === 'HEAD' ? next() : hospitalStaff(req, res, next);

/** Any logged-in user. */
export const loggedIn: Mw = authenticate as Mw;
