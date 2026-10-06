# buildy — backend

NestJS + Prisma 7 + PostgreSQL. Serves the buildy API on port 3000. See the [root README](../README.md) for what the app does and [DEVLOG](../DEVLOG.md) for decisions and gotchas.

## Layout

```
src/
  auth/        CognitoAuthGuard (global — verifies the Cognito id_token on every request), AdminGuard, @CurrentUser
  users/       GET/PUT the signed-in user's profile
  buildings/   joining/leaving, the user's building view, members list, own unit details
  messages/    building messages
  docs/        document upload / download / rename / delete (multer, files on disk)
  admin/       admin-only building, contact-link and member management
  cities/      the city list (for the building wizard)
prisma/
  schema.prisma, migrations/, seed.ts (cities + demo buildings), data/cities.json, grant-admin.ts
```

## Access rules

- Every route needs a valid Cognito **id token** (`Authorization: Bearer …`).
- Building data (messages, docs, members) requires membership of that building — or `users.is_admin`.
- Messages and docs can be changed by their author/uploader, or by an admin.
- Everything under `/admin` requires `users.is_admin` (`AdminGuard`).

## API

| Method & path | Who | What |
|---|---|---|
| `GET /users/me` | any | The signed-in user (created on first call). |
| `PUT /users/me/onboarding` | any | Save name, language, user type. |
| `GET /buildings` | any | Buildings to choose from when joining. |
| `GET /buildings/me` | any | The user's building: details, contact links, member count, their own unit — or `null`. |
| `POST /buildings/join` | any | `{ buildingId, password }` — join (replaces any previous building). |
| `POST /buildings/leave` | any | Leave the current building. |
| `PATCH /buildings/me/membership` | member | Update own unit: apartment, floor, relationType, sqrm, paymentMethod. |
| `GET /buildings/:id/members` | member/admin | Members with unit and role, building management (committee head, management company) first. |
| `GET /buildings/:id/messages` · `POST` | member/admin | List / post (`{ title, description?, type? }`). |
| `PATCH /messages/:id` · `DELETE` | author/admin | Edit / delete a message. |
| `GET /buildings/:id/docs` · `POST` | member/admin | List / upload (`multipart/form-data`: `file`, optional `title`; ≤ 10 MB; PDF, Office, images, text). |
| `GET /docs/:id/file` | member/admin | Download the file. |
| `PATCH /docs/:id` · `DELETE` | uploader/admin | Rename (`{ title }`) / delete (also removes the file). |
| `GET /cities` | any | All cities (CBS codes + names). |
| `GET /admin/buildings` · `POST` | admin | List (with counts and contact links) / create (optionally with `contactLinks`). |
| `PATCH /admin/buildings/:id` · `DELETE` | admin | Edit (omit `password` to keep it) / delete (cascades to everything in the building). |
| `POST /admin/buildings/:id/contact-links` | admin | `{ type: whatsapp\|phone\|email, link }` — WhatsApp must be `https://`. |
| `DELETE /admin/contact-links/:id` | admin | Remove a contact link. |
| `PUT /admin/buildings/:id/members/:userId/role` | admin | `{ role: committee_head\|management_company\|resident }`. |
| `DELETE /admin/buildings/:id/members/:userId` | admin | Remove a member from the building. |

Errors use normal HTTP codes: 400 validation / unsupported file, 401 no or bad token, 403 not allowed, 404 not found, 409 duplicate building address in a city, 413 file too large.

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
