/**
 * Give an existing account admin rights (admins approve doctor and hospital
 * accounts and see every hospital's bookings). Sign up normally first, then:
 *
 *   npm run make-admin -- you@example.com
 */
import 'dotenv/config';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User.entity';

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- you@example.com');
    process.exit(1);
  }
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const user: any = await repo.createQueryBuilder('u').where('LOWER(u.email) = :email', { email }).getOne();
  if (!user) {
    console.error(`No account with email ${email}. Sign up on the website first.`);
    process.exit(1);
  }
  user.role = 'admin';
  user.isVerified = true;
  await repo.save(user);
  console.log(`${email} is now an admin. Log out and log in again to use it.`);
  await AppDataSource.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
