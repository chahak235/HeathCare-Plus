# Security

## Authentication

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with HS256
- Token expiry: 7 days
- Protected routes check Authorization header on every request

## Data Privacy

- AI runs locally — no medical queries sent to external servers
- PostgreSQL runs locally in development
- No analytics or tracking

## Input Validation

All API inputs validated before hitting the database. SQL injection is prevented by using parameterized queries throughout.

## Known Gaps (To Fix)

- No refresh token rotation yet (planned)
- Rate limiting not yet implemented on all endpoints (planned)
- No brute force protection on login endpoint yet (planned)
- JWT secret should be rotated periodically

## Reporting a Vulnerability

Open a GitHub Security Advisory on the repository. Do not create a public issue for security problems.
