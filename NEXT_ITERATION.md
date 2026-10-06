# buildy — recap & next iteration

Snapshot of 2026-09-28. For how the app works see [README.md](README.md); API in [backend/README.md](backend/README.md); decisions and gotchas in [DEVLOG.md](DEVLOG.md).

> The 2026-09-28 iteration is committed on `staging` as `b04eab5` (local — **not pushed**; the backend isn't hosted yet, so a staging deploy would only half-work). Never push to production.

---

## 1. What we built this iteration

**Database (new structure, from the drawSQL diagram)**
- New tables: `cities`, `buildings`, `users`, `users_roles`, `building_users`, `contact_links`, `docs`, `messages` (snake_case columns, Prisma `@map`).
- `cities` = the official CBS settlement list (1,316 rows, id = "סמל יישוב"), fetched from data.gov.il and committed as `backend/prisma/data/cities.json`; seeded automatically.
- Kept on top of the diagram because the app needs them: `users.cognito_sub`, onboarding fields, `buildings.password_hash`.
- Building roles: `committee_head`, `management_company`, `resident` (2026-10-06: hierarchy simplified to admin → committee head = management company → resident; `committee_member` removed, `manager` renamed). Global super user = `users.is_admin`.
- `docs` gained file metadata (`file_name`, `mime_type`, `size_bytes`).
- Migrations: `20260928000000_new_schema` (dropped the old `User`/`Building`/`Issue` tables — a backup of the old data was taken first), `20260928010000_building_roles_and_doc_files`.

**Backend (NestJS)**
- Membership through `building_users` + `users_roles` (joining replaces the previous building).
- Messages module (replaces "issues"; issues = `maintenance` messages) with edit/delete.
- Members list (building management first), own-apartment editing.
- Documents: upload (10 MB, allow-listed types, Hebrew file names OK), download, rename, delete; files on a Docker volume.
- Admin: `AdminGuard`, building CRUD, contact links (validated per type), member roles, remove member; admins can act in any building.
- `npm run admin:grant -- <email>` (`--revoke`) to make/unmake admins. benibar777@gmail.com is admin.

**Frontend (React + MUI)**
- Home screen with no mock data: quick actions, building card (city, description, door code, contact links), My apartment, Members (committee on top), Messages (types, filter, edit/delete), Documents (preview before upload, viewer pop-up with full screen + download; PDF/images/text/Word).
- Admin console: searchable building switcher + tabs (Overview, Members, Messages, Documents), step-by-step **new-building wizard** (name → city → address → details → contacts → password → review), edit dialog with contact links.
- Floating admin **wrench** (admins only): View as resident, Open admin console. User menu: Edit profile, App preferences, sign out.
- Settings split into Profile / App preferences (language + Light/Dark/System; dark = navy with green accent) / Account.
- Stay signed in: silent Cognito refresh-token renewal (on load and before expiry).
- Onboarding name synced to the backend; all new UI translated into 6 languages (en, he, ar, ru, fr, es).

**Dev workflow**
- `docker compose up -d` = dev mode with live reload (`docker-compose.override.yml`); `-f docker-compose.yml` = production-like.
- New npm dependency → `docker compose up -d --build -V`.
- README / backend README / DEVLOG rewritten as real documentation.

**Verified**: type-checks, lint, builds; backend rules tested over real HTTP (21 checks: permissions, validation, uploads, cascades).
**Not yet verified by a person in the browser**: silent sign-in renewal against real Cognito, the document viewer per file type, dark mode across all screens, RTL layout of the new screens.

---

## 2. Who can do what — today

| Action | Resident (owner or renter) | Committee head / management company | Admin (`is_admin`) |
|---|---|---|---|
| See the list of **all** buildings (join picker) | ✅ | ✅ | ✅ |
| Join a building with its password / leave it | ✅ (one building at a time) | ✅ | ✅ |
| See own building: info, door code, contacts, members | ✅ | ✅ | ✅ any building |
| Edit own apartment (apt, floor, owner/tenant, size, payment method) | ✅ own only | ✅ own only | ✅ own only |
| Set the **monthly fee** | ❌ | ❌ | ❌ — no UI/API yet |
| Post a message / upload a doc | ✅ | ✅ | ✅ any building |
| Edit / delete a message or doc | own only | own only | ✅ any |
| View / download docs | own building | own building | ✅ any building |
| Manage contact links | ❌ | ❌ | ✅ |
| Assign roles / remove members | ❌ | ❌ | ✅ |
| Create / edit / delete buildings | ❌ | ❌ | ✅ |
| Make someone admin | ❌ | ❌ | CLI only (`admin:grant`) |
| Delete own account | placeholder | placeholder | placeholder |

Notes:
- **Committee head / management company are labels only** — they grant nothing extra yet.
- **"View as resident"** only hides admin UI; the backend still treats the user as admin.
- Onboarding lets anyone *call themselves* "committee member" or "manager" — this is just a profile label, it doesn't give a role.

---

## 3. Open questions (decide before building)

**Permissions / logic**
1. **Building-management powers** — should the committee head and the management company manage *their own* building: contact links, fees, member roles, deleting others' messages/docs, pinning messages, rotating the join password? Same powers for both (same level)? Can they appoint each other?
2. **Self-declared committee at onboarding** — turn it into a *request* an admin/committee head approves, or remove those options?
3. **Removing a member** — they can rejoin immediately with the same password. Rotate the password automatically, block the user, or switch to personal invite links?
4. **Join password brute force** — no rate limit on `/buildings/join` (passwords can be 4 chars). Add throttling / lockout.
5. **Building list privacy** — any signed-in user sees every building's name and address. Keep, or join only by invite code/link?
6. **Neighbour privacy** — residents see neighbours' names, apartment, floor, owner/tenant. OK, or should people opt in / hide details?
7. **Multiple buildings** — owners of several apartments, managers of several buildings: allow more than one membership + a building switcher?
8. **Account deletion** — messages/docs reference their author (FK restrict). Anonymise ("Former resident") or delete their content?
9. **Admin accountability** — log admin actions (who deleted/edited what)?

**Unused / half-used columns**
10. `monthly_payment` — who sets it (admin/committee)? Fixed per apartment or `sqrm` × rate? Track actual payments per month (new `payments` table: month, amount, paid_at, method)?
11. `payment_method` — informational, or show the committee's Bit/PayBox link to pay directly?
12. `users.phone_num` — collect it? Visible to everyone, committee only, or admins only?

**Known bug**
13. ~~Deleting a building leaves its uploaded files on disk~~ — **fixed 2026-10-06** (the building's upload folder is removed too; tested over HTTP).

---

## 4. Ideas to add next (pick after section 3)

- **Maintenance issue workflow** — status (open → in progress → done), assignee, photos; residents see progress.
- **Fees & payments** — per-apartment fee, monthly paid/unpaid tracking, committee dashboard, reminders.
- **Notifications** — urgent messages by email / WhatsApp link / web push; unread badges.
- **Message replies / comments**, pinned messages, read receipts for urgent notices.
- **Document folders/categories** (rules, budget, minutes, contracts); Excel preview via SheetJS (maintained build from cdn.sheetjs.com).
- **Invite links / QR codes** instead of shared passwords.
- **Committee dashboard** once committee powers exist.
- **Deployment** — host the backend (Fargate/EC2/Lambda), move uploads to S3, production DB.
- **Quality** — e2e tests (Playwright) for the main flows, backend tests for permissions, rate limiting, audit log, triage `npm audit`.

---

## 5. Prompt for the next session

Copy everything in the box into a new Claude Code session in this repo:

```text
We're continuing work on buildy (building-resident app: React/MUI frontend, NestJS + Prisma + Postgres backend, Cognito login).
First read README.md, backend/README.md, DEVLOG.md and NEXT_ITERATION.md — they describe the app, the API, past decisions and where we left off.

Working rules:
- I test everything locally with `docker compose up -d` (dev mode, live reload, http://localhost:8080). Every few steps — and always after schema, migration, seed, env, dependency or Docker changes — make sure the compose setup still works (new npm deps → `docker compose up -d --build -V`; schema changes → write a migration, apply it in the container, restart the backend) and tell me what you ran.
- Only ever commit/push to the `staging` branch, never production. Ask before committing.
- After each feature, update README.md / backend/README.md / DEVLOG.md so they keep documenting the app.
- All UI text goes through the i18n system in all 6 languages (en, he, ar, ru, fr, es) and must work in RTL and in dark mode (use theme tokens, not hex colors).
- Enforce permissions in the backend (guards/services), not just by hiding UI; add HTTP-level tests for new permission rules.

Step 1 — commit: if the previous iteration is still uncommitted on `staging`, show me a summary and ask before committing it.
Step 2 — decide the logic with me: walk me through NEXT_ITERATION.md section 3 ("Open questions") one topic at a time — especially committee powers, self-declared roles, removing members / join-password rotation, join brute-force protection, privacy of the building list and neighbour details, and the fee/payment columns. Give me your recommendation for each and wait for my answers. Then update the "Who can do what" table in NEXT_ITERATION.md to the agreed rules.
Step 3 — (done 2026-10-06) deleting a building now deletes its uploaded files.
Step 4 — implement the agreed permission changes (backend first, then UI), with tests.
Step 5 — propose which item from section 4 to build next and wait for my go-ahead.
```
