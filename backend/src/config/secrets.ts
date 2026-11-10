/**
 * Secret used to sign login tokens (and Google connect links).
 *
 * In production a missing or placeholder JWT_SECRET would let anyone forge a
 * login, so the server refuses to start. In development a fixed fallback keeps
 * local setup simple.
 */
const PLACEHOLDERS = new Set(['', 'your-secret-key-change-this', 'your_jwt_secret', 'changeme']);

export function getJwtSecret(): string {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!PLACEHOLDERS.has(secret) && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a long random value (16+ characters) in production.');
  }
  return secret || 'your-secret-key-change-this';
}

/** Call once at startup so a bad production config fails fast, not on first login. */
export function assertProductionSecrets(): void {
  getJwtSecret();
}
