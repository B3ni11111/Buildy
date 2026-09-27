# buildy — Dev Log

Living doc, not a changelog. Keep it short — prune stuff once it stops being relevant instead of letting it grow forever.

## What this is

A building-resident app. Google/Cognito login → onboarding → join a building (shared password) → home screen with the building's members (committee first), messages, documents and contact links. Full description of features and roles: [README.md](README.md); API: [backend/README.md](backend/README.md).

## Architecture (current)

```
buildy/
  frontend/   Vite + React 19 + MUI. Cognito Hosted UI login (Amplify/Cognito owns identity).
  backend/    NestJS + Prisma + PostgreSQL.
  docker-compose.yml   Runs all three (postgres, backend, frontend); docker-compose.override.yml = dev mode (live reload).
  amplify.yml           Deploys ONLY the frontend as a static site (AWS Amplify Hosting).
```

The backend isn't deployed anywhere yet — it only runs locally (bare-metal or Docker). Deployment target (Fargate/EC2/Lambda) is still undecided.

## Key decisions worth remembering

- **Backend auth**: every request now needs a real Cognito token (`backend/src/auth/cognito-auth.guard.ts`, verifies the `id_token` against Cognito's public keys via `aws-jwt-verify`). This isn't a new login system — Cognito/Amplify still fully owns identity on the frontend; the guard just stops the backend from blindly trusting a client-supplied user ID. Started with zero backend auth (fine when the only data was a low-stakes onboarding profile), added this once buildings/issues introduced real private data.
- **All real config (Cognito IDs, Postgres credentials) lives only in local, gitignored `.env`/`.env.local` files** — nothing real is committed. `docker compose up` deliberately refuses to start without a root `.env` (see `.env.example` for what's needed). Running this on another machine means handing over those values yourself, outside of git. The real deployed frontend doesn't need any of this — Amplify Hosting supplies its own values via Console-configured environment variables, a separate system entirely.
- **Buildings use a shared password**, not per-user credentials — closer to an invite code than to auth. Hashed with `bcryptjs`. Membership lives in `building_users` (+ a `resident` row in `users_roles`). For now joining replaces any previous membership (one active building per user); "leave" deletes the rows.
- **Schema (2026-09-28)** follows the drawSQL diagram: `cities`, `buildings`, `users`, `users_roles`, `building_users`, `contact_links`, `docs`, `messages`. DB columns are snake_case (Prisma `@map`). Kept on top of the diagram because the app needs them: `users.cognito_sub`, onboarding fields (`language`, `user_type`, `onboarded_at`), `buildings.password_hash`. `cities.id` is the CBS "סמל יישוב" code, seeded from `backend/prisma/data/cities.json` (exported from data.gov.il).
- **Admins** = `users.is_admin` (global super user). Grant with `docker compose exec backend npm run admin:grant -- <email>` (user must have signed in once; `--revoke` to undo) — re-run after a DB reset. Admins: `/admin/*` (`AdminGuard`), read/post in any building, edit/delete any message or doc. UI: Settings → Account → Admin panel; new buildings via a step-by-step wizard. "View as resident" (user menu) only hides admin UI client-side — the backend still treats them as admin.
- **Building roles** (`users_roles.role`): `committee_head`, `committee_member`, `manager`, `resident` — one per member, set by an admin; display-only for now (no extra permissions). The old diagram values `admin`/`resident` were replaced (global admin is `is_admin`).
- **Docs** are files on disk under `UPLOADS_DIR` (named volume `uploads` in compose, so they survive rebuilds), stored as `<buildingId>/<uuid><ext>` — never a client-supplied path. 10 MB limit, allow-listed MIME types, multer `defParamCharset: utf8` so Hebrew file names aren't garbled. Downloads go through the API (auth header), so the frontend fetches a Blob — the viewer (`FileViewerDialog` + `FilePreview`) shows it from memory, nothing is written to disk unless the user clicks Download. Download responses send `X-Content-Type-Options: nosniff`, and the preview Blob is re-typed with the stored allow-listed MIME type. `docx-preview` is lazy-loaded (own chunk). Excel preview would need SheetJS — skipped for now (the npm-registry build is outdated/vulnerable; the maintained one installs from cdn.sheetjs.com).
- **Staying signed in**: Cognito id tokens last 1h; `AuthContext` renews them with the refresh token (30 days) on load and ~2 min before expiry. Tokens live in localStorage, which is per-origin — `:8080` (Docker) and `:5173` (bare Vite) are separate sign-ins.
- **Profile sync**: onboarding data lives in localStorage (`buildy_onboarding_profile`); the app PUTs it to `/users/me/onboarding` whenever the backend's name differs, so members/messages show real names.
- **Theme**: `frontend/src/theme.ts` — light (forest green) and dark (AWS-console-style navy surfaces, lighter green accent `#7FB685`). Preference light/dark/system in localStorage (`buildy_color_mode`). Use theme tokens (`primary.main`, `divider`, `action.hover`) instead of hex colors in components.
- **Issues are `messages` with `type = maintenance`** ("Report an issue" opens the message dialog preset to maintenance).
- **Prisma 7** changed its config model mid-project: connection info now lives in `backend/prisma.config.ts`, and `PrismaClient` needs an explicit driver adapter (`@prisma/adapter-pg`) — the old `url = env(...)` inside `schema.prisma` no longer works.

## Reference info

**Seeded buildings** (`backend/prisma/seed.ts` — create-only upsert, so a manually changed password survives re-seeding):

| Building | Address | Password |
|---|---|---|
| Maple Court | 14 Ben Yehuda St (city 5000, Tel Aviv) | `maple-2026` |
| Rothschild Gardens | 82 Rothschild Blvd (city 5000) | `rothschild-2026` |
| HaYarkon Terrace | 210 HaYarkon St (city 5000) | `yarkon-2026` |

**Ports**: backend `3000` · frontend via Docker `8080` · frontend bare dev `5173` · Postgres `5433` (not `5432` — that's taken by an unrelated project's container on this machine).

**Cognito User Pool ID**: not written here on purpose — check your local `backend/.env` or root `.env`. If you've lost it, it's in AWS Console → Cognito → User pools → your pool → "User pool ID".

**Env files**: `backend/.env`, `frontend/.env.local`, root `.env` — all local-only, all gitignored, all required (nothing has a fallback default anymore). Each has a matching `.env.example` in the same folder showing what's needed, with no real values.

## How to run it

- Full stack, **dev mode with live reload** (default): `docker compose up -d` → app at `http://localhost:8080`. `docker-compose.override.yml` is merged automatically: source is bind-mounted, Vite dev server + `nest --watch`, file polling (Windows mounts don't send change events). Edits show up without rebuilding.
  - New npm dependency → `docker compose up -d --build -V` (rebuild + fresh container node_modules).
  - Schema change → write the migration (see [backend/README.md](backend/README.md#common-commands)), `docker compose exec backend sh -c "npx prisma migrate deploy && npx prisma generate"`, then `docker compose restart backend`. (Also run `npx prisma generate` on the host so your editor sees the new types.)
- Full stack, **production-like** (compiled backend + nginx): `docker compose -f docker-compose.yml up -d --build`.
- Bare-metal backend: `docker compose up -d postgres`, then `cd backend && npm run start:dev`
- Bare-metal frontend: `cd frontend && npm run dev` → `http://localhost:5173`

## Known gaps / next steps

- Committee roles don't grant extra permissions yet (e.g. letting the committee head manage contacts) — only global admins can manage.
- Account deletion in Settings is still a UI placeholder.
- Uploaded files live on a local Docker volume — a real deployment will need S3 (or similar) instead.
- Backend has no real deployment target yet.
- `npm audit` flags several vulnerabilities in dev-only tooling (NestJS CLI's Angular deps) — not yet triaged.
- Policy: never push to production — only the `staging` branch.
