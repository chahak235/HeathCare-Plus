# API Reference

Base URL: `http://localhost:3001`

All protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/signup
Register a new user.

Request:
```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "name": "Deven Mundada",
  "phone": "9876543210"
}
```

Response:
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": 1, "email": "user@example.com", "name": "Deven Mundada" }
}
```

### POST /api/auth/login
Login with existing credentials.

Request:
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

Response: Same shape as signup.

### GET /api/auth/me
Returns the currently authenticated user. Requires JWT.

---

## Hospitals

### GET /api/india/hospitals/city/:city
Returns hospitals in the given city.

Query params: `limit` (default 20), `offset` (default 0)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "AIIMS Delhi",
      "city": "Delhi",
      "state": "Delhi",
      "latitude": 28.5672,
      "longitude": 77.2100,
      "beds": 2500,
      "available_beds": 350,
      "emergency_services": true,
      "ayushman_bharat": true,
      "rating": 4.8
    }
  ],
  "pagination": { "total": 50, "limit": 20, "offset": 0, "hasMore": true }
}
```

### GET /api/india/hospitals/search?q=:query
Full-text search across hospital names, cities, and specialties.

### GET /api/india/hospitals/:id
Single hospital by ID.

---

## Doctors

### GET /api/doctors
List doctors. Supports query params: `specialty`, `city`, `limit`, `offset`.

### GET /api/doctors/search?q=:query
Search doctors by name or specialty.

### GET /api/doctors/specialties
Returns array of all available specialties.

### GET /api/doctors/top-rated?limit=5
Returns top-rated doctors sorted by rating.

---

## AI Chat

### POST /api/ai/chat
Send a message to the AI assistant.

Request:
```json
{ "message": "I have a fever and sore throat" }
```

Response:
```json
{
  "success": true,
  "response": "**Symptoms & Initial Assessment**\n\n..."
}
```

### GET /api/ai/status
Check whether the AI service is configured on the server.

---

## Health Metrics

All endpoints require JWT.

### POST /api/health/metrics
```json
{ "metric_type": "blood_pressure", "value": 120, "unit": "mmHg", "notes": "Morning" }
```

### GET /api/health/metrics
Query params: `type`, `limit`

---

## Appointments

All endpoints require JWT.

### POST /api/appointments
```json
{
  "doctor_id": 1,
  "hospital_id": 1,
  "appointment_date": "2026-08-01",
  "appointment_time": "10:00",
  "consultation_type": "In-Person",
  "symptoms": "Chest pain"
}
```

### GET /api/appointments/user
Returns all appointments for the authenticated user.
