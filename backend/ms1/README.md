# Lumify MS-1 — Business Microservice

Express.js + TypeScript API gateway for Lumify. Owns authentication, interviews, uploads, reports, analytics, notifications, and PostgreSQL. Communicates with FastAPI (MS-2) for AI only.

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push   # or apply drizzle/0000_init.sql
npm run dev
```

- API base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`
- Health: `GET /api/v1/health`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Hot-reload server |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm test` | Unit tests |
| `npm run db:push` | Push Drizzle schema |

## Architecture

Routes → Controllers → Services → Repositories → PostgreSQL

AI calls go through `AiClient` (retry, timeout, circuit breaker, audit logs).
