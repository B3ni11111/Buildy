# buildy — backend

NestJS + Prisma 7 + PostgreSQL. Serves the buildy API on port 3000. See the [root README](../README.md) for what the app does and [DEVLOG](../DEVLOG.md) for decisions and gotchas.

## Layout

```
src/
  auth/        CognitoAuthGuard (global — verifies the Cognito id_token on every request), AdminGuard, @CurrentUser
  users/       the signed-in user: profile (name, phone), profile picture, account deletion
  buildings/   joining/leaving (several buildings per user), "my buildings", members list,
               building management (building-manage.controller.ts: apartments, remove/block, details)
  messages/    building messages
  docs/        document upload / download / rename / delete (multer, files on disk)
  uploads/     shared upload-path safety (uploadPath) for docs and pictures
  admin/       admin-only building, contact-link and role management
  cities/      the city list (for the building wizard)
prisma/
  schema.prisma, migrations/, seed.ts (cities + demo buildings), data/cities.json, grant-admin.ts
```

## Access rules

- Every route needs a valid Cognito **id token** (`Authorization: Bearer …`).
- **Member** = has a `building_users` row for that building (or is an admin) — `BuildingsService.requireMember`.
- **Building management** = role `committee_head` or `management_company` **in that building**, or an admin — `BuildingsService.requireManager`. They can't remove/block themselves, each other or admins (`requireCanActOn`).
- Messages and docs can be changed by their author/uploader, or by an admin.
- Everything under `/admin` requires `users.is_admin` (`AdminGuard`).
- Join attempts: 5 wrong passwords per user per building per 15 minutes → 429 (in memory, single instance).
- **`X-View-As: resident`** request header (sent by the app while an admin previews as a resident): every check treats the caller as a plain resident — no admin bypasses, no building-management powers, `myRole: resident`. It can only remove powers. Implemented with `auth/request-context.ts` (AsyncLocalStorage middleware).

## API

| Method & path | Who | What |
|---|---|---|
| `GET /users/me` | any | The signed-in user: id, name, email, phone, isAdmin, language, `picture { google, version }` (created on first call). |
| `PUT /users/me/onboarding` | any | Save name and language from onboarding. |
| `PATCH /users/me` | any | Private info: `{ name?, phone? }` (empty phone clears it). |
| `PUT /users/me/avatar` · `DELETE` | any | Upload (`multipart/form-data` `file`; PNG/JPEG/WebP/GIF ≤ 2 MB) / remove the profile picture. |
| `GET /users/:id/avatar?v=<version>` | self, admin, or shares a building | The uploaded picture (404 if none — use the Google photo / initials). Cached `immutable`: pass the picture version so a new picture is a new URL. |
| `DELETE /users/me` | any | Delete the account; messages/docs stay with a null author ("Former resident"). |
| `GET /buildings` | any | Buildings to choose from when joining. |
| `GET /buildings/mine` | any | Every building the user belongs to: details, contact links, member count, `myRole`, `canManage`, `myApartments`, `myRequest`. |
| `POST /buildings/join` | any | `{ buildingId, password, apartment?, relationType? }` — adds a building (others stay); apartment/relation are a suggestion. 401 wrong password, 403 blocked, 429 too many tries. |
| `PUT /buildings/:id/my-request` | member | `{ apartment, relationType }` — the member's own apartment/owner-renter suggestion (from "Finish setting up"); management confirms it. |
| `POST /buildings/:id/leave` | member | Leave that building (membership, role, apartment links there). |
| `GET /buildings/:id/members` | member/admin | Members with role, picture and apartments (number, floor, owner/renter); management/admin also get `phone`, `isAdmin`, `request` and apartment size/fee/payment. Management first. |
| `PUT /buildings/:id/manage/members/:userId/apartments` | management/admin | `{ apartments: [{ number, relationType, floor?, sqrm?, paymentMethod? }] }` — replaces the member's apartments there; clears their request. |
| `DELETE /buildings/:id/manage/members/:userId` | management/admin | Remove; `?block=true` also blocks them from rejoining. |
| `GET /buildings/:id/manage/blocks` · `DELETE …/blocks/:userId` | management/admin | List blocked users / unblock. |
| `PATCH /buildings/:id/manage/details` | management/admin | `{ description?, entryCode?, password? }` (name/address/city stay admin-only). |
| `GET /buildings/:id/messages` · `POST` | member/admin | List / post (`{ title, description?, type? }`). |
| `PATCH /messages/:id` · `DELETE` | author/admin | Edit / delete a message. |
| `GET /buildings/:id/docs` · `POST` | member/admin | List / upload (`multipart/form-data`: `file`, optional `title`; ≤ 10 MB; PDF, Office, images, text). |
| `GET /docs/:id/file` | member/admin | Download the file. |
| `PATCH /docs/:id` · `DELETE` | uploader/admin | Rename (`{ title }`) / delete (also removes the file). |
| `GET /cities` | any | All cities (CBS codes + names). |
| `GET /admin/buildings` · `POST` | admin | List (with counts and contact links) / create (optionally with `contactLinks`). |
| `PATCH /admin/buildings/:id` · `DELETE` | admin | Edit (omit `password` to keep it) / delete (cascades to everything in the building, including files). |
| `POST /admin/buildings/:id/contact-links` | admin | `{ type: whatsapp\|phone\|email, link }` — WhatsApp must be `https://`. |
| `DELETE /admin/contact-links/:id` | admin | Remove a contact link. |
| `PUT /admin/buildings/:id/members/:userId/role` | admin | `{ role: committee_head\|management_company\|resident }`. |
| `DELETE /admin/buildings/:id/members/:userId` | admin | Remove a member from the building. |

Errors use normal HTTP codes: 400 validation / unsupported file, 401 no or bad token / wrong join password, 403 not allowed / blocked, 404 not found, 409 duplicate building address in a city, 413 file too large, 429 too many join attempts.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | Used to verify id tokens. |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated. |
| `UPLOADS_DIR` | Where uploaded files are stored (default `./uploads`; `/app/uploads` volume in Docker). |
| `PORT` | Default 3000. |

Copy `.env.example` to `.env` for bare-metal runs; Docker Compose sets these itself.

## Common commands

```bash
# in Docker (normal workflow)
docker compose exec backend npm run admin:grant -- someone@example.com   # make an admin (--revoke to undo)
docker compose exec backend npx prisma migrate deploy                     # apply migrations
docker compose exec backend npx prisma db seed                            # re-run the (idempotent) seed

# bare metal
npm install
npm run start:dev      # watch mode
npm run build && npm run lint && npm test
```

New migration: edit `prisma/schema.prisma`, then either `npx prisma migrate dev --name <name>` (interactive), or generate the SQL with
`npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` into a new `prisma/migrations/<timestamp>_<name>/migration.sql` and run `npx prisma migrate deploy`.
