# buildy — backend

NestJS + Prisma 7 + PostgreSQL. Serves the buildy API on port 3000. See the [root README](../README.md) for what the app does and [worklog](../docs/worklog.md) for decisions and gotchas.

## Layout

```
src/
  auth/        CognitoAuthGuard (global — verifies the Cognito id_token on every request), AdminGuard, @CurrentUser
  users/       the signed-in user: profile (name, phone), profile picture, account deletion
  buildings/   creating buildings, adding residents by user ID, leaving (several buildings per user),
               "my buildings", members list, building management (building-manage.controller.ts:
               add residents, apartments, remove/block, details)
  issues/      issues with a status, status history, attachments and the weekly ping
  payments/    monthly fees (demo): setup (open mode/day, default fee/method), open a month, mark paid (method,
               who paid / who confirmed / how), change a fee, logs, a resident's own part, the payer and the fake Pay
  docs/        document upload / download / rename / delete (multer, files on disk)
  uploads/     S3 storage helper for docs, issues and pictures (saveUpload/putObject, removeUploads, presignGet, key builders, allow-list)
  admin/       admin-only building, contact-link and role management
  cities/      the city list (for the building wizard)
prisma/
  schema.prisma, migrations/, seed.ts (cities + demo buildings), data/cities.json, grant-admin.ts
```

## Access rules

- Every route needs a valid Cognito **id token** (`Authorization: Bearer …`).
- **Member** = has a `building_users` row for that building (or is an admin) — `BuildingsService.requireMember`.
- **Building management** = role `committee_head` or `management_company` **in that building**, or an admin — `BuildingsService.requireManager`. They can't remove/block themselves, each other or admins (`requireCanActOn`).
- **Anyone** signed in can create a building (`POST /buildings`) and becomes its committee head / management company; nobody else gets in unless building management adds them by user ID (`POST …/manage/members`) — there is no join password and no self-join.
- Docs can be changed by their uploader or an admin. Issues: the author edits/deletes only while `opened` (or an admin, any time); only building management (or an admin) changes the status; only the author pings.
- Everything under `/admin` requires `users.is_admin` (`AdminGuard`).
- **`X-View-As: <role>`** request header (`committee_head` / `management_company` / `resident`, sent by the app while an admin previews a role): the caller loses admin bypasses and gets that role in every building (`myRole`, `canManage`; management roles keep building-management powers). Management roles are honoured **only for real admins** (ignored otherwise — no privilege escalation); `resident` from anyone just removes powers. Applies to the caller only — checks about *other* members (e.g. "can't remove building management") use their real roles. Implemented with `auth/request-context.ts` (`viewedRole`, `effectiveAdmin`; AsyncLocalStorage middleware).

## API

| Method & path | Who | What |
|---|---|---|
| `GET /users/me` | any | The signed-in user: id, name, email, phone, isAdmin, `onboarded` (finished onboarding before — used to skip it on a new sign-in), language, `picture { google, version }` (created on first call). |
| `PUT /users/me/onboarding` | any | Save name and language from onboarding. |
| `PATCH /users/me` | any | Private info: `{ name?, phone? }` (empty phone clears it). |
| `PUT /users/me/avatar` · `DELETE` | any | Upload (`multipart/form-data` `file`; PNG/JPEG/WebP/GIF ≤ 2 MB) / remove the profile picture. |
| `GET /users/:id/avatar?v=<version>` | self, admin, or shares a building | The uploaded picture (404 if none — use the Google photo / initials). Cached `immutable`: pass the picture version so a new picture is a new URL. |
| `DELETE /users/me` | any | Delete the account; issues/docs stay with a null author ("Former resident"). |
| `GET /buildings/mine` | any | Every building the user belongs to: details, contact links, member count, `myRole`, `canManage`, `myApartments`. Empty = the user hasn't been added anywhere yet. |
| `POST /buildings` | any | Create a building: `{ name, cityId, address, role: committee_head\|management_company, description?, entryCode?, contactLinks?, residents?: [{ userId, apartments }], payments?: { openMode: manual\|auto, openDay, defaultFee?, defaultMethod? } }`. The creator becomes a member with `role`; residents are added in the same transaction (all or nothing). 409 same address in the city, 404 unknown user ID. |
| `POST /buildings/preview-users` | any | `{ ids: string[], buildingId? }` → `[{ userId, name, picture, isMe, alreadyMember, blocked }]` for the pasted IDs (unknown IDs are left out). `alreadyMember`/`blocked` are only filled with a `buildingId`, which needs management of it (403 otherwise). |
| `POST /buildings/:id/leave` | member | Leave that building (membership, role, apartment links there). |
| `GET /buildings/:id/members` | member/admin | Members with role, picture and apartments (number, floor, owner/renter); management/admin also get `phone`, `isAdmin` and apartment size/fee/payment. Management first. |
| `POST /buildings/:id/manage/members` | management/admin | Add residents by user ID, all or nothing: `{ residents: [{ userId, apartments: [{ number, relationType, floor?, sqrm?, paymentMethod? }] }] }` (1–200). 404 unknown IDs, 409 already members (body lists `userIds`), 403 blocked, 400 the same person twice. |
| `PUT /buildings/:id/manage/members/:userId/apartments` | management/admin | `{ apartments: [...] }` — replaces the member's apartments there. |
| `DELETE /buildings/:id/manage/members/:userId` | management/admin | Remove (management can add them again); `?block=true` also blocks them until unblocked. |
| `GET /buildings/:id/manage/blocks` · `DELETE …/blocks/:userId` | management/admin | List blocked users / unblock. |
| `PATCH /buildings/:id/manage/details` | management/admin | `{ description?, entryCode? }` (name/address/city stay admin-only). |
| `POST /buildings/:id/manage/contact-links` | management/admin | Add a contact link `{ type, link }` (same validation as the admin endpoint, `buildings/contact-links.ts`). |
| `DELETE /buildings/:id/manage/contact-links/:linkId` | management/admin | Remove one of *this* building's contact links (404 for another building's). |
| `GET /buildings/:id/issues?status=` · `POST` | member/admin | List (active ones first, then by last ping / opening, newest first; each has `pingedRecently` and, for the author, `canPingAt`) / report (`multipart/form-data`: `title`, `description?`, up to 10 `files`, ≤ 10 MB each, same allow-list as docs). |
| `GET /issues/:id` | member/admin | The issue with its report files and status history (`updates`, each with its note and files). |
| `PATCH /issues/:id` · `DELETE` | author while `opened` / admin | Edit `{ title?, description? }` / delete (removes the files too). |
| `POST /issues/:id/status` | management/admin | `multipart/form-data`: `status`, `text` (**required**), optional `files`. Only `opened` → `in_process`/`denied` and `in_process` → `resolved` are allowed (400 otherwise); denied and resolved are final. |
| `POST /issues/:id/updates` | management or the author | `multipart/form-data`: `text?`, `files?` (at least one). Only while the issue is `in_process` (400 otherwise); recorded in the history without a status change. |
| `POST /issues/:id/updates/:updateId/undo` | author of that update | Takes back the issue's newest update or resolve within 5 minutes of posting (400 after that, or for accepting/denying). The issue returns to `in_process` after a resolve; the response's `draft` (note + files) fills the form again. Drafts are deleted 5 minutes after the undo (lazily, when the issue or list is read) or once the author sends something new. Updates in `GET` responses carry `undoableUntil` for the viewer's own newest update. |
| `POST /issues/:id/ping` | author | Brings an `opened`/`in_process` issue back to the top. Once every 7 days → otherwise 429 with `canPingAt`. (Notifications are a later iteration.) |
| `GET /issue-attachments/:id/file` | member/admin | Download an issue file. |
| `GET /buildings/:id/docs` · `POST` | member/admin | List / upload (`multipart/form-data`: `file`, optional `title`; ≤ 10 MB; PDF, Office, images, text). |
| `GET /docs/:id/file` | member/admin | Download the file. |
| `PATCH /docs/:id` · `DELETE` | uploader/admin | Rename (`{ title }`) / delete (also removes the file). |
| `GET /buildings/:id/manage/payments` | management/admin | The current month's budget: `{ month, settings \| null, opened, missing, goal, collected, complete, apartments: [{ apartmentId, number, fee, method, payer, residents, payment: { amount, status, paidAt, method } \| null }] }`. `settings: null` = not set up yet. `complete` = collected equals goal. In automatic mode, reading it opens the month once its day has come. |
| `PUT /buildings/:id/manage/payments/settings` | management/admin | `{ openMode: manual\|auto, openDay (1–28), defaultFee?, defaultMethod? }` — the payments setup (first time or a change). Returns the overview. |
| `GET /buildings/:id/manage/payments/log` | management/admin | Every payment in the building (newest month first): `[{ id, period, apartmentNumber, amount, status, paidAt, paidBy, confirmedBy, confirmation, method }]`. |
| `POST /buildings/:id/manage/payments/open` | management/admin | Opens the current month: one charge per apartment, copied from its fee (else the building's default). Repeating it only adds apartments that have no charge yet. Returns the overview. |
| `POST /buildings/:id/manage/payments/:apartmentId/paid` · `POST …/mark-all-paid` | management/admin | Marks one apartment's (`{ method? }`, `confirmation = single`), or every unpaid (each with its apartment's method, `bulk`), charge of the current month as paid. `paid_by` = the apartment's payer, `confirmed_by` = the caller. Final — no undo, no partial payment (400 if the month isn't open). |
| `PATCH /buildings/:id/manage/payments/:apartmentId/fee` | management/admin | `{ amount, scope: once\|permanent }`. `once` changes only this month's unpaid charge (400 not open, 409 already paid); `permanent` also changes the standing fee (`apartments.monthly_payment`) that future months copy. Paid charges and past months never change. |
| `GET /buildings/:id/payments/mine` | member | The caller's own apartments: who pays (`payer`, `isPayer`, `canChoosePayer`, `residents`), this month's charge (null = not opened yet) and past months since they were linked to each apartment. Never other residents'. |
| `GET /buildings/:id/payments/:apartmentId/log` | resident of that apartment | That apartment's log (same row shape as the building log), only from the month they were linked to it (`apartment_residents.linked_at`). |
| `PUT /buildings/:id/payments/:apartmentId/payer` | owner of that apartment | `{ userId \| null }` — who pays the fee, one of the apartment's residents (null = back to the owner). 403 not an owner, 400 not a resident of the apartment. |
| `POST /buildings/:id/payments/:apartmentId/pay` | the apartment's payer | Demo "Pay": marks this month's charge paid instantly (`confirmation = self`). 403 not your apartment or not the payer, 400 month not opened. A real provider will replace it. |
| `GET /dev/users` | public, **dev only** | The mock users the sign-in page can "sign in as", with their roles and apartments. 404 unless `DEV_LOGIN=true`. |
| `GET /cities` | any | All cities (CBS codes + names). |
| `POST /admin/buildings/:id/join` | admin | `{ role }` — the admin joins the building as a member with that role (and any block on them there is lifted), so it shows in their own building switcher; admin powers are unchanged. |
| `GET /admin/buildings` · `POST` | admin | List (with counts, contact links and `joined` = the calling admin is a member) / create (optionally with `contactLinks` and `residents`; the admin does not become a member). |
| `PATCH /admin/buildings/:id` · `DELETE` | admin | Edit / delete (cascades to everything in the building, including files). |
| `POST /admin/buildings/:id/contact-links` | admin | `{ type: whatsapp\|phone\|email, link }` — WhatsApp must be `https://`. |
| `DELETE /admin/contact-links/:id` | admin | Remove a contact link. |
| `PUT /admin/buildings/:id/members/:userId/role` | admin | `{ role: committee_head\|management_company\|resident }`. |
| `DELETE /admin/buildings/:id/members/:userId` | admin | Remove a member from the building. |

Errors use normal HTTP codes: 400 validation / unsupported file / missing status note, 401 no or bad token, 403 not allowed / blocked, 404 not found, 409 duplicate building address in a city / already a member, 413 file too large, 429 ping too soon.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` | Used to verify id tokens. |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated. |
| `AWS_REGION`, `S3_BUCKET` | Private bucket for uploaded files (`us-east-1`). |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Key of the `buildy-app-dev` IAM user (Put/Get/Delete on `buildings/*` and `users/*` only). Root `.env` only. |
| `PORT` | Default 3000. |
| `PAYMENTS_PERIOD_MINUTES` | **Dev only** (override compose: `5`): a payments "month" lasts that many minutes, for demos. Unset = calendar months. |
| `DEV_LOGIN` | **Dev only** (override compose: `true`): accept dev "sign in as" tokens for the seeded `mock-user-*` accounts, serve `GET /dev/users`, and seed the "Dev Playground" building and the only mock admin, `claudeAdminTesting` (mock-user-11). The app refuses to start with it when `NODE_ENV=production`. |

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
