import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User.entity';

/**
 * Whether a doctor or hospital account has been approved by an admin.
 * Cached for 60 seconds so permission checks do not hit the database on
 * every request; approving an account clears its cache entry.
 */
const cache = new Map<number, { verified: boolean; at: number }>();
const TTL_MS = 60_000;

export async function isApprovedAccount(userId: number): Promise<boolean> {
  if (!Number.isFinite(userId)) return false;
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.verified;
  const u = await AppDataSource.getRepository(User).findOne({ where: { id: userId }, select: ['id', 'isVerified'] as any });
  const verified = !!u?.isVerified;
  cache.set(userId, { verified, at: Date.now() });
  return verified;
}

export function forgetAccountStatus(userId: number) {
  cache.delete(userId);
}

/** Admins always; hospital and doctor accounts once approved. */
export async function isTrustedStaff(user: { id?: number; role?: string } | undefined): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'hospital' || user.role === 'doctor') return isApprovedAccount(Number(user.id));
  return false;
}
