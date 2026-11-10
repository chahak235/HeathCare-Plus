# HealthCare+ Build Progress

This file tracks the product build so work can resume at any time. To continue, type **continue** in Claude Code.

Everything stays **local only**. Nothing is pushed to GitHub.

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
| 9 | Groq AI key and business email | Done. `GROQ_API_KEY` set; tested AI chat reply and a full voice report (spoken clip → Whisper transcript → AI report with scores). Business Gmail `healthcareplus.care@gmail.com` set as `SMTP_USER` and `EMAIL_FROM`; emails still go to the Ethereal test inbox until `SMTP_PASS` (Gmail App Password) is added |
| 7 | Run everything locally and test | Done without a database. Frontend production build passes, backend type-checks, 25 automated tests pass (15 scheduling, 10 AI routes). Checked in the browser: X-ray model, voice page, hospital finder, emergency page, Video Consultation opens Online booking. Not tested yet: anything needing the database or keys (doctor list, booking, emails, Meet, saving the health profile, voice report) |

## Docs

- `docs/system-architecture.html`: low-level architecture and data-flow diagram (open in any browser). Update it when components or flows change.

## Next steps (in order)

1. **Gmail App Password** for healthcareplus.care@gmail.com: turn on 2-Step Verification, create an app password, put it in `SMTP_PASS` in `backend/.env`.
2. **Test end to end**: sign up as a patient, fill the health profile, book an online and an offline appointment, try SOS, try the voice analyzer, and try a real chest X-ray.
3. **Email**: add `SMTP_USER` / `SMTP_PASS` (Gmail App Password) so confirmations reach real inboxes.
4. **Google Meet and Calendar**: sign in as healthcareplus.care@gmail.com in the browser pane, create the Google Cloud project, enable Calendar API, consent screen (add test users), Desktop OAuth client, then run `npm run google-auth` in `backend`.
5. **Product website polish**: business branding, landing page copy, pricing or contact page, remove leftover demo content (random success stories, random clinic phone numbers on the Doctors page).
6. **Doctor mode**: doctor sign-up already lets doctors set days and hours in the dashboard settings. Could add per-day hours and holidays.
7. **Hospital/admin mode**: review the hospital dashboard (beds, doctors) for real data.
8. **Security before launch**: add login checks to appointment and doctor routes, turn off `synchronize: true` in production, protect the Google connect route.
9. **Skin model**: when your friend sends it, convert to ONNX and enable it (see task 1 note).
10. **Deploy**: add the new environment variables on Render, then push to your GitHub repo when you're ready.

To add the skin model later: convert it to ONNX the same way, put it in `frontend/public/models/`, and set `skinModelReady` in `frontend/src/pages/ImageAnalysis.tsx`.

## Things you need to provide later

- Google Cloud OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) for Meet and Calendar
- Gmail App Password for healthcareplus.care@gmail.com (`SMTP_PASS`)
- Skin condition model from your friend
- GitHub repo URL when you want to push

## Known issues found in the original code

- Almost no API route requires login. Anyone can book, cancel or change doctor availability
- Database uses `synchronize: true` in production
- Doctors page shows randomly generated phone numbers
- Google Calendar connect route has no login check
