/**
 * Set every doctor's rating, review count and "patients seen" from real data:
 *   rating / review count  = published reviews in the `reviews` table
 *   patients seen          = different patients with a completed appointment
 * A doctor with no reviews gets no rating (the site shows "New").
 *
 * Replaces the invented numbers the original sample data came with.
 * Safe to run any time:  npm run recount-doctor-stats
 */
import 'dotenv/config';
import { AppDataSource } from '../config/database.config';

(async () => {
  await AppDataSource.initialize();
  const rows = await AppDataSource.query(`
    UPDATE doctors d SET
      rating = r.avg,
      review_count = COALESCE(r.n, 0),
      patient_count = COALESCE(a.n, 0)
    FROM doctors d2
    LEFT JOIN (
      SELECT doctor_id, ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*)::int AS n
      FROM reviews WHERE is_published = true GROUP BY doctor_id
    ) r ON r.doctor_id = d2.id
    LEFT JOIN (
      SELECT doctor_id, COUNT(DISTINCT patient_id)::int AS n
      FROM appointments WHERE status = 'completed' GROUP BY doctor_id
    ) a ON a.doctor_id = d2.id
    WHERE d.id = d2.id
    RETURNING d.id, d.name, d.rating, d.review_count, d.patient_count
  `);
  const list = Array.isArray(rows[0]) ? rows[0] : rows;
  for (const d of list) {
    console.log(`${d.name}: ${d.rating ? `${d.rating} ★ from ${d.review_count} review(s)` : 'no reviews yet'}, ${d.patient_count} patient(s) seen`);
  }
  console.log(`Updated ${list.length} doctors.`);
  await AppDataSource.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
