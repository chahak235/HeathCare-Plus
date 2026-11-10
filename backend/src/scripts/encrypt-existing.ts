/**
 * Encrypt health fields that were saved before encryption at rest was added.
 *
 * Run ONCE, after DATA_ENCRYPTION_KEY is set both in backend/.env and on Render
 * (same value), from the backend folder:
 *
 *   npm run encrypt-existing
 *
 * Loading and re-saving each patient passes the values through the column
 * transformers, so plain values are stored encrypted. Already encrypted rows
 * are left as they are. Safe to run more than once.
 */
import 'dotenv/config';
import { AppDataSource } from '../config/database.config';
import { Patient } from '../entities/Patient.entity';
import { isEncrypted } from '../utils/field-crypto';

(async () => {
  if (!process.env.DATA_ENCRYPTION_KEY) {
    console.error('Set DATA_ENCRYPTION_KEY in backend/.env first.');
    process.exit(1);
  }
  await AppDataSource.initialize();
  const raw = await AppDataSource.query(
    'SELECT id, medical_notes, emergency_contacts, preferred_hospital, emergency_contact, allergies, chronic_conditions, current_medications FROM patients'
  );
  const plain = (v: unknown) =>
    v != null && (Array.isArray(v) ? v.some((x) => !isEncrypted(x)) : !(typeof v === 'string' && isEncrypted(v)) && !isEncrypted(v));
  const ids = raw
    .filter((r: any) =>
      [r.medical_notes, r.emergency_contacts, r.preferred_hospital, r.emergency_contact, r.allergies, r.chronic_conditions, r.current_medications].some(plain)
    )
    .map((r: any) => r.id);

  const repo = AppDataSource.getRepository(Patient);
  let done = 0;
  for (const id of ids) {
    const p = await repo.findOne({ where: { id } });
    if (!p) continue;
    await repo.save(p);
    done += 1;
  }
  console.log(`Encrypted ${done} of ${raw.length} patient records (${raw.length - ids.length} were already encrypted or empty).`);
  await AppDataSource.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
