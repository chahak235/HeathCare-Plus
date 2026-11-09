# Architecture

## Overview

Healthcare+ is a monorepo with three main parts: a React frontend, a Node.js/Express backend, and a PostgreSQL database. The AI assistant is handled by Groq, a hosted model API, which the backend calls.

## Folder Structure
HealthCare-PLUS/
├── frontend/          # React + TypeScript application
│   ├── src/
│   │   ├── pages/     # Route-level components
│   │   ├── components/# Reusable UI components
│   │   ├── context/   # React context (auth, chat, theme)
│   │   └── api/       # API client functions
├── backend/           # Node.js + Express server
│   ├── routes/        # Express route handlers
│   ├── middleware/    # Auth, error handling
│   ├── db/            # Database queries
│   └── scripts/       # Migration and seed scripts
└── package.json       # Root workspace config

## Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant PostgreSQL
    participant Groq

    User->>Frontend: Searches hospitals in Mumbai
    Frontend->>Backend: GET /api/india/hospitals/city/Mumbai
    Backend->>PostgreSQL: SELECT * FROM indian_hospitals WHERE city = 'Mumbai'
    PostgreSQL-->>Backend: Hospital rows
    Backend-->>Frontend: JSON response
    Frontend-->>User: Renders map with markers

    User->>Frontend: Asks AI about headache
    Frontend->>Backend: POST /api/ai/chat
    Backend->>Groq: POST /openai/v1/chat/completions
    Groq-->>Backend: AI response text
    Backend-->>Frontend: Formatted response
    Frontend-->>User: Renders markdown response
```

## Key Design Decisions

**Why hosted AI instead of local Ollama?**
A deployed site can't reach Ollama on a user's machine through the backend, and most users won't install it. A hosted API works for everyone with no setup. The trade-off is that medical queries are sent to a third party, so the UI says so, and the key stays on the backend.

**Why PostgreSQL instead of MongoDB?**
Hospital and doctor data has clear relational structure. Foreign keys enforce data integrity between appointments, doctors, and hospitals. PostgreSQL also handles Indian address data (pincodes, states) cleanly.

**Why React + TypeScript?**
The codebase has 50+ components. TypeScript catches prop type errors at compile time rather than at runtime in production. The repo is 86.6% TypeScript.

**Why Leaflet instead of Google Maps?**
Leaflet with OpenStreetMap is free with no API key required. Google Maps charges per map load which would not scale.
