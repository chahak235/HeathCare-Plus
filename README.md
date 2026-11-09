# Healthcare+

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen)](https://health-care-plus-kappa.vercel.app)

> AI-powered healthcare platform connecting patients to real Indian hospitals, doctors, and medical guidance — with a local AI assistant that runs entirely on your device.

[![TypeScript](https://img.shields.io/badge/TypeScript-86%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What This Is

Healthcare+ is a full-stack web application built to address a real problem: most healthcare platforms in India either use mock data or are designed for Western healthcare systems.

This platform uses real Indian hospital and doctor data, a hosted AI assistant, and an interactive map for finding hospitals by city.

**Current status:** Active development. Core features working. Appointment booking and health metrics dashboard in progress.

---

## Features

### Working Now

- **Hospital Locator** — Search real Indian hospitals by city. Results include bed count, emergency availability, Ayushman Bharat status, phone numbers, and map coordinates.
- **Interactive Map** — Leaflet + OpenStreetMap renders hospital markers with real coordinates across India.
- **AI Chat Assistant** — Powered by Groq. Answers medical questions with Indian healthcare context. Messages are sent to Groq to generate replies.
- **Doctor Directory** — 15+ verified Indian specialists with qualifications, consultation fees, languages spoken, and hospital affiliations.
- **Authentication** — JWT-based login and registration with bcrypt password hashing.
- **Dark/Light Mode** — System-level theme support via Tailwind CSS.

### In Progress

- Appointment booking end-to-end flow
- Health metrics dashboard with personal tracking
- Emergency one-click response with location sharing

---

## Architecture

```mermaid
flowchart TD
    A[Browser - React + TypeScript] --> B[Express Backend - Node.js]

    B --> D[PostgreSQL]
    B --> C[Groq - Hosted AI]

    D --> F[indian_hospitals]
    D --> G[doctors]
    D --> H[users]
    D --> I[appointments]
    D --> J[health_metrics]
    D --> K[chat_history]
```

The frontend talks to the Express backend for all data, including AI. The backend calls Groq, so chat messages and uploaded images are sent to Groq. The API key stays on the server.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI framework with type safety |
| Styling | Tailwind CSS | Utility-first, dark mode built in |
| Routing | React Router v6 | Client-side navigation |
| Maps | Leaflet + OpenStreetMap | Free maps, works in India |
| Icons | Lucide React | Consistent icon set |
| Backend | Node.js + Express | REST API server |
| Database | PostgreSQL 15 | Primary data store |
| Auth | JWT + bcrypt | Authentication |
| AI | Groq | Hosted language and vision models |
| Build | Vite | Frontend bundler |

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- A Groq API key (for AI features): https://console.groq.com/keys

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/devenmundada/HealthCare-PLUS.git
cd HealthCare-PLUS

# 2. Install all dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials, JWT secret and GROQ_API_KEY

# 4. Set up the database
cd backend
node scripts/migrate.js
node scripts/seed.js

# 5. Start everything
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Frontend runs at http://localhost:5173
Backend runs at http://localhost:3001

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/india/hospitals/city/:city` | No | Hospitals by city |
| GET | `/api/india/hospitals/search` | No | Search hospitals |
| GET | `/api/doctors` | No | List doctors with filters |
| GET | `/api/doctors/specialties` | No | All specialties |
| POST | `/api/ai/chat` | No | Send message to AI |
| GET | `/api/ai/status` | No | Check if the AI service is configured |
| POST | `/api/health/metrics` | Yes | Save health metric |
| GET | `/api/health/metrics` | Yes | Get user metrics |
| POST | `/api/appointments` | Yes | Book appointment |
| GET | `/api/appointments/user` | Yes | Get user appointments |

Full details in [docs/api-reference.md](docs/api-reference.md)

---

## Database Schema

9 tables: `users`, `health_profiles`, `indian_hospitals`, `doctors`, `appointments`, `health_metrics`, `notifications`, `chat_history`, `weather_cache`

Full schema in [docs/database.md](docs/database.md)

---

## AI Integration

The AI assistant uses models hosted on Groq. When the user sends a message:

1. Frontend sends message to the backend
2. Backend adds the medical system prompt and calls Groq
3. Response is returned with Indian healthcare context

If the AI is unavailable, the chat shows saved general guidance, clearly labelled as not being an AI answer.

**Privacy:** medical queries are sensitive, and chat messages and uploaded images are sent to Groq. The UI tells users this. Review Groq's data retention terms before handling real patient data.

Full details in [docs/ai-integration.md](docs/ai-integration.md)

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full plan. Short version:

- **Next:** Complete appointment booking, health metrics dashboard, emergency response
- **3 months:** Telemedicine video calls, digital health records, medicine delivery integration
- **6 months:** Medical image analysis (X-ray, skin conditions), multi-language support (Hindi, Tamil, Telugu), voice interface
- **12 months:** Mobile app (React Native), 500+ hospitals, 500+ doctors

---

## Documentation

| File | Contents |
|------|----------|
| [docs/architecture.md](docs/architecture.md) | System design and component breakdown |
| [docs/api-reference.md](docs/api-reference.md) | All endpoints with request/response examples |
| [docs/database.md](docs/database.md) | Full PostgreSQL schema |
| [docs/ai-integration.md](docs/ai-integration.md) | Ollama setup and prompt engineering |
| [docs/security.md](docs/security.md) | Auth, encryption, and data privacy |
| [docs/deployment.md](docs/deployment.md) | Production deployment guide |
| [docs/roadmap.md](docs/roadmap.md) | Feature roadmap by phase |

---

## Author

**Deven Mundada**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/devenmundada)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/devenmundada)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Live Links

| | URL |
|--|-----|
| **Frontend** | https://health-care-plus-kappa.vercel.app |
| **Backend API** | https://healthcare-backend-tylz.onrender.com |
| **API Docs** | https://healthcare-backend-tylz.onrender.com/api-docs |
