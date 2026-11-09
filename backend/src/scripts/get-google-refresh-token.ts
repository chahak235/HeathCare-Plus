/**
 * One-time setup: connect the clinic's Google account so the backend can put
 * appointments on Google Calendar and create Google Meet links.
 *
 * 1. In Google Cloud Console, create an OAuth client (type "Web application")
 *    and add this redirect URI: http://localhost:3005/oauth2callback
 * 2. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env
 * 3. Run: npm run google-auth
 * 4. Open the printed link, sign in with the clinic's Google account, allow access
 * 5. Copy the printed GOOGLE_PLATFORM_REFRESH_TOKEN line into backend/.env
 */
import 'dotenv/config';
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
  scope: ['https://www.googleapis.com/auth/calendar.events'],
});

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
      console.log('\nAdd this line to backend/.env (keep it secret):\n');
      console.log(`GOOGLE_PLATFORM_REFRESH_TOKEN=${tokens.refresh_token}\n`);
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
