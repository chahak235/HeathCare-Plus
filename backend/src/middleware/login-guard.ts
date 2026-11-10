/**
 * Brute-force protection for login: after 5 wrong passwords for the same email
 * (from any address) or 20 from the same IP within 15 minutes, further attempts
 * are refused for 15 minutes. Kept in memory (one server); resets on restart.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

type Entry = { count: number; first: number; lockedUntil?: number };
const byEmail = new Map<string, Entry>();
const byIp = new Map<string, Entry>();

const now = () => Date.now();

function bump(map: Map<string, Entry>, key: string, max: number) {
  const t = now();
  const e = map.get(key);
  if (!e || t - e.first > WINDOW_MS) {
    map.set(key, { count: 1, first: t });
    return;
  }
  e.count += 1;
  if (e.count >= max) e.lockedUntil = t + WINDOW_MS;
}

function lockedFor(map: Map<string, Entry>, key: string): number {
  const e = map.get(key);
  if (!e?.lockedUntil) return 0;
  const left = e.lockedUntil - now();
  if (left <= 0) {
    map.delete(key);
    return 0;
  }
  return left;
}

export const normaliseEmail = (email: unknown) => String(email || '').trim().toLowerCase();

/** Milliseconds until this email/IP may try again (0 = allowed). */
export function loginBlockedFor(email: string, ip: string): number {
  return Math.max(lockedFor(byEmail, email), lockedFor(byIp, ip));
}

export function recordLoginFailure(email: string, ip: string) {
  if (email) bump(byEmail, email, MAX_PER_EMAIL);
  bump(byIp, ip, MAX_PER_IP);
}

export function recordLoginSuccess(email: string) {
  byEmail.delete(email);
}

// Drop stale entries every 30 minutes so the maps cannot grow without limit
setInterval(() => {
  const t = now();
  for (const map of [byEmail, byIp]) {
    for (const [k, e] of map) if (t - e.first > WINDOW_MS && (!e.lockedUntil || e.lockedUntil < t)) map.delete(k);
  }
}, 30 * 60 * 1000).unref();

/** Password rule for new accounts: 8+ characters with at least one letter and one number. */
export function passwordProblem(pw: unknown): string | null {
  const s = String(pw || '');
  if (s.length < 8) return 'Password must be at least 8 characters.';
  if (s.length > 128) return 'Password must be at most 128 characters.';
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return 'Password must contain at least one letter and one number.';
  return null;
}
