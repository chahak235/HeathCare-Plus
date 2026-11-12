# HealthCare+ Build Progress

This file tracks the product build so work can resume at any time. To continue, type **continue** in Claude Code.

Code is pushed to https://github.com/chahak235/HeathCare-Plus (`main`) in small commits of 2-3 files. Pushing to `main` redeploys the website (Vercel) and the API (Render).

## How to run locally

Two terminals:

```bash
cd backend && npm run start:ts      # http://localhost:3001
cd frontend && npm run dev          # http://localhost:3000
```

`frontend/.env.local` points the frontend at the local backend. Backend settings go in `backend/.env` (copy `backend/.env.example`).

## Decisions

| Area | Decision |
|------|----------|
| Chat AI | Groq hosted API (`GROQ_API_KEY`) |
| X-ray model | Your EfficientNet-B0 pneumonia model, converted to ONNX, runs in the browser |
| Skin model | Coming later from your friend. The analyzer shows it as "coming soon" |
| Emergency | Free: tap-to-call plus email/SMS links. No Twilio |
| Voice analyzer | Speech transcript, voice features and AI report. Labelled as a wellbeing screening, not a diagnosis |
| Database | Neon free hosted PostgreSQL (Singapore). Connection string in `backend/.env` as `DATABASE_URL` (not in git). Same string goes into Render later |

## Status

| # | Task | Status |
|---|------|--------|
| 0 | Groq AI fixes, honest AI labels, git repo set up | Done |
| 1 | X-ray model in browser, image analyzer with only X-ray and Skin | Done. Model at `frontend/public/models/xray_pneumonia.onnx`, code in `frontend/src/services/xray-model-service.ts`. Tested in browser with a synthetic image only; try a real chest X-ray |
| 2 | Appointments: full calendar, doctor slots, online vs offline booking, video consult goes to online booking | Done. Month calendar for 90 days (`BookingCalendar.tsx`), In-clinic and Online tabs, slots in India time with past slots hidden (`backend/src/utils/schedule.ts`, 15 tests pass). Doctors set days and hours in the doctor dashboard settings |
| 3 | Google Meet, Google Calendar and email to patient and doctor on booking | Done in code, needs your Google and email settings to work for real. Booking is confirmed instantly, a Google Calendar event (with Meet for online) invites both people, and both get an email with a calendar file. See `backend/.env.example` and run `npm run google-auth` once |
| 4 | Voice mental health analyzer (record or upload, report), matched to the site theme | Done. Browser measures pace, pauses, pitch, loudness (`voice-features.ts`, checked with a test tone). Backend transcribes with Groq Whisper and writes the report (`backend/src/routes/voice.routes.ts`). Crisis wording shows Tele-MANAS 14416. Needs `GROQ_API_KEY`. Hume AI removed |
| 5 | Worldwide hospital map: search any state or city, all hospitals, contacts, Google Maps directions | Done. Free OpenStreetMap search (`frontend/src/services/hospital-finder.ts`, page `MapPrediction.tsx`). Tested: 791 hospitals in Pune. Limits: free servers can take 20 to 60 s; only about 4% of hospitals have a phone number in OpenStreetMap (Google Maps link shows the rest). Fake hospitals removed. Later: cache results on the backend to make it faster |
| 6 | Emergency: patient profile (contacts, height, weight, conditions), emergency button calls hospital and family | Done, not tested with a logged-in user (needs the database). New `/emergency` page: Call 112, SOS finds nearest hospital, call and text buttons for nearest hospital, usual hospital and family, automatic email to family with location and health details. Health profile form on `/profile` (patients are sent there after sign-up). Backend `backend/src/routes/emergency.routes.ts` (login required). Navbar emergency link fixed (was a broken `tel:911`) |
| 8 | Connect Neon database | Done. Backend connects to Neon, created the tables and added 15 doctors plus hospitals and beds. Checked: `/api/doctors` returns 15, the availability calendar works, the booking window shows the doctor calendar |
| 9 | Groq AI key and business email | Done. `GROQ_API_KEY` set; tested AI chat reply and a full voice report (spoken clip → Whisper transcript → AI report with scores). Business Gmail `healthcareplus.care@gmail.com` set as `SMTP_USER` and `EMAIL_FROM`; Gmail App Password added; real email tested (sent to the business inbox via smtp.gmail.com:587) |
| 10 | Google Meet + Calendar live | Done. Google Cloud project "HealthCare Plus" (`versatile-art-514316-e7`) under healthcareplus.care@gmail.com: Calendar API on, consent screen in Testing mode (test user: healthcareplus.care@gmail.com), Desktop OAuth client. `npm run google-auth` now saves `GOOGLE_PLATFORM_REFRESH_TOKEN` into `backend/.env` itself (never printed; `--print` for Render). Tested a real online booking: confirmed, Meet link created, calendar invite and emails to patient and doctor. Test data: Dr. Rajesh Kumar (id 1) email = healthcareplus.care+doctor@gmail.com; test patient healthcareplus.care+patient@gmail.com (password in `backend/.env` as TEST_PATIENT_PASSWORD) |
| 11 | Fixes from your testing + cleanup + security | Done. Chat bubble shows short formatted answers in site colors; Features opens the real X-ray analyzer; X-ray results crash fixed; SOS siren + vibration; removed fake success stories, random clinic numbers, fake success rates and fake profile activity; profile shows real bookings and BMI; navbar no longer overflows on laptops. Security: bookings, patient data, doctor schedules/settings now need login and ownership (`backend/src/middleware/appointment-access.ts`, 16 checks pass); Google Calendar connect uses a signed 10-minute link |
| 12 | Security + cleanup round 2 | Done. Patient records, bed changes, bed allocation, hospital edits and staff notifications need the right login (`backend/src/middleware/staff-guards.ts`, mounted in `app.ts`); 29 access checks pass. Production: server refuses to start without a strong `JWT_SECRET` (`backend/src/config/secrets.ts`); table auto-sync is off when `NODE_ENV=production` (set `DB_SYNCHRONIZE=true` once to apply schema changes). Removed 21 unused packages (Ollama, Redis, Bull, MySQL, Firebase, AWS SDK and others; 223 installed packages fewer) |
| 13 | Deployment ready | Done. `render.yaml` (Render Blueprint, Singapore, free plan, health check `/health`), production `backend/Dockerfile`, CORS allows only `FRONTEND_URL`/`CORS_ORIGINS` (old author's Vercel sites and all `*.vercel.app` removed), website no longer falls back to the old author's server. Compiled production build tested against Neon. Guide: `docs/deployment.md` |
| 14 | LIVE | Done. Website https://heathcareplus.vercel.app (Vercel, `VITE_API_URL` = Render URL + `/api`, type Config). API https://healthcare-plus-api-qpj5.onrender.com (Render, Docker, Singapore, free). Render free plan blocks SMTP, so email goes through the Gmail API (`EMAIL_TRANSPORT=gmail-api`; Gmail API enabled; refresh token has calendar.events + gmail.send). Live check: online booking confirmed in 3.3 s with Meet link, calendar invite and emails to patient and doctor |
| 15 | Launch checklist (code part) | Done. Privacy Policy `/privacy` and Terms `/terms` (plain language, match what the code does, DPDP Act 2023), linked from footer and sign-up. Removed false claims: HIPAA compliant, end-to-end encryption, fake awards (Forbes, TechCrunch), fake contact (US 555 phone, Boston address). GitHub Actions pings the API every 10 min (`.github/workflows/keep-api-awake.yml`). Page title, description, sharing tags, robots.txt, sitemap.xml, site icon. Have a lawyer review the policies before real patients |
| 16 | Skin model, security, reviews, admin dashboard | Done (needs your steps below). Skin: ConvNeXt-XL (23 conditions, 80.7% top-1 / 94.1% top-3) is too big for the browser or Render, so it runs as its own service `skin-model-service/` (ready for a free Hugging Face Space); API `POST /api/skin/analyze`; analyzer shows Skin when `SKIN_MODEL_URL` is reachable. Tested locally: ~6 s per photo. Security: health fields encrypted at rest with AES-256-GCM (`utils/field-crypto.ts`, key `DATA_ENCRYPTION_KEY`, same value everywhere; `npm run encrypt-existing` once after Render has the key); login lockout after 5 wrong passwords (15 min); password rule (8+ chars, letter and number); `trust proxy`; audit log of every health-record view/change (`access_logs` table, shown in dashboard); closed a hole where anyone could sign up as admin/doctor/hospital and read patients' data: admin sign-up blocked, doctor/hospital accounts need admin approval (`npm run make-admin -- email`). Reviews: real reviews only, after a past appointment, one per visit (`reviews` table); Home shows them when there are any; Profile has Rate this visit; doctors' rating comes from real reviews. Admin/hospital dashboard: Appointments tab (real bookings, mark done/cancel), Reviews & Access Log tab, account approvals (admin). 16 + 29 checks pass |
| 17 | Dashboard with real data only | Done. SOS presses are now saved (`emergency_alerts` table, location encrypted) and shown in a new **SOS Alerts** tab: hospitals see alerts within 50 km (or naming them as nearest), admins see all; call the patient, open the location, Acknowledge / Resolved; refreshes every 30 s, red banner when one is open. **Analytics** tab is real: bookings per day, in-clinic vs video, status, specialty, most-booked doctors, new patients, SOS count and average response time, CSV export. Removed the sample triage queue, ambulance tracking and patient-journey screens. 10 API checks pass |
| 18 | Doctor schedules | Done. Doctors can set different hours per weekday, lunch breaks (`09:00-13:00, 14:00-18:00`) and days off (holidays/leave) in Settings; booking calendar respects them. `npm test` works again (ts-jest) with 10 schedule tests; 11 API checks pass |
| 19 | Faster hospital map | Done. `/api/hospital-search` caches OpenStreetMap results in the database for everyone (7 days per city, 1 day "near me"). Pune: 45 s first time, 1.5 s after. If the API fails, the browser searches directly as before |
| 20 | Honest doctor numbers + cleanup | Doctors without reviews show "New" (was an assumed 4.5). `npm run recount-doctor-stats` sets ratings/patient counts from real reviews and completed visits (run on 12 Nov: all 15 now show "New"; Dr. Rajesh Kumar 1 patient seen). Removed 79 unused frontend files and 6 packages (frontend type errors 43 → 0), and the old JavaScript server copy in `backend/` (incl. scripts that created demo logins). `npm run start:ts` now starts the real server |
| 21 | Forgot password | Done. "Forgot password?" on the login page (it used to open a missing page) emails a one-time link (only its hash is stored, 30 minutes, max 3 requests per email per hour); same answer whether or not the account exists; new password follows the sign-up rule; a "password changed" email follows. Pages `/forgot-password` and `/reset-password`. 14 checks pass locally; live request creates the link. Limit: other devices stay logged in until their 7-day session ends. Uses the same Google email token as bookings, so it also needs the Google app published |
| 22 | SOS text to family | Done (free). After SOS: **Text all family** opens the phone's messages with every family number and the message (name, needs help, map link, blood group) ready; **Send on WhatsApp** opens WhatsApp's share screen with the same text. Patient presses Send. SOS now always alerts nearby hospitals, even when no family email is saved. Later option: automatic SMS via Fast2SMS/MSG91/Twilio (needs DLT registration) |
| 7 | Run everything locally and test | Done without a database. Frontend production build passes, backend type-checks, 25 automated tests pass (15 scheduling, 10 AI routes). Checked in the browser: X-ray model, voice page, hospital finder, emergency page, Video Consultation opens Online booking. Not tested yet: anything needing the database or keys (doctor list, booking, emails, Meet, saving the health profile, voice report) |

## Docs

- `docs/system-architecture.html`: low-level architecture and data-flow diagram (open in any browser). Update it when components or flows change.

## Reminder

- **Google app published (12 Nov 2026).** Branding filled in (home, privacy, terms, domain `heathcareplus.vercel.app`), status "In production" (unverified: people connecting see a "Google hasn't verified this app" warning and click Advanced → Continue; fine for up to 100 accounts). New key made with `npm run google-auth` and put on Render; live test: online booking confirmed in 2.9 s with Meet link. Keys no longer expire after 7 days.

- **Skin model: on hold.** Ready for Google Cloud Run (see `skin-model-service/README.md`); then set `SKIN_MODEL_URL` and `SKIN_SERVICE_KEY` on Render.
- **Sample beds (12 Nov: kept for now):** the 200 beds in Bed Management are seed data attached to real hospital names, so occupancy and "free emergency beds" figures are not real. Staff-only. Clear them when real hospitals add their own beds.
- **Connect Google Calendar removed (12 Nov):** bookings already arrive in the doctor's calendar as invites from the business account.
- **Sample doctors (12 Nov: you chose to keep them for now; revisit before real patients):** the 15 seeded doctors are invented but listed at real hospitals (AIIMS, NIMHANS, CMC Vellore, Apollo…) with made-up phone numbers, and can be booked. Hide or replace them with real doctors.
- **Make your admin account:** sign up on the site, then `npm run make-admin -- your@email` in `backend`. Test admin: `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` in `backend/.env`.
- **Not done on purpose:** "HIPAA compliant", "end-to-end encryption", invented awards and generated testimonials stay off the site; they would be false claims. Real safeguards and real reviews were built instead.

## Next steps (in order)

1. **Email**: done (real Gmail SMTP works).
2. **Test end to end**: sign up as a patient, fill the health profile, book an online and an offline appointment, try SOS, try the voice analyzer, and try a real chest X-ray.
3. **Email**: add `SMTP_USER` / `SMTP_PASS` (Gmail App Password) so confirmations reach real inboxes.
4. **Google Meet and Calendar**: done, app published (no 7-day expiry).
5. **Product website polish**: business branding, landing page copy, pricing or contact page (needs your business details). Demo content already removed.
6. **Doctor mode**: done (per-day hours, breaks, days off).
7. **Hospital/admin mode**: done (real SOS alerts, bookings, analytics, reviews, access log, account approvals). Beds come from the hospital's own bed records.
8. **Security before launch**: done for all routes that change or expose data. On Render set `NODE_ENV=production` and a long random `JWT_SECRET`; set `DB_SYNCHRONIZE=true` only for the deploy that adds new columns, then remove it.
9. **Skin model**: received; on hold until Google Cloud Run is set up (`skin-model-service/README.md`).
10. **Deploy**: done (see task 14). Pushing to `main` redeploys both automatically. Before real patients: publish the Google consent screen (or the Google token expires every 7 days), consider Render's paid plan to avoid the 30-60 s wake-up.

## Things you need to provide later

- When real doctors join: hide or replace the 15 sample doctors
- Google Cloud billing + bucket for the skin model (when you want it live)

## Known issues found in the original code

- None open from the original list. The 3D dashboard is removed. Still in the backend: in-memory demo patients in `PatientAPIService` (`/api/patients-api`, staff only, not used by the website) and two old tests skipped in `npm test`.

