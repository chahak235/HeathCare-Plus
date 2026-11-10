import { CorsOptions } from 'cors';

/**
 * Which websites may call this API from a browser.
 *
 * FRONTEND_URL holds the live site address; extra addresses (a custom domain,
 * a Vercel preview) can be added comma-separated in CORS_ORIGINS. Local dev
 * addresses are always allowed outside production.
 */
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'];

export function allowedOrigins(): string[] {
  const fromEnv = [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
    .map((o) => (o || '').trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const list = process.env.NODE_ENV === 'production' ? fromEnv : [...DEV_ORIGINS, ...fromEnv];
  return Array.from(new Set(list));
}

export const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    // Same-origin requests, curl and server-to-server calls send no Origin header
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins().includes(origin.replace(/\/+$/, '')));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-2FA-Token',
  ],
  exposedHeaders: ['X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
};
