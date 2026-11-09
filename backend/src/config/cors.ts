import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001',
    'https://health-care-plus-kappa.vercel.app',
    'https://health-care-plus-iwmhcjc23-devenmundadas-projects.vercel.app',
    /\.vercel\.app$/,
  ],
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
