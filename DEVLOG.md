# buildy — Dev Log

Living doc, not a changelog. Keep it short — prune stuff once it stops being relevant instead of letting it grow forever.

## What this is

A building-resident app. Google/Cognito login → onboarding → join a building (address + shared password) → see building info and post/read issues for that building.

## Architecture (current)

```
buildy/
  frontend/   Vite + React 19 + MUI. Cognito Hosted UI login (Amplify/Cognito owns identity).
  backend/    NestJS + Prisma + PostgreSQL.
  docker-compose.yml   Runs all three (postgres, backend, frontend) for local dev.
  amplify.yml           Deploys ONLY the frontend as a static site (AWS Amplify Hosting).
```

The backend isn't deployed anywhere yet — it only runs locally (bare-metal or Docker). Deployment target (Fargate/EC2/Lambda) is still undecided.

## Key decisions worth remembering

- **Backend auth**: every request now needs a real Cognito token (`backend/src/auth/cognito-auth.guard.ts`, verifies the `id_token` against Cognito's public keys via `aws-jwt-verify`). This isn't a new login system — Cognito/Amplify still fully owns identity on the frontend; the guard just stops the backend from blindly trusting a client-supplied user ID. Started with zero backend auth (fine when the only data was a low-stakes onboarding profile), added this once buildings/issues introduced real private data.
- **All real config (Cognito IDs, Postgres credentials) lives only in local, gitignored `.env`/`.env.local` files** — nothing real is committed. `docker compose up` deliberately refuses to start without a root `.env` (see `.env.example` for what's needed). Running this on another machine means handing over those values yourself, outside of git. The real deployed frontend doesn't need any of this — Amplify Hosting supplies its own values via Console-configured environment variables, a separate system entirely.
- **Buildings use a shared password**, not per-user credentials — closer to an invite code than to auth. Hashed with `bcryptjs`. One active building per user (`User.currentBuildingId`, nullable) — "leave" just clears it, no membership-history table.
- **Issues**: backend supports full CRUD, but the frontend only does create + list for now (no edit/delete UI) — deliberate scope choice, not a limitation.
- **Prisma 7** changed its config model mid-project: connection info now lives in `backend/prisma.config.ts`, and `PrismaClient` needs an explicit driver adapter (`@prisma/adapter-pg`) — the old `url = env(...)` inside `schema.prisma` no longer works.

## Reference info

**Seeded buildings** (`backend/prisma/seed.ts` — create-only upsert, so a manually changed password survives re-seeding):

| Building | Address | Password |
|---|---|---|
| Maple Court | 14 Ben Yehuda St, Tel Aviv | `maple-2026` |
| Rothschild Gardens | 82 Rothschild Blvd, Tel Aviv | `rothschild-2026` |
| HaYarkon Terrace | 210 HaYarkon St, Tel Aviv | `yarkon-2026` |

**Ports**: backend `3000` · frontend via Docker `8080` · frontend bare dev `5173` · Postgres `5433` (not `5432` — that's taken by an unrelated project's container on this machine).

**Cognito User Pool ID**: not written here on purpose — check your local `backend/.env` or root `.env`. If you've lost it, it's in AWS Console → Cognito → User pools → your pool → "User pool ID".

**Env files**: `backend/.env`, `frontend/.env.local`, root `.env` — all local-only, all gitignored, all required (nothing has a fallback default anymore). Each has a matching `.env.example` in the same folder showing what's needed, with no real values.

## How to run it

- Full stack: `docker compose up -d --build` → app at `http://localhost:8080`
- Bare-metal backend: `docker compose up -d postgres`, then `cd backend && npm run start:dev`
- Bare-metal frontend: `cd frontend && npm run dev` → `http://localhost:5173`

## Known gaps / next steps

- No token refresh — Cognito `id_token` expires in ~1hr, nothing refreshes it silently yet.
- No edit/delete UI for issues (backend's ready, frontend isn't wired to it).
- Backend has no real deployment target yet.
- `npm audit` flags several vulnerabilities in dev-only tooling (NestJS CLI's Angular deps) — not yet triaged.
- Policy: never push to production — only the `staging` branch.
