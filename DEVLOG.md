# buildy — Dev Log

Living doc, not a changelog. Keep it short — prune stuff once it stops being relevant instead of letting it grow forever.

## What this is

A building-resident app. Google/Cognito login → onboarding → join a building (shared password) → home screen with the building's members (building management first), messages, documents and contact links. Full description of features and roles: [README.md](README.md); API: [backend/README.md](backend/README.md); tables + user hierarchy: [DATABASE.md](DATABASE.md) (update it with every schema/role change).

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
- **Buildings use a shared password**, not per-user credentials — closer to an invite code than to auth. Hashed with `bcryptjs`. Membership lives in `building_users` (+ a `resident` row in `users_roles`). A user can belong to **several buildings** (since 2026-10-06); joining adds one, "leave" is per building. See the permissions & membership section below.
- **Schema (2026-09-28)** follows the drawSQL diagram: `cities`, `buildings`, `users`, `users_roles`, `building_users`, `contact_links`, `docs`, `messages`. DB columns are snake_case (Prisma `@map`). Kept on top of the diagram because the app needs them: `users.cognito_sub`, onboarding fields (`language`, `user_type`, `onboarded_at`), `buildings.password_hash`. `cities.id` is the CBS "סמל יישוב" code, seeded from `backend/prisma/data/cities.json` (exported from data.gov.il).
- **Admins** = `users.is_admin` (global super user). Grant with `docker compose exec backend npm run admin:grant -- <email>` (user must have signed in once; `--revoke` to undo) — re-run after a DB reset. Admins: `/admin/*` (`AdminGuard`), read/post in any building, edit/delete any message or doc. UI: floating wrench (`frontend/src/admin/AdminFab.tsx`, real admins only, also while previewing as resident) → *View as resident* / *Open admin console*; Settings → Account also links to the console. The console (`AdminPanel.tsx`) = searchable building list (dropdown on phones; last selection remembered in localStorage `buildy_admin_building`) + tabs Overview / Members / Messages / Documents reusing the dashboard cards. New buildings via a step-by-step wizard. "View as resident" is enforced by the backend too (since 2026-10-06, see below).
- **Hierarchy (agreed 2026-10-06)**: admin → committee head = management company → resident (owner = renter). `users_roles.role` is `committee_head` / `management_company` / `resident` — one per member per building, assigned by an admin. Level 2 now has real powers in its own buildings (see below). No committee-member role (every resident is a member). Migration `20261006000000_simplify_building_roles` was hand-written to map old rows (`committee_member`→`resident`, `manager`→`management_company`). Full picture: [DATABASE.md](DATABASE.md).
- **Docs** are files on disk under `UPLOADS_DIR` (named volume `uploads` in compose, so they survive rebuilds), stored as `<buildingId>/<uuid><ext>` — never a client-supplied path; deleting a building also removes its `<buildingId>/` folder (`DocsService.removeBuildingFiles`). 10 MB limit, allow-listed MIME types, multer `defParamCharset: utf8` so Hebrew file names aren't garbled. Downloads go through the API (auth header), so the frontend fetches a Blob — the viewer (`FileViewerDialog` + `FilePreview`) shows it from memory, nothing is written to disk unless the user clicks Download. Download responses send `X-Content-Type-Options: nosniff`, and the preview Blob is re-typed with the stored allow-listed MIME type. `docx-preview` is lazy-loaded (own chunk). Excel preview would need SheetJS — skipped for now (the npm-registry build is outdated/vulnerable; the maintained one installs from cdn.sheetjs.com).
- **Staying signed in**: Cognito id tokens last 1h; `AuthContext` renews them with the refresh token (30 days) on load and ~2 min before expiry. Tokens live in localStorage, which is per-origin — `:8080` (Docker) and `:5173` (bare Vite) are separate sign-ins.
- **Signing out / switching accounts (2026-10-08)**: `logout()` clears tokens + per-account device keys (`buildy_onboarding_profile`, `buildy_current_building`, `buildy_view_as_resident`), then redirects to Cognito `/logout?client_id&logout_uri=<origin>` (no trailing slash — Cognito matches exactly) (`getLogoutUrl`, override `VITE_LOGOUT_URI`) — without that the Hosted UI cookie silently signed the previous account back in. The authorize URL sends `prompt=select_account` (forwarded to Google → account chooser). **Every origin must be in the app client's "Allowed sign-out URLs"** (`http://localhost:8080`, `http://localhost:5173`, the Amplify URL — no trailing slash), otherwise Cognito shows an error page. A failed silent refresh only clears local data (`clearSession`, no redirect).
- **Onboarding only once per account**: `GET /users/me` returns `onboarded` (`onboarded_at` set). With no local profile, `App.tsx` asks the server first (spinner) and restores name + language instead of showing `OnboardingFlow`.
- **Profile sync**: onboarding data (name + language only since 2026-10-06; older saved profiles with a `userType` still load) lives in localStorage (`buildy_onboarding_profile`); the app PUTs it to `/users/me/onboarding` whenever the backend's name or language differs, so members/messages show real names. Phone and picture live only in the account (`PATCH /users/me`, `PUT /users/me/avatar`).
- **Theme**: `frontend/src/theme.ts` — light (forest green) and dark (AWS-console-style navy surfaces, lighter green accent `#7FB685`). Preference light/dark/system in localStorage (`buildy_color_mode`). Use theme tokens (`primary.main`, `divider`, `action.hover`) instead of hex colors in components.
- **Device-only preferences** (agreed 2026-10-06 — not synced to the account): `buildy_color_mode`, `buildy_language`, `buildy_current_building` (which building the home screen shows), `buildy_home_layout_v2:<cognitoSub>` (grid layout), `buildy_setup_shown:<buildingId>`, `buildy_home_layout_edit` (edit-on-hover switch), `buildy_admin_building` (admin console selection), `buildy_view_as_resident`.
- **Issues are `messages` with `type = maintenance`** ("Report an issue" opens the message dialog preset to maintenance).
- **Prisma 7** changed its config model mid-project: connection info now lives in `backend/prisma.config.ts`, and `PrismaClient` needs an explicit driver adapter (`@prisma/adapter-pg`) — the old `url = env(...)` inside `schema.prisma` no longer works.

## Permissions & membership model (agreed 2026-10-06)

Decided by answering the open questions of the old NEXT_ITERATION.md together:

| Topic | Decision |
|---|---|
| Hierarchy | Admin → Committee head = Management company (same powers) → Resident (owner = renter). |
| Level-2 powers (own buildings only) | Edit members' **technical info** (apartments, owner/renter, floor, size, payment method), **remove** or **block** members, **edit building details** (description, door code, join password). Can't remove/block themselves, peers or admins. |
| Admin-only | Create/delete/rename/move buildings, contact links, role assignment, editing/deleting other people's messages and docs, `admin:grant`. |
| Private info (user edits own) | Name, profile picture, phone (optional), language, theme, home layout. Residents can't edit apartment/owner-renter/payment info any more. |
| Onboarding | Language + name only. At **join** the user may *suggest* an apartment number + owner/renter (`building_users.requested_*`); management confirms by setting the real apartments, which clears the suggestion. `users.user_type` dropped. |
| Remove vs Block | Remove = can rejoin with the password. Block = `building_blocks` row, join refused (403) until unblocked. |
| Join brute force | 5 wrong passwords per user per building per 15 min → HTTP 429 (even with the right password) until the window ends. **In-memory** in `BuildingsService` — fine for one backend instance, resets on restart; needs Redis/DB if we ever run several instances. |
| Building list | Public join list kept for now. |
| Neighbour details | Everyone sees name, picture, apartments, floor, owner/renter. **Phone, pending requests, size and payment details** only for management + admin. |
| Account deletion | `DELETE /users/me` erases the user row (+ picture file); memberships/roles/apartment links cascade; their messages/docs stay with `author`/`uploader` = NULL → shown as "Former resident". The Cognito login remains — signing in again creates a fresh empty account. |
| Multi-building | Many memberships per user, a role per building, **several apartments per building**. |
| Profile picture | Upload own (PNG/JPEG/WebP/GIF ≤ 2 MB) → `UPLOADS_DIR/avatars/<userId>-<uuid>.<ext>`, served by `GET /users/:id/avatar` only to the user, admins and people sharing a building. Default = Google photo URL (`users.google_picture`, refreshed from the token's `picture` claim); initials as fallback. The file name changes per upload → `picture.version` tells clients to refetch. |
| Preferences | Stay on the device (language, theme, home layout). |
| Not this iteration | Audit log, monthly fees, payment tracking. `payment_method` is technical info set by management. |

**Data model behind it** (migration `20261006120000_apartments_blocks_avatars`, hand-written to *move* data):
- `building_users` = membership only (+ `requested_apartment`, `requested_relation`).
- `apartments` (per building, unique number; floor, size, fee, payment method) + `apartment_residents` (user ↔ apartment with owner/renter) — so one user can hold several apartments and an owner + renter can share one.
- `building_blocks` (who, blocked by whom, when).
- `users.avatar_src`, `users.google_picture`; `users.user_type` dropped; `messages.author` / `docs.uploader` nullable with `ON DELETE SET NULL`.
- Old rows mapped as: apartment + relation → apartment + confirmed resident; apartment only → apartment + `requested_apartment`; relation only → `requested_relation`. Tested on a throwaway DB copy with fixture rows before running on the dev DB (backup in the session scratchpad).

**Code map**: access checks in `BuildingsService` — `requireMember` (member or admin), `requireManager` (management of *that* building or admin), `requireCanActOn` (no self/peer/admin removal unless admin). Management endpoints: `backend/src/buildings/building-manage.controller.ts` (`/buildings/:id/manage/*`). Profile/avatar/account: `backend/src/users/*`. Shared upload path safety: `backend/src/uploads/uploads.ts` (`uploadPath`). Verified with a 38-check HTTP permission matrix (temporary users/buildings, cleaned up).

**Fix (same day)**: joining used to always add a `resident` role row, so a committee head who re-joined ended up with two roles in one building. `join` now only creates `resident` for a member with no role there, and migration `20261006130000_dedupe_building_roles` deletes the redundant `resident` rows.

**Gotcha**: after deleting a backend source file, the dev container's `nest --watch` can keep failing on a stale `backend/tsconfig.build.tsbuildinfo` / `dist` — delete both and `docker compose restart backend`.

## Frontend for multi-building + management (2026-10-06, phase B)

- **Buildings**: `App.tsx` loads `GET /buildings/mine` into a list; the shown one is `buildy_current_building` (falls back to the first). `Dashboard` top bar has a **building switcher** (`BuildingSwitcher`) with *Join another building* → `JoinBuildingStep` with `onCancel` and `excludeIds`. No buildings → join screen.
- **Join** (`onboarding/JoinBuildingStep.tsx`): optional apartment number + Owner/Renter toggle sent as the suggestion; maps 401 / 403 (blocked) / 429 (too many tries) to messages.
- **Onboarding** is language + name; `UserTypeStep`, `USER_TYPE_OPTIONS` and the `userType.*` labels are gone.
- **My apartments** (`components/MyApartmentsCard.tsx`, replaced `MyUnitCard`): read-only; shows a pending chip for the join suggestion.
- **Members** (`components/MembersCard.tsx`): `UserAvatar` pictures; when `building.canManage`: phone numbers, pending-suggestion chips (+ count on the tile), **Approve** button on a pending request with an apartment (2026-10-08 — reuses `PUT …/manage/members/:id/apartments` with their current apartments + the requested one, number + owner/renter only so floor/size/payment stay; clears the request), **Manage** dialog per member (`ManageMemberDialog`: apartments rows → `PUT …/manage/members/:id/apartments`, Remove / Block with confirm), **Blocked** list with Unblock. Remove/Block hidden for yourself, other management and admins unless you're an admin (backend enforces it too). Admin role picker unchanged.
- **Building tile**: *Edit details* opens the same `components/EditBuildingDialog.tsx` as the admin console (moved out of `AdminPanel`; UI only — callers pass `onSave` / `onAddLink` / `onRemoveLink`). Admins: every field via `/admin/*`. Building management: name/city/address shown read-only, description/door code/password via `PATCH …/manage/details`, contact links via `…/manage/contact-links` (2026-10-08). The user menu shows the account name (`currentUser.name`), not the token's.
- **Profile pictures**: `components/UserAvatar.tsx` — uploaded picture (fetched once per `userId:version` with the auth header and cached as an object URL) → Google photo (`referrerPolicy="no-referrer"`) → initials. Used in members, the user menu and Settings.
- **Settings → Profile**: edit name + phone (`PATCH /users/me`), change/remove picture (≤ 2 MB, client-side check too), the role field is gone. **Delete account** is real now (`DELETE /users/me` → sign out).
- Messages/docs with a null author show **"Former resident"** (`common.formerResident`).

## Iteration 3 (2026-10-06): real resident view, AWS-style grid, picture cropping, account setup

- **View as any role (2026-10-08)**: the wrench's switch became a *View as* picker (Admin / Committee head / Management company / Resident); `X-View-As` carries the role, stored in localStorage `buildy_view_as` (old `buildy_view_as_resident=true` migrates to `resident`). Backend `viewedRole(user)` honours management roles only for real admins; `isManager(user, building, asRequester)` applies the preview only to the caller (targets keep their real role). Earlier notes, still valid for the resident case — **View as resident is real now**: `frontend/src/utils/api.ts` sends `X-View-As: resident` while the toggle is on (set from the remembered toggle before the first fetch — it can only remove powers, so sending it before we know the user is an admin is harmless). Backend: `backend/src/auth/request-context.ts` — an Express middleware (`main.ts`, first) stores the flag in `AsyncLocalStorage`; `effectiveAdmin(user)` / `viewedRole(user)` (was `actingAsResident()`) are used by `AdminGuard`, `BuildingsService` (`requireMember`, `isManager`, `mine`/`detail` → `myRole: resident`, `canManage: false`, `members` → no phones/requests, `requireCanActOn`), message/doc author checks and avatar access. `GET /users/me` keeps the real `isAdmin` so the wrench can switch back. In tests, register the middleware on the test app (`app.use(requestContextMiddleware)`).
- **Picture bugs, root causes**: (1) "the old picture keeps showing" — `GET /users/:id/avatar` was one URL with `max-age=86400`, so the browser cache served the old image after a new upload; now the client requests `?v=<version>` and the response is `immutable` (new picture = new URL). (2) "Cancel still applied it" — the file was uploaded the moment it was picked. Now `AvatarEditor` → crop dialog (**react-easy-crop**, round, outside dimmed + blurred via a `backdrop-filter` layer with a circular mask) → *Save* stages a 512×512 JPEG; only the profile's **Save** uploads/removes (`StagedPicture` in `Settings.tsx`), *Cancel* drops it. Badge: **+** without an uploaded picture, **pencil** with one; it opens *Upload file* / *Remove picture*. The parent owns the staged preview URL and revokes it.
- **AWS-style grid** (replaces the 12-column grid; stored layouts moved to key `buildy_home_layout_v2:<sub>`, old ones ignored): 4 / 2 / 1 columns (`lg ≥1100 / md ≥700 / sm`), row height = 0.41 × column width (clamped 105–195 px; was 0.55 / 140–260 until 2026-10-08) so cells are rectangles at any width (`rowHeightFor`). Sizes 1–4 × 1–3 cells; custom constraint `noStrips` keeps long side ≤ 2× short side (grow the other side first). Quick actions are no longer a tile (2026-10-08): plain buttons between the welcome header and the grid; `loadLayouts` drops the old `actions` item from stored layouts (`knownTiles`) so saved arrangements survive. While dragging/resizing, `GridBackground` (`react-grid-layout/extras`) fades in behind the tiles with the same corner radius, and the placeholder fills the target cells. Tile radius is 25% smaller than other cards (`TILE_RADIUS = 3` theme units).
- **Gap filling + RTL (2026-10-08)**: custom `fillGapsCompactor` (`utils/homeLayout.ts`) — in reading order each tile takes the highest, then left-most free spot, so gaps fill upward *and* sideways. Not the library's `wrapCompactor`: it ignores tile height (2-row tiles overlap). react-grid-layout is LTR-only (under `dir=rtl` tiles were offset, leaving a big right margin), so the grid box is `dir="ltr"`, each `.tile-body` gets the language `dir` back, and RTL renders `mirrorLayouts(layouts)` (x → cols − x − w), mirroring back in `onLayoutChange`; the compactor packs in LTR space and mirrors, so stored layouts are the same for every language. `body` gets `user-select: none` while dragging/resizing.
- **Join + setup**: *Find your building* no longer asks apartment/owner-renter. `components/AccountSetup.tsx` shows a "Finish setting up your account" banner while the current building has no confirmed apartment and no full suggestion; its dialog asks apartment + owner/renter (required, `PUT /buildings/:id/my-request`), then phone and picture (optional, Skip). It opens by itself once per building per device (`buildy_setup_shown:<buildingId>`).

## Customizable home grid (2026-10-06, phase C — superseded by the AWS-style grid above)

- Library: **react-grid-layout 2.x** (MIT, React 19-compatible; v2 API = `Responsive` + `useContainerWidth`, `dragConfig` / `resizeConfig`). Its `css/styles.css` includes the resize-handle styles.
- `frontend/src/utils/homeLayout.ts`: tile ids (`building, apartments, members, messages, docs`), breakpoints `lg ≥1100 / md ≥760 / sm` with 12 / 8 / 1 columns, `DEFAULT_LAYOUTS` (same for every building), load/save/reset per user on the device. A stored layout missing a tile falls back to the default for that breakpoint, so adding tiles later is safe.
- `Dashboard.tsx`: tiles glide (CSS-transform animation), `bounded: true` keeps them inside the grid, drag only by the hover handle (`.tile-drag-handle`) so buttons/scrolling inside tiles still work, resize from the corner. Editing is on by default since 2026-10-08 (key `buildy_home_layout_edit_v2`, so older "off" choices were dropped); Settings → App preferences → *Edit home layout* turns it off. Never on phones (single column). Changes are saved only while editing (not on breakpoint re-flows). The info bar (*Reset layout* / *Done*) appears only after a tile actually moved or resized (`onDragStop`/`onResizeStop` compare old vs new item); *Done* just hides it, editing stays on. Tile dashed outline shows on hover only. Nothing is locked. No special admin behaviour (decided).
- Tile content fills the tile and scrolls inside it (`.tile-body` CSS in `Dashboard`).

## Reference info

**Seeded buildings** (`backend/prisma/seed.ts` — create-only upsert, so a manually changed password survives re-seeding):

| Building | Address | Password | Door code | Contact links |
|---|---|---|---|---|
| Maple Court | 14 Ben Yehuda St (city 5000, Tel Aviv) | `maple-2026` | 1948 | WhatsApp, email |
| Rothschild Gardens | 82 Rothschild Blvd (city 5000) | `rothschild-2026` | 0821 | WhatsApp, phone |
| HaYarkon Terrace | 210 HaYarkon St (city 5000) | `yarkon-2026` | 2100 | phone |

Contact links are only added to a seeded building that has none, so links you edit survive re-seeding.

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

Known gaps:
- Join-attempt limit is in memory (resets on backend restart; per instance).
- No audit log of management/admin actions (decided: not this iteration).
- Monthly fees can't be set yet and payments aren't tracked (decided: later iteration).
- Deleting an account doesn't delete the Cognito/Google login; signing in again creates a fresh empty account.
- Uploaded files (documents, pictures) live on a local Docker volume — a real deployment will need S3 (or similar) instead.

Next steps (moved from the old NEXT_ITERATION.md, which was deleted once its questions were answered):
- **Maintenance issue workflow** — status (open → in progress → done), assignee, photos; residents see progress.
- **Fees & payments** — per-apartment fee, monthly paid/unpaid tracking, management dashboard, reminders.
- **Notifications** — urgent messages by email / WhatsApp link / web push; unread badges.
- **Message replies / comments**, pinned messages, read receipts for urgent notices.
- **Document folders/categories** (rules, budget, minutes, contracts); Excel preview via SheetJS (maintained build from cdn.sheetjs.com).
- **Invite links / QR codes** instead of shared passwords (would also let us hide the public building list).
- **Audit log** of management/admin actions.
- **Deployment** — host the backend (Fargate/EC2/Lambda), move uploads to S3, production DB, shared store for the join-attempt limit.
- **Quality** — e2e tests (Playwright) for the main flows, keep the HTTP permission-matrix tests as a real test suite, triage `npm audit`.
- Backend has no real deployment target yet.
- `npm audit` flags several vulnerabilities in dev-only tooling (NestJS CLI's Angular deps) — not yet triaged.
- Policy: never push to production — only the `staging` branch.
