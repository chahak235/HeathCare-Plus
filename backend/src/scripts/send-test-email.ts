/**
 * Send one test email with the current email settings, to check delivery.
 * Usage: npm run test-email -- someone@example.com   (defaults to SMTP_USER)
 * Set EMAIL_TRANSPORT=gmail-api to test the Gmail API path used on Render.
 */
import 'dotenv/config';
import { EmailService } from '../services/email.service';

const to = process.argv[2] || process.env.SMTP_USER;

(async () => {
  if (!to) {
    console.error('Give a recipient: npm run test-email -- you@example.com');
    process.exit(1);
  }
  const result = await new EmailService().sendEmail({
    to,
    subject: 'HealthCare+ test email',
    html: `<p>Test email from HealthCare+ (${process.env.EMAIL_TRANSPORT || 'smtp'}).</p>`,
  } as any);
  console.log(result.success ? `Sent to ${to}` : 'Sending failed (see the error above)');
  process.exit(result.success ? 0 : 1);
})();
