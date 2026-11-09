# Deployment

## Vercel (Frontend)

The frontend is a standard Vite + React app and deploys to Vercel with zero config.

1. Go to https://vercel.com and import the GitHub repo
2. Set the root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url`

## Backend

The backend needs a server that can run Node.js and PostgreSQL. Options:

- Railway (easiest — deploys Node + Postgres together)
- Render
- AWS EC2

### Environment Variables (backend/.env)
DATABASE_URL=postgresql://user:password@host:5432/healthcare_db
JWT_SECRET=your-secret-key-here
PORT=3001
GROQ_API_KEY=your-groq-api-key

### Database Setup on Server

```bash
# Run migrations
node scripts/migrate.js

# Seed with Indian hospital and doctor data
node scripts/seed.js
```

## AI in Production

The backend calls Groq, so production needs `GROQ_API_KEY` set in the host's environment variables. Without it, `/api/ai/status` reports the AI as unavailable and the chat shows labelled saved guidance instead. See [ai-integration.md](ai-integration.md).
