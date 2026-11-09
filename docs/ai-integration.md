# AI Integration

## Overview

The AI features run on [Groq](https://console.groq.com), a hosted model API. The browser calls our backend, and the backend calls Groq, so the API key stays on the server.

| Feature | Endpoint | Default model | Override |
|---------|----------|---------------|----------|
| Chat and symptom analysis | `POST /api/ai/chat`, `POST /api/ai/analyze` | `openai/gpt-oss-120b` | `GROQ_MODEL` |
| Image analysis | `POST /api/ai/analyze-image` | `qwen/qwen3.8-27b` | `GROQ_VISION_MODEL` |

## Setup

1. Create a key at https://console.groq.com/keys
2. Set `GROQ_API_KEY` in `backend/.env` locally, and in the backend host's environment variables in production
3. Restart the backend
4. Check `GET /api/ai/status`, which should return `"available": true`

`/api/ai/status` only confirms that a key is set. It does not prove the key or the model works, so send a test message too.

Groq retires models regularly. Check https://console.groq.com/docs/deprecations and use the override variables to switch models without a code change.

## Privacy

Chat messages and uploaded images are sent to Groq to generate a response. This means medical questions leave the user's device and the application's own servers. Users are told this in the UI. Review Groq's data retention terms before handling real patient data.

## How the Fallback Works

User sends message
→ Frontend calls the backend
→ Backend calls Groq
→ If that fails, the frontend shows saved general guidance, labelled as not being an AI answer

## Local Development with Ollama

In development builds only, the frontend can call a local Ollama server directly if the backend AI is unavailable. Production builds never do this.

```bash
ollama pull phi3:mini
ollama serve
# Runs at http://localhost:11434
```

## Prompt Template

The backend adds a system prompt to every chat message. It:

- Identifies the assistant as a medical information assistant for Indian users, not a doctor
- Rules out definitive diagnoses and medication doses
- Asks for Indian context such as medicine names and Ayushman Bharat where relevant
- Tells the user to call 112 or go to the ER when they describe an emergency
- Ends medical answers with a disclaimer to consult a qualified doctor

## Limitations

- These are general-purpose models, not medical-grade or clinically validated ones. They can make mistakes.
- Image analysis describes what is visible. It is not a diagnosis.
- Chat has no memory between messages unless history is explicitly passed.
- `/api/ai/*` endpoints do not require login. Each request uses your Groq quota.
