/**
 * One-time setup: connect the clinic's Google account so the backend can put
 * appointments on Google Calendar and create Google Meet links.
 *
 * 1. In Google Cloud Console, create an OAuth client of type "Desktop app"
 *    (Desktop clients accept any http://localhost port, so no redirect URI is needed).
 *    A "Web application" client also works if you add http://localhost:3005/oauth2callback.
 * 2. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env
 * 3. Run: npm run google-auth
 * 4. Open the printed link, sign in with the clinic's Google account, allow access
 * 5. The refresh token is written to backend/.env as GOOGLE_PLATFORM_REFRESH_TOKEN
 *    (it is never printed). Pass --print to print it instead, e.g. for Render.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { google } from 'googleapis';

const PORT = 3005;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env first.');
  process.exit(1);
}

const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT);
const url = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  // calendar.events: create Meet + invites. gmail.send: send booking/alert emails over
  // HTTPS on hosts that block SMTP (EMAIL_TRANSPORT=gmail-api).
  scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/gmail.send'],
});

/** Set KEY=value in backend/.env, replacing an existing KEY line or appending one. */
function saveToEnv(key: string, value: string) {
  const envPath = path.resolve(__dirname, '../../.env');
  const text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  const next = re.test(text) ? text.replace(re, () => line) : `${text.replace(/\s*$/, '')}\n${line}\n`;
  fs.writeFileSync(envPath, next);
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', REDIRECT);
  if (reqUrl.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }
  const code = reqUrl.searchParams.get('code');
  if (!code) {
    res.writeHead(400).end('No code received. Close this tab and try again.');
    return;
  }
  try {
    const { tokens } = await client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Connected. You can close this tab and go back to the terminal.');
    if (!tokens.refresh_token) {
      console.error('\nGoogle did not return a refresh token. Remove the app at https://myaccount.google.com/permissions and run this again.');
    } else {
      if (process.argv.includes('--print')) {
        console.log('\nAdd this line to backend/.env (keep it secret):\n');
        console.log(`GOOGLE_PLATFORM_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      } else {
        saveToEnv('GOOGLE_PLATFORM_REFRESH_TOKEN', tokens.refresh_token);
        console.log('\nSaved GOOGLE_PLATFORM_REFRESH_TOKEN to backend/.env. Restart the backend to use it.');
      }
    }
  } catch (err) {
    res.writeHead(500).end('Failed to get tokens. See the terminal.');
    console.error('Failed to exchange the code:', err);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('Open this link in your browser and sign in with the clinic Google account:\n');
  console.log(url + '\n');
});
