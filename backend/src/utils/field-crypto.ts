import crypto from 'crypto';
import { ValueTransformer } from 'typeorm';

/**
 * Encryption at rest for sensitive health fields (AES-256-GCM).
 *
 * Values are stored as "enc:v1:<base64(iv | tag | ciphertext)>". Reading works
 * for both encrypted and older plain values, so existing rows keep working and
 * are encrypted the next time they are saved (or by `npm run encrypt-existing`).
 *
 * Key: DATA_ENCRYPTION_KEY = 32 random bytes as base64 (or 64 hex characters).
 * Every server that shares the database must use the SAME key. Without a key,
 * values are stored in plain text and a warning is logged once.
 */
const PREFIX = 'enc:v1:';
let warned = false;

function key(): Buffer | null {
  const raw = (process.env.DATA_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    if (!warned) {
      warned = true;
      console.warn('🔐 DATA_ENCRYPTION_KEY is not set: health fields are stored without encryption at rest.');
    }
    return null;
  }
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes (base64 or 64 hex characters).');
  return buf;
}

export function encryptString(plain: string): string {
  const k = key();
  if (!k) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

/** Returns the plain text, the value itself if it was never encrypted, or null if it cannot be decrypted. */
export function decryptString(stored: string): string | null {
  if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) return stored;
  const k = key();
  if (!k) return null;
  try {
    const buf = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    console.error('🔐 Could not decrypt a stored field (wrong DATA_ENCRYPTION_KEY?)');
    return null;
  }
}

export const isEncrypted = (v: unknown) => typeof v === 'string' && v.startsWith(PREFIX);

/** text column */
export const encryptedText: ValueTransformer = {
  to: (v: string | null | undefined) => (v == null || v === '' ? v : encryptString(v)),
  from: (v: string | null) => (v == null ? v : decryptString(v)),
};

/** text[] column: each item encrypted separately */
export const encryptedTextArray: ValueTransformer = {
  to: (v: string[] | null | undefined) => (Array.isArray(v) ? v.map((s) => encryptString(String(s))) : v),
  from: (v: string[] | null) => (Array.isArray(v) ? v.map((s) => decryptString(s)).filter((s): s is string => s !== null) : v),
};

/** jsonb column: the whole JSON value is stored as one encrypted JSON string */
export const encryptedJson: ValueTransformer = {
  to: (v: unknown) => (v == null ? v : key() ? encryptString(JSON.stringify(v)) : v),
  from: (v: unknown) => {
    if (!isEncrypted(v)) return v;
    const s = decryptString(v as string);
    if (s == null) return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  },
};
