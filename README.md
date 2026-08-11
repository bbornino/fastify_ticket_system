# Fastify Ticket System

A support ticketing API built with Fastify, Drizzle ORM, and PostgreSQL, inside an NX monorepo. This is TypeScript learning project #4 of 9, and the first app in the Fastify block — it focuses on backend fundamentals only, with no frontend.

## Tech Stack

- **Framework:** Fastify 5
- **Monorepo:** NX
- **Language:** TypeScript
- **ORM:** Drizzle ORM (pinned to `1.0.0-beta.20`)
- **Database:** PostgreSQL 16 (Docker)
- **Cache/queue (provisioned, not yet used):** Redis 7 (Docker)
- **Auth:** JWT via `@fastify/jwt`, bcrypt password hashing
- **Validation:** Fastify's native JSON Schema validation
- **Testing:** Vitest, using Fastify's built-in `.inject()` for HTTP-level tests
- **Package manager:** pnpm

## Project Structure

```
fastify_ticket_system/
├── apps/
│   └── api/
│       └── src/
│           ├── app/
│           │   ├── app.ts
│           │   └── plugins/       # sensible, jwt, auth (requireAuth decorator)
│           └── routes/
│               ├── root.ts        # /health
│               ├── users/         # register, login, /me
│               └── tickets/       # CRUD + comments
├── packages/
│   └── db/
│       └── src/
│           ├── lib/
│           │   ├── schema.ts      # Drizzle table definitions
│           │   ├── db.ts          # Drizzle client
│           │   └── relations.ts   # table relations
│           └── scripts/
│               └── ping.ts        # standalone DB connectivity check
└── docker-compose.yml            # Postgres (5438) + Redis (6380)
```

Routes are grouped by domain (`routes/users/`, `routes/tickets/`) rather than split into separate routes/services/repositories layers, matching Playful Programming's actual production structure. Shared database code lives in `packages/db`, its own NX library, so it can be consumed by both `apps/api` and a future `apps/worker` (planned for F3) without either app reaching into the other's internals.

## Setup

1. Install Node 24 (via nvm-windows or your version manager of choice) and enable pnpm.
2. Install dependencies:
   ```
   pnpm install
   ```
3. Copy `.env.example` to `.env` — the default values match the Docker Compose setup below and need no changes for local development.
4. Start Postgres and Redis:
   ```
   docker compose up -d
   ```
5. Push the schema to the database:
   ```
   pnpm exec drizzle-kit push
   ```
6. Confirm the database is reachable:
   ```
   pnpm db:ping
   ```
7. Start the API:
   ```
   pnpm exec nx serve api
   ```
8. Confirm the server is up:
   ```
   pnpm health
   ```

The API runs at `http://localhost:3000`.

## Features Implemented

**Authentication**
- User registration with bcrypt password hashing
- Login with JWT issuance (24-hour expiry)
- `requireAuth` decorator protecting routes via Fastify's plugin/hook system
- `GET /users/me` — returns the current authenticated user

**Ticketing**
- `POST /tickets` — create a ticket
- `GET /tickets` — list tickets, with optional `status`/`priority` filtering
- `GET /tickets/:id` — get a single ticket
- `PATCH /tickets/:id` — update status, priority, or agent assignment
- `POST /tickets/:id/comments` — add a comment, author taken from the authenticated user's token, never from the request body
- `GET /tickets/:id/comments` — list a ticket's comments

**Data model**

Three tables — `users`, `tickets`, `ticket_comments` — with two Postgres enum types (`ticket_status`, `ticket_priority`) shared between the database schema and Fastify's request validation.

## Running Tests

```
pnpm exec nx test api
```

23 tests across 6 files, covering both success and failure paths (invalid input, missing auth, nonexistent resources) for every route. Tests use Fastify's `.inject()` against a real, disposable app instance per test file, and run against the actual Postgres database rather than a mock — test data is created with distinctive identifiers and cleaned up in `afterAll` hooks.

## Known Limitations

- **JWT refresh tokens are not implemented.** Access tokens are long-lived (24 hours) for development convenience. A production system would pair short-lived access tokens with a proper refresh-token flow; this was scoped out of F1 deliberately, as a documented decision rather than an oversight.
- **No frontend.** F1 is a backend-only app by design — the Fastify block's frontend work begins in F2.
