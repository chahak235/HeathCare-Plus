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

## Status

| # | Task | Status |
|---|------|--------|
| 0 | Groq AI fixes, honest AI labels, git repo set up | Done |
| 1 | X-ray model in browser, image analyzer with only X-ray and Skin | Done. Model at `frontend/public/models/xray_pneumonia.onnx`, code in `frontend/src/services/xray-model-service.ts`. Tested in browser with a synthetic image only; try a real chest X-ray |
| 2 | Appointments: full calendar, doctor slots, online vs offline booking, video consult goes to online booking | Done. Month calendar for 90 days (`BookingCalendar.tsx`), In-clinic and Online tabs, slots in India time with past slots hidden (`backend/src/utils/schedule.ts`, 15 tests pass). Doctors set days and hours in the doctor dashboard settings |
| 3 | Google Meet, Google Calendar and email to patient and doctor on booking | Done in code, needs your Google and email settings to work for real. Booking is confirmed instantly, a Google Calendar event (with Meet for online) invites both people, and both get an email with a calendar file. See `backend/.env.example` and run `npm run google-auth` once |
| 4 | Voice mental health analyzer (record or upload, report), matched to the site theme | Not started |
| 5 | Worldwide hospital map: search any state or city, all hospitals, contacts, Google Maps directions | Not started |
| 6 | Emergency: patient profile (contacts, height, weight, conditions), emergency button calls hospital and family | Not started |
| 7 | Run everything locally and test | Not started |

## Next step

Task 4: voice mental health analyzer (record or upload, voice features, Groq transcript and report), restyled to match the site.

To add the skin model later: convert it to ONNX the same way, put it in `frontend/public/models/`, and set `skinModelReady` in `frontend/src/pages/ImageAnalysis.tsx`.

## Things you need to provide later

- `GROQ_API_KEY` for chat, voice report and image AI
- Google Cloud OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) for Meet and Calendar
- Email account for sending mail (`SMTP_USER`, `SMTP_PASS`, for example a Gmail app password)
- PostgreSQL password in `backend/.env`
- Skin condition model from your friend
- GitHub repo URL when you want to push

## Known issues found in the original code

- Almost no API route requires login. Anyone can book, cancel or change doctor availability
- Database uses `synchronize: true` in production
- Doctors page shows randomly generated phone numbers
- Google Calendar connect route has no login check
