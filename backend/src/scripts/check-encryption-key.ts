/**
 * Check that this machine's DATA_ENCRYPTION_KEY can read the encrypted health
 * fields in the database (i.e. it matches the key used by the live server).
 * Prints no secrets.  Usage: npm run check-key
 */
import 'dotenv/config';
import { Client } from 'pg';
import { decryptString } from '../utils/field-crypto';

(async () => {
  const raw = process.env.DATA_ENCRYPTION_KEY || '';
  console.log(`Local key: ${raw.length} characters, ${Buffer.from(raw.trim(), 'base64').length} bytes when decoded${/["']/.test(raw) ? ', CONTAINS QUOTES' : ''}`);
  const db = new Client({ connectionString: (process.env.DATABASE_URL || '').replace(/[?&]channel_binding=require/, ''), ssl: { rejectUnauthorized: false } });
  await db.connect();
  const rows = (await db.query("SELECT id, medical_notes, updated_at FROM patients WHERE medical_notes LIKE 'enc:v1:%' ORDER BY updated_at DESC")).rows;
  if (!rows.length) console.log('No encrypted notes in the database yet.');
  for (const r of rows) {
    console.log(`Patient ${r.id} (updated ${new Date(r.updated_at).toISOString()}): ${decryptString(r.medical_notes) !== null ? 'readable with this key' : 'NOT readable with this key'}`);
  }
  await db.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
