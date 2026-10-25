# buildy — worklog

> Purpose: running log of decisions, gotchas and architecture notes.

Living doc, not a changelog. Keep it short — prune stuff once it stops being relevant instead of letting it grow forever.

## What this is

A building-resident app. Google/Cognito login → onboarding (profile + preferences only) → shows the user's ID until building management adds them to a building → home screen with the building's members (building management first), issues, documents and contact links. Full description of features and roles: [README.md](../README.md); API: [backend/README.md](../backend/README.md); tables + user hierarchy: [dataStructure](dataStructure.md) (update it with every schema/role change).

### Product direction (2026-10-20)

Buildy is the building's single place for people, problems, documents and money, built on trust and transparency (residents see only their own payment state). Money roadmap: (1) demo payments with real DB rows and a fake instant Pay, (2) real payments through a third-party provider (not chosen), (3) receipts/maintenance bills uploaded via Documents become expenses, so the budget becomes a balance. Each step must fit the next: `payments` stays provider-neutral (`provider`, `external_ref`, `status`, amount snapshot per month), docs stay open to a category and an expense link. Demo scope: fixed fee per apartment, fee change affects the current goal and future months only, head toggles paid / select all, building budget shows `collected / goal` with a ✓ when equal. Interview details: [temporary/payments.md](temporary/payments.md).

### Payments demo, as built (2026-10-22)

- `payments` is a permanent log keyed by `(building_id, apartment_number, period)`; `apartment_id` is `SET NULL` and the number is copied, so nothing is lost if an apartment goes. Rows go only with the building.
- The head **opens each month by hand** (`POST …/manage/payments/open`, idempotent: it adds apartments that have no charge). No scheduler. The period is the Israel-time calendar month (`currentPeriod()` in `payments.service.ts`).
- Fee rule: `apartments.monthly_payment` is the standing fee; a new month copies it. "One-time" edits only the unpaid current row; "permanent" also updates the standing fee. Apartments with no fee count as ₪0 and show in the list.
- Decided with the user: no partial payments, no undo, every apartment is in the goal, current month only. Unanswered/assumed: management company has the same powers as the committee head.
- Verified with a throwaway script against the Docker database (fee rules, privacy, 403/400/409 cases, the log surviving apartment/user deletion and cascading with the building). The UI itself was only type-checked: signing in needs Cognito.
- The Payments tile is `PaymentsCard.tsx`: management sees the budget, and anyone with apartments sees their own part below it.
- **Test mode (dev only):** `PAYMENTS_PERIOD_MINUTES: '5'` in `docker-compose.override.yml` makes a "month" last 5 minutes, so the period column is a timestamp, not a date. The API then sends the period as a full ISO time instead of `YYYY-MM`, the tile shows it as a date + time, and refetches every 20s. Remove the variable for real months. The production compose file never sets it.
- **Round 2 (2026-10-22):** setup per building (`building_payment_settings`; the wizard's new `payments` step, or a setup panel in the tile), automatic opening on a day (lazy: on first read on/after the day — `autoOpen()` runs inside `overview` / `mine`, and also adds new apartments), methods (`card` added, `bit` + `paybox` merged into `bit_paybox` — the migration recreates the enum), `paid_by` (payer) vs `confirmed_by` + `confirmation` (single / bulk / self / automatic), `apartments.payer_id` (owner's choice; `payerOf()` falls back to the first-linked owner, then renter), `apartment_residents.linked_at` (per-apartment log privacy; `setApartments` re-creates links, so it now carries the old date over). Apartments without their own fee follow `default_fee` at opening; the wizard doesn't write fees onto apartments. Logs: building-wide (management) and per apartment (resident), shown in `PaymentsShared.tsx` (full-screen dialog, no routing yet). Checked with a scripted run against Docker (setup, payer rules, methods, confirmations, logs and their privacy, linked_at kept, auto-open, mark-all methods).
- Home screen: the widgets panel closes on a click outside it (except the "Add widgets" buttons and dialogs); "Reset layout" and a tile's ✕ ask for confirmation first.

### Soft tiles redesign, stage 2: sections and summary tiles (2026-10-23)

- **Sections:** Home, Issues, Money, Documents, People (`components/SectionNav.tsx`). The current one lives in the URL hash (`#issues` …) via `useSection`, so back/forward and reload work; there is still no router. Desktop (md+): pill tabs centred in the header (3-column grid). Phones: a fixed bottom bar — light bar a shade brighter than the page in light mode, C's floating dark bar in dark mode. The app footer hides below md while the dashboard shows (`Footer hideOnPhone`); its links (Feedback, About, Privacy, Terms) move into the account menu there (`UserInfo footerLinks`, items hidden from md up).
- **Pages** reuse the full cards (IssuesCard, PaymentsCard + MyApartmentsCard, DocumentsCard, MembersCard) in the section colour. Home stays mounted (hidden) while a page shows so the grid keeps its measured width; the summaries remount (`homeVisit` key) when the user comes back home.
- **Home tiles are summaries** (`components/HomeSummaries.tsx`): one big figure, up to 3 rows, "See all" to the page. Money: ₪ collected of goal with a bar for management, or "your part" with slide-to-pay for residents. Building and My apartments tiles keep their old content.
- Header actions (Upload, Report an issue) open the section page with its dialog up. The old quick-action row is gone.
- Default tile sizes shrank for the summaries, and the saved-layout key moved to `buildy_home_layout_v7`, so older saved arrangements reset once.

### Soft tiles redesign, stage 1 (2026-10-23)

- Direction chosen with the user from the design review (Option C): decisions in [temporary/design-review.md](temporary/design-review.md).
- **Section colours via CSS variables:** the MUI theme now uses `cssVariables: true`. Each home tile gets `tileVars(mode, section)` from `theme.ts` on its `.tile-body`, which overrides `--mui-palette-*` (paper, text, divider, primary) and `--mui-shape-borderRadius` for everything inside. Dialogs opened from a tile are portaled outside it, so they keep the normal colours. Gotcha: colours computed in JS from `theme.palette` (e.g. `alpha(theme.palette.primary.main, …)`) do not follow the tile; use `theme.vars` or sx palette keys inside tiles.
- Font is Rubik everywhere (Google Fonts link in `index.html`); the hardcoded Georgia stacks were replaced.
- `index.css` had the Vite starter's button rules: they drew the thick black focus outline after clicks. Removed.
- New parts: `StatusLabel` (dot + word, used for issue and payment statuses), `DoorCode` (hidden until held 0.7s, shown 6s, tap to copy), `SlideToPay` + `PaidCheck` (slide the knob to pay, then the check animation), time-of-day greeting with a soft light that follows the hour, four layout presets in the widgets drawer (`presetLayout()` in `utils/homeLayout.ts`), and a "partial translation" note on Arabic, Russian, French and Spanish.
- Not done yet: tabs (pill tabs on desktop, bottom bar on phones) need real pages; the About page as the root with sign-in.

### Dev sign-in switch + Playwright (2026-10-22)

- **Why:** Google/Cognito sign-in can't be automated (Claude must not type real passwords), so no UI change could be seen by anyone but the user. Now Claude (or anyone) can test every role locally.
- **How:** `DEV_LOGIN: 'true'` (backend) and `VITE_DEV_LOGIN: 'true'` (frontend) are set **only** in `docker-compose.override.yml`. The sign-in page (`Home.tsx`, not the unused `SignIn.tsx`) then shows "Dev: sign in as…" (`DevSignIn.tsx`, list from the public `GET /dev/users`, 404 unless DEV_LOGIN). Picking a user stores an unsigned, JWT-shaped token `<{"typ":"dev"}>.<{"sub":"mock-user-N"}>.dev` (`utils/devLogin.ts`); `CognitoAuthGuard` accepts it only with DEV_LOGIN and only for `mock-user-*` subs (`auth/dev-login.ts`), so a real account can never be impersonated. The backend refuses to start with DEV_LOGIN when `NODE_ENV=production` and logs a warning when it's on. Sign-out of a dev session skips Cognito's logout page.
- **Dev Playground:** with DEV_LOGIN, the seed creates (create-only) building "Dev Playground" at 1 Test St, Tel Aviv: Noa (mock 1) committee head + owner apt 1; Daniel (2) owner apt 2 rented to Maya (3); Yossi (4) owner apt 3 (rented to Tamar, 5) and apt 4; Omer (6) management company; payments set up (manual, ₪400 default, card). The only mock admin is `claudeAdminTesting` (see below). Delete the building from the admin console to re-seed it.
- **Playwright MCP:** outputs (snapshots, screenshots, console logs) can only be written inside the repo, under `.playwright-mcp/` (git-ignored).
- **Role walkthrough (Playwright, 2026-10-22):** renter sees "X pays", no Pay; owner hands payment to the renter in the apartment center; head's list and log follow; management company's Mark all records each apartment's method and the new payer; a renter gets 403 on the building log and other apartments' logs. The user tested in parallel in their own browser — the rows they created matched too.
- **Admin join (2026-10-22):** `POST /admin/buildings/:id/join { role }` + a "Join building" button (role menu) on the console's Overview tab; `GET /admin/buildings` now returns `joined` for the caller. Verified as Rina (dev admin) with Playwright.
- **Mock admin (2026-10-22):** the user allows exactly one mock admin, `claudeAdminTesting` (mock-user-11, `00000000-0000-4000-8000-000000000011`), seeded only with DEV_LOGIN; the seed also un-admins every other mock user (Rina was the dev admin briefly).
- **Admin console (2026-10-22):** "Open building" (joins with a role first if needed, then `App.onOpenBuilding` selects it and goes home), **Apartments** tab (read-only table from the payments overview, which now also returns `floor`/`sqrm`) and **Payments** tab (reuses `ManagerBudget` from `PaymentsCard.tsx`: budget, settings, log; admins pass `requireManager`).
- **E2E suite (`e2e/`, 2026-10-22):** Playwright, own `package.json` (not in the app images), 10 tests in `tests/auth|payments|admin.spec.ts`, `workers: 1`. `helpers.ts` makes dev tokens, calls the API, and `createTestBuilding()` builds a throwaway building as claudeAdminTesting (apt 1 Avi owner + Lior renter, apt 2 Shira owner/head; manual, ₪300 default, card) that `afterAll` deletes. `waitForFreshPeriod()` keeps the payments flow inside one 5-minute dev period — the beforeAll timeout must be raised with `testInfo.setTimeout` (`describe.configure` doesn't cover hooks). Writing it found two real bugs, both fixed: MUI `Select`s without `labelId` had no accessible name, and the Payments tile didn't refresh after an owner changed the payer (Dashboard now bumps `paymentsVersion`, remounting the tile).
- **Known, unrelated:** old files in the user's real building ("הדירה של בני") load with S3 403s — their keys use the pre-S3 layout (`avatars/…`, `<buildingId>/<uuid>.jpg`), outside the IAM policy's `buildings/*` and `users/*`.

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
- **Membership is by user ID, not by password (2026-10-11)**: a user can't join a building themselves. Their home screen shows their `users.id`; the committee head / management company pastes it into *Add residents* (bulk) and sets the apartment and owner/renter. Anyone can *create* a building (becoming its committee head or management company); that is deliberately unchecked — like creating a Discord server, an empty building harms nobody. The one side effect: `(city_id, address)` is unique, so someone can squat a real address; an admin deletes/renames it from the console (the 409 tells the user to contact support). Membership lives in `building_users` (+ a `resident` row in `users_roles`). A user can belong to **several buildings** (since 2026-10-06). See the permissions & membership section below.
- **Schema (2026-09-28)** follows the drawSQL diagram: `cities`, `buildings`, `users`, `users_roles`, `building_users`, `contact_links`, `docs`, `messages`. DB columns are snake_case (Prisma `@map`). Kept on top of the diagram because the app needs them: `users.cognito_sub`, onboarding fields (`language`, `onboarded_at`). `cities.id` is the CBS "סמל יישוב" code, seeded from `backend/prisma/data/cities.json` (exported from data.gov.il).
- **Admins** = `users.is_admin` (global super user). Grant with `docker compose exec backend npm run admin:grant -- <email>` (user must have signed in once; `--revoke` to undo) — re-run after a DB reset. Admins: `/admin/*` (`AdminGuard`), read/post in any building, edit/delete any message or doc. UI: floating wrench (`frontend/src/admin/AdminFab.tsx`, real admins only, also while previewing as resident) → *View as resident* / *Open admin console*; Settings → Account also links to the console. The console (`AdminPanel.tsx`) = searchable building list (dropdown on phones; last selection remembered in localStorage `buildy_admin_building`) + tabs Overview / Members / Messages / Documents reusing the dashboard cards. New buildings via a step-by-step wizard. "View as resident" is enforced by the backend too (since 2026-10-06, see below).
- **Hierarchy (agreed 2026-10-06)**: admin → committee head = management company → resident (owner = renter). `users_roles.role` is `committee_head` / `management_company` / `resident` — one per member per building, assigned by an admin. Level 2 now has real powers in its own buildings (see below). No committee-member role (every resident is a member). Migration `20261006000000_simplify_building_roles` was hand-written to map old rows (`committee_member`→`resident`, `manager`→`management_company`). Full picture: [dataStructure](dataStructure.md).
- **Docs** are files on disk under `UPLOADS_DIR` (named volume `uploads` in compose, so they survive rebuilds), stored as `<buildingId>/<uuid><ext>` — never a client-supplied path; deleting a building also removes its `<buildingId>/` folder (`DocsService.removeBuildingFiles`). 10 MB limit, allow-listed MIME types, multer `defParamCharset: utf8` so Hebrew file names aren't garbled. Downloads go through the API (auth header), so the frontend fetches a Blob — the viewer (`FileViewerDialog` + `FilePreview`) shows it from memory, nothing is written to disk unless the user clicks Download. Download responses send `X-Content-Type-Options: nosniff`, and the preview Blob is re-typed with the stored allow-listed MIME type. `docx-preview` is lazy-loaded (own chunk). Excel preview would need SheetJS — skipped for now (the npm-registry build is outdated/vulnerable; the maintained one installs from cdn.sheetjs.com).
- **Staying signed in**: Cognito id tokens last 1h; `AuthContext` renews them with the refresh token (30 days) on load and ~2 min before expiry. Tokens live in localStorage, which is per-origin — `:8080` (Docker) and `:5173` (bare Vite) are separate sign-ins.
- **Signing out / switching accounts (2026-10-08)**: `logout()` clears tokens + per-account device keys (`buildy_onboarding_profile`, `buildy_current_building`, `buildy_view_as_resident`), then redirects to Cognito `/logout?client_id&logout_uri=<origin>` (no trailing slash — Cognito matches exactly) (`getLogoutUrl`, override `VITE_LOGOUT_URI`) — without that the Hosted UI cookie silently signed the previous account back in. The authorize URL sends `prompt=select_account` (forwarded to Google → account chooser). **Every origin must be in the app client's "Allowed sign-out URLs"** (`http://localhost:8080`, `http://localhost:5173`, the Amplify URL — no trailing slash), otherwise Cognito shows an error page. A failed silent refresh only clears local data (`clearSession`, no redirect).
- **Onboarding only once per account**: `GET /users/me` returns `onboarded` (`onboarded_at` set). With no local profile, `App.tsx` asks the server first (spinner) and restores name + language instead of showing `OnboardingFlow`.
- **Profile sync**: onboarding data (name + language only since 2026-10-06; older saved profiles with a `userType` still load) lives in localStorage (`buildy_onboarding_profile`); the app PUTs it to `/users/me/onboarding` whenever the backend's name or language differs, so members/messages show real names. Phone and picture live only in the account (`PATCH /users/me`, `PUT /users/me/avatar`).
- **Theme**: `frontend/src/theme.ts` — light (forest green) and dark (AWS-console-style navy surfaces, lighter green accent `#7FB685`). Preference light/dark/system in localStorage (`buildy_color_mode`). Use theme tokens (`primary.main`, `divider`, `action.hover`) instead of hex colors in components.
- **Device-only preferences** (agreed 2026-10-06 — not synced to the account): `buildy_color_mode`, `buildy_language`, `buildy_current_building` (which building the home screen shows), `buildy_home_layout_v2:<cognitoSub>` (grid layout), `buildy_home_layout_edit` (edit-on-hover switch), `buildy_admin_building` (admin console selection), `buildy_view_as_resident`.
- **Issues (2026-10-11)** replaced messages: `issues` + `issue_updates` (status history, required note) + `issue_attachments`. See the 2026-10-11 section.
- **Prisma 7** changed its config model mid-project: connection info now lives in `backend/prisma.config.ts`, and `PrismaClient` needs an explicit driver adapter (`@prisma/adapter-pg`) — the old `url = env(...)` inside `schema.prisma` no longer works.

## Building creation, add-by-ID and issues (2026-10-11)

Three improvements of existing concepts (no new product areas); migrations `20261011000000_add_by_id_no_join_password` and `20261011010000_messages_to_issues` (the second keeps existing messages as `opened` issues; the old general/urgent/maintenance type is gone — issue types come later).

**1. Onboarding + waiting home.** Steps: language → name → appearance (light/dark/system, applied live) → phone (skippable) → picture (skippable, `AvatarEditor` with its crop step) → saved on finish via `PATCH /users/me` / `PUT /users/me/avatar` (best effort; Settings can redo them). A user in no building sees `components/NoBuildingHome.tsx`: their `users.id` with *Copy*, what to do with it, a short "what is buildy" placeholder (pictures to be designed), *Create a building*, and Settings. `App.tsx` re-checks `/buildings/mine` when the tab regains focus while waiting (+ a *Check again* button). Settings works without a building (the leave section hides) and shows the user ID (it used to show the Cognito `sub`, which is not the ID management needs). Removed: `JoinBuildingStep`, `AccountSetup`, the join password, the join rate limiter, `building_users.requested_*`, `buildings.password_hash`, `GET /buildings`.

**2. Creating a building and adding residents.** `POST /buildings` (any user, picks committee head / management company) and `POST /admin/buildings` share `BuildingsService.createBuilding` (one transaction: building, contact links, creator's membership + role, residents). `POST /buildings/preview-users` returns name/picture for pasted IDs (flags already-member/blocked when given a building; needs management of it). `POST /buildings/:id/manage/members` adds up to 200 residents at once, all or nothing (404 unknown, 409 already members, 403 blocked, 400 duplicates in the list). UI: `ResidentsEditor` — paste any text, UUIDs are extracted, a table with a *Set for everyone* row (owner/renter, floor, payment method; empty fields are left alone) and per-row apartment number etc. It is the `residents` step of `CreateBuildingWizard` (moved to `components/`, `asAdmin` skips the role step and doesn't make the admin a member) and `AddResidentsDialog` (Members tile and admin console Members tab). A creator can't list their own ID as a resident in the wizard, but an admin can add themselves to an existing building.
- Gotcha: an ID that doesn't exist is reported back ("N IDs not found") rather than failing the whole paste; the server re-checks everything on submit.

**3. Issues.** `backend/src/issues/`: statuses `opened → in_process / denied`, `in_process → resolved` — the `TRANSITIONS` map in `issues.service.ts`; denied and resolved are final, nothing on them changes (not even for admins, who can only delete). Management only; a **note is required on every status change**, files optional; each change is an `issue_updates` row. While `in_process`, management **or the author** can add updates (`POST /issues/:id/updates`: text and/or files, stored as an `issue_updates` row with `from_status = to_status`). UI (`IssueDialog`): no dropdown — buttons *Accept* / *Deny* on an opened issue, *Add an update* / *Mark as resolved* on one in process; the note/files form appears only after clicking one. Ping stays allowed while `opened` and `in_process` (interpretation of "also when it's opened" — change `ACTIVE` in the service if only `in_process` was meant). Attachments (`issue_attachments`) on the report or on a change: ≤ 10 files per submission, ≤ 10 MB, the same allow-list as docs — the allow-list and "save under a generated key / roll back on error" moved into `uploads/uploads.ts` (`saveUpload`, `removeUploads`) and are shared with docs. **Ping**: the author, only while `opened`/`in_process`, once per 7 days (`last_pinged_at ?? created_at`), sets `last_pinged_at`; the list sorts active issues by that, so a ping brings the issue back to the top and shows a *Pinged* badge. Notifications for pings come with the mobile app. The author edits/deletes only while `opened`; admins any time. UI: `IssuesCard` (list, status filter, report dialog with files) and `IssueDialog` (report, files, history, ping, change status); tile id `messages` → `issues`; shared file helpers in `utils/files.ts`.

**i18n**: new strings are English + Hebrew; Arabic, Russian, French and Spanish fall back to English for them (`TRANSLATIONS` types those four as `Partial`; `t()` already falls back). Strings whose meaning changed (`settings.userId`, `members.removeHint`) were dropped from those four languages for the same reason. Translate them in a later pass.

**Verified**: backend and frontend `tsc`/build clean; both migrations applied to a throwaway Postgres with old fixture rows (messages became `opened` issues, memberships kept, Prisma diff clean); 46 service-level checks against that DB (creating buildings, add-by-ID conflicts/blocks/all-or-nothing, issue permissions, status notes, ping timing and ordering, attachment access and deletion) — the throwaway script was deleted. **Not clicked through in the browser**: sign-in goes through Google/Cognito, so the UI flows (wizard, residents table, issue dialogs, onboarding steps) still need a manual pass with two accounts.

## Permissions & membership model (agreed 2026-10-06; join password and suggestions superseded 2026-10-11)

Decided by answering the open questions of the old NEXT_ITERATION.md together:

| Topic | Decision |
|---|---|
| Hierarchy | Admin → Committee head = Management company (same powers) → Resident (owner = renter). |
| Level-2 powers (own buildings only) | Edit members' **technical info** (apartments, owner/renter, floor, size, payment method), **remove** or **block** members, **edit building details** (description, door code, contact links), **add residents by user ID**, **change issue statuses**. Can't remove/block themselves, peers or admins. |
| Admin-only | Create/delete/rename/move buildings, contact links, role assignment, editing/deleting other people's issues and docs, `admin:grant`. |
| Private info (user edits own) | Name, profile picture, phone (optional), language, theme, home layout. Residents can't edit apartment/owner-renter/payment info any more. |
| Onboarding | Language, name, appearance, optional phone and picture (since 2026-10-11). Nothing about a building: management sets the apartment when adding the user. `users.user_type` dropped. |
| Remove vs Block | Remove = management can add them again. Block = `building_blocks` row, adding refused (403) until unblocked. |
| Building list | `GET /buildings` (the public list used by the old join screen) was removed on 2026-10-11 — nothing exposes other buildings' names any more. |
| Neighbour details | Everyone sees name, picture, apartments, floor, owner/renter. **Phone, size and payment details** only for management + admin. |
| Account deletion | `DELETE /users/me` erases the user row (+ picture file); memberships/roles/apartment links cascade; their issues/docs stay with `author`/`uploader` = NULL → shown as "Former resident". The Cognito login remains — signing in again creates a fresh empty account. |
| Multi-building | Many memberships per user, a role per building, **several apartments per building**. |
| Profile picture | Upload own (PNG/JPEG/WebP/GIF ≤ 2 MB) → `UPLOADS_DIR/avatars/<userId>-<uuid>.<ext>`, served by `GET /users/:id/avatar` only to the user, admins and people sharing a building. Default = Google photo URL (`users.google_picture`, refreshed from the token's `picture` claim); initials as fallback. The file name changes per upload → `picture.version` tells clients to refetch. |
| Preferences | Stay on the device (language, theme, home layout). |
| Not this iteration | Audit log, monthly fees, payment tracking. `payment_method` is technical info set by management. |

**Data model behind it** (migration `20261006120000_apartments_blocks_avatars`, hand-written to *move* data):
- `building_users` = membership only (the `requested_*` join suggestion columns were dropped on 2026-10-11).
- `apartments` (per building, unique number; floor, size, fee, payment method) + `apartment_residents` (user ↔ apartment with owner/renter) — so one user can hold several apartments and an owner + renter can share one.
- `building_blocks` (who, blocked by whom, when).
- `users.avatar_src`, `users.google_picture`; `users.user_type` dropped; `messages.author` (now `issues.author`) / `docs.uploader` nullable with `ON DELETE SET NULL`.
- Old rows were mapped with fixture rows on a throwaway DB copy before running on the dev DB.

**Code map**: access checks in `BuildingsService` — `requireMember` (member or admin), `requireManager` (management of *that* building or admin), `requireCanActOn` (no self/peer/admin removal unless admin). Management endpoints: `backend/src/buildings/building-manage.controller.ts` (`/buildings/:id/manage/*`). Profile/avatar/account: `backend/src/users/*`. Shared upload path safety: `backend/src/uploads/uploads.ts` (`uploadPath`). Verified with a permission matrix (temporary users/buildings, cleaned up).


**Gotcha**: after deleting a backend source file, the dev container's `nest --watch` can keep failing on a stale `backend/tsconfig.build.tsbuildinfo` / `dist` — delete both and `docker compose restart backend`.

## Frontend for multi-building + management (2026-10-06, phase B)

- **Buildings**: `App.tsx` loads `GET /buildings/mine` into a list; the shown one is `buildy_current_building` (falls back to the first). `Dashboard` top bar has a **building switcher** (`BuildingSwitcher`) with *Create a building*. No buildings → `NoBuildingHome` (2026-10-11).
- **Onboarding** is language + name; `UserTypeStep`, `USER_TYPE_OPTIONS` and the `userType.*` labels are gone.
- **My apartments** (`components/MyApartmentsCard.tsx`, replaced `MyUnitCard`): read-only.
- **Members** (`components/MembersCard.tsx`): `UserAvatar` pictures; when `building.canManage`: phone numbers, **Add residents** (2026-10-11, see below), **Manage** dialog per member (`ManageMemberDialog`: apartments rows → `PUT …/manage/members/:id/apartments`, Remove / Block with confirm), **Blocked** list with Unblock. Remove/Block hidden for yourself, other management and admins unless you're an admin (backend enforces it too). Admin role picker unchanged.
- **Building tile**: *Edit details* opens the same `components/EditBuildingDialog.tsx` as the admin console (moved out of `AdminPanel`; UI only — callers pass `onSave` / `onAddLink` / `onRemoveLink`). Admins: every field via `/admin/*`. Building management: name/city/address shown read-only, description/door code via `PATCH …/manage/details`, contact links via `…/manage/contact-links` (2026-10-08). The user menu shows the account name (`currentUser.name`), not the token's.
- **Profile pictures**: `components/UserAvatar.tsx` — uploaded picture (fetched once per `userId:version` with the auth header and cached as an object URL) → Google photo (`referrerPolicy="no-referrer"`) → initials. Used in members, the user menu and Settings.
- **Settings → Profile**: edit name + phone (`PATCH /users/me`), change/remove picture (≤ 2 MB, client-side check too), the role field is gone. **Delete account** is real now (`DELETE /users/me` → sign out).
- Issues/docs with a null author show **"Former resident"** (`common.formerResident`).

## Iteration 3 (2026-10-06): real resident view, AWS-style grid, picture cropping, account setup

- **View as any role (2026-10-08)**: the wrench's switch became a *View as* picker (Admin / Committee head / Management company / Resident); `X-View-As` carries the role, stored in localStorage `buildy_view_as` (old `buildy_view_as_resident=true` migrates to `resident`). Backend `viewedRole(user)` honours management roles only for real admins; `isManager(user, building, asRequester)` applies the preview only to the caller (targets keep their real role). Earlier notes, still valid for the resident case — **View as resident is real now**: `frontend/src/utils/api.ts` sends `X-View-As: resident` while the toggle is on (set from the remembered toggle before the first fetch — it can only remove powers, so sending it before we know the user is an admin is harmless). Backend: `backend/src/auth/request-context.ts` — an Express middleware (`main.ts`, first) stores the flag in `AsyncLocalStorage`; `effectiveAdmin(user)` / `viewedRole(user)` (was `actingAsResident()`) are used by `AdminGuard`, `BuildingsService` (`requireMember`, `isManager`, `mine`/`detail` → `myRole: resident`, `canManage: false`, `members` → no phones/requests, `requireCanActOn`), message/doc author checks and avatar access. `GET /users/me` keeps the real `isAdmin` so the wrench can switch back. In tests, register the middleware on the test app (`app.use(requestContextMiddleware)`).
- **Picture bugs, root causes**: (1) "the old picture keeps showing" — `GET /users/:id/avatar` was one URL with `max-age=86400`, so the browser cache served the old image after a new upload; now the client requests `?v=<version>` and the response is `immutable` (new picture = new URL). (2) "Cancel still applied it" — the file was uploaded the moment it was picked. Now `AvatarEditor` → crop dialog (**react-easy-crop**, round, outside dimmed + blurred via a `backdrop-filter` layer with a circular mask) → *Save* stages a 512×512 JPEG; only the profile's **Save** uploads/removes (`StagedPicture` in `Settings.tsx`), *Cancel* drops it. Badge: **+** without an uploaded picture, **pencil** with one; it opens *Upload file* / *Remove picture*. The parent owns the staged preview URL and revokes it.
- **AWS-style grid** (replaces the 12-column grid; stored layouts moved to key `buildy_home_layout_v2:<sub>`, old ones ignored): 4 / 2 / 1 columns (`lg ≥1100 / md ≥700 / sm`), row height = 0.41 × column width (clamped 105–195 px; was 0.55 / 140–260 until 2026-10-08) so cells are rectangles at any width (`rowHeightFor`). Sizes 1–4 × 1–3 cells; custom constraint `noStrips` keeps long side ≤ 2× short side (grow the other side first). Quick actions are no longer a tile (2026-10-08): plain buttons between the welcome header and the grid; `loadLayouts` drops the old `actions` item from stored layouts (`knownTiles`) so saved arrangements survive. While dragging/resizing, `GridBackground` (`react-grid-layout/extras`) fades in behind the tiles with the same corner radius, and the placeholder fills the target cells. Tile radius is 25% smaller than other cards (`TILE_RADIUS = 3` theme units).
- **Gap filling + RTL (2026-10-08)**: custom `fillGapsCompactor` (`utils/homeLayout.ts`) — in reading order each tile takes the highest, then left-most free spot, so gaps fill upward *and* sideways. Not the library's `wrapCompactor`: it ignores tile height (2-row tiles overlap). react-grid-layout is LTR-only (under `dir=rtl` tiles were offset, leaving a big right margin), so the grid box is `dir="ltr"`, each `.tile-body` gets the language `dir` back, and RTL renders `mirrorLayouts(layouts)` (x → cols − x − w), mirroring back in `onLayoutChange`; the compactor packs in LTR space and mirrors, so stored layouts are the same for every language. `body` gets `user-select: none` while dragging/resizing.

## Session 2026-10-08: home polish, sign-in fixes, view-as roles, approvals

Everything below is detailed in the sections above (search for "2026-10-08"); this is the index.

**Home screen** (`components/Dashboard.tsx`, `utils/homeLayout.ts`)
- Quick actions left the grid: plain buttons under the welcome header. The `actions` tile id is gone; stored layouts drop it (`knownTiles`) instead of resetting.
- Top bar is `position: sticky`; the avatar menu (`UserInfo`) moved inside it (was a fixed floating avatar). The menu shows `currentUser.name` — the Cognito token often has no `name`, which showed "User".
- Layout editing on by default (key `buildy_home_layout_edit_v2`); the Reset / Done bar appears only after a real move/resize; *Done* hides it. Dashed tile outline on hover only.
- Cells 25% flatter (`CELL_RATIO` 0.41, clamp 105–195 px).
- `fillGapsCompactor`: gaps fill upward and sideways. Packs in LTR space, so RTL and LTR store the same layout.
- RTL fix: grid box forced `dir="ltr"` + mirrored layouts; tiles get the language `dir` back.
- No text selection while dragging (`body` `user-select: none` while interacting).

**Sign-in** (`context/AuthContext.tsx`, `utils/cognito.ts`, `App.tsx`)
- Real sign-out through Cognito `/logout` + `prompt=select_account` → switching Google accounts works.
- Returning users skip onboarding: `GET /users/me` returns `onboarded`; `App` restores the profile + language from it when the browser has none.
- Sign-out also clears per-account device keys (`buildy_current_building`, `buildy_view_as`, onboarding profile).
- **Gotcha**: Cognito matches `logout_uri` exactly. Our app client's *Allowed sign-out URLs* have **no trailing slash** (`http://localhost:8080`, `http://localhost:5173`, `https://staging.d3le7jv6afw3w7.amplifyapp.com`), so the app sends `window.location.origin`. A mismatch shows up as a redirect to `/login?…&logout_uri=…` → 400. Check with `curl -s -o /dev/null -w '%{redirect_url}' "<domain>/logout?client_id=<id>&logout_uri=<url>"` — a registered URL redirects straight back to it.
- Only the **staging** pool/app client was configured; a mistaken edit on production was reverted the same day.

**Admin tools** (`admin/AdminFab.tsx`, `auth/request-context.ts`)
- *View as* picker: Admin / Committee head / Management company / Resident. `X-View-As: <role>`; management roles honoured only for real admins (no privilege escalation from a hand-made header); the preview applies to the caller only (`isManager(…, asRequester)`).

**Building management**
- Building tile *Edit details* = the admin console's dialog (`components/EditBuildingDialog.tsx`, shared). Management: name/city/address read-only; description, door code and contact links editable. New `POST/DELETE /buildings/:id/manage/contact-links[/:linkId]`; a manager can only delete links of their own building. Link validation shared in `backend/src/buildings/contact-links.ts`.

**Verification done**: frontend `tsc` and backend `tsc` clean; compactor/mirroring checked with a small Node script; new routes confirmed in the Nest startup log. Not yet clicked through in the browser by the user at the time of writing. Jest isn't installed (only the scaffold e2e spec exists), so no automated tests ran.

## Session 2026-10-12: undo window, widgets, footer

- **Undo (5 min)**: the author of an issue update or a resolve can take it back while it is their newest update (`IssueUpdate.undoneAt`, `IssuesService.undo`). Accept/deny stay final. Undo hides the row and returns it as `draft` (text + files) so the form refills; the draft is deleted 5 min after the undo or when the author sends something new (lazy purge in `get`/`list` — no cron). Residents see "resolved" immediately; there is no pending state.
- **Widgets**: each user's removed tiles are device-only (`buildy_home_hidden_v1:<sub>`, `loadHiddenTiles` in `homeLayout.ts`). Hidden tiles keep their positions in the saved layout (merged back in `Dashboard.onLayoutChange`) so the layout stays "complete". The remove button shows when layout editing is on (also on phones); *Reset layout* also restores hidden tiles.
- **Home grid = our own `HomeGrid.tsx` (2026-10-12, replaced react-grid-layout's `Responsive`)**: the AWS console's board (Cloudscape, dnd-kit based) is smooth because the grabbed tile is moved straight on the DOM by the pointer and React only re-renders when the pointer enters another grid cell (then only tiles that moved; tiles are `memo`). Same here: 4 cols lg+md / 1 sm, row ratio 0.4 clamped 72–120px, 16px margin, tile radius capped on background cells, no CSS transitions. Layout engine = `settle()` (moved tile fixed, overlapped tiles are pushed to the very bottom, then every other tile floats up into free space above it (vertical only) — all glide (180ms, only while another tile is dragged), `fitWithin` if over the page limit, otherwise the move is ignored). Resize handle follows the pointer; green background cells = covered cells. Widgets dragged in from the drawer use native HTML5 DnD on the grid root. react-grid-layout is only still used for `useContainerWidth` and types. Saved layouts: `buildy_home_layout_v6:<sub>`. Don't add `useState` updates to the pointer-move path.
- **No empty rows**: `closeEmptyRows` (homeLayout.ts) removes any row no widget touches — run at the end of `HomeGrid.settle`, when a widget is removed (`changeHidden`) and when one is added (`addTile`).
- **Page-length limit**: per breakpoint, rows ≤ default rows + 4 (`maxRowsFor`, lg/md 13; phones fixed). Enforced inside `HomeGrid.settle` while moving/resizing (a spot that can't fit is ignored) and in `Dashboard.addTile` for drawer drops; no message is shown.
- **Widgets drawer** (`WidgetsDrawer.tsx`): persistent side drawer (right, left in RTL, no backdrop) listing removed widgets; cards are HTML5-draggable onto the grid via react-grid-layout's `dropConfig`/`onDrop` (`Dashboard.addTile` stores the drop x/y; RTL converts back to stored LTR coordinates). The grid's `__dropping__` placeholder is filtered out in `onLayoutChange`, or the saved layout would stop being "complete". No drop on phones; tap/click adds the widget back at its stored spot.
- **Footer** (`Footer.tsx`, modelled on the AWS console bar): fixed 36px bar; Feedback left, Buildy centre (about page), copyright/Privacy/Terms right. Pages are placeholders (`InfoPage.tsx`). The admin wrench moved up (bottom 56) to clear it.
- **TODO (remind the user)**: `FeedbackDialog` stores nothing yet — needs a DB table (author, building, text, type) and an admin-panel list.

## Customizable home grid (2026-10-06, phase C — superseded by the AWS-style grid above)

- Library: **react-grid-layout 2.x** (MIT, React 19-compatible; v2 API = `Responsive` + `useContainerWidth`, `dragConfig` / `resizeConfig`). Its `css/styles.css` includes the resize-handle styles.
- `frontend/src/utils/homeLayout.ts`: tile ids (`building, apartments, members, issues, docs` — `messages` was renamed on 2026-10-11, so a stored layout falls back to the default once), breakpoints `lg ≥1100 / md ≥760 / sm` with 12 / 8 / 1 columns, `DEFAULT_LAYOUTS` (same for every building), load/save/reset per user on the device. A stored layout missing a tile falls back to the default for that breakpoint, so adding tiles later is safe.
- `Dashboard.tsx`: tiles glide (CSS-transform animation), `bounded: true` keeps them inside the grid, drag only by the hover handle (`.tile-drag-handle`) so buttons/scrolling inside tiles still work, resize from the corner. Editing is on by default since 2026-10-08 (key `buildy_home_layout_edit_v2`, so older "off" choices were dropped); Settings → App preferences → *Edit home layout* turns it off. Never on phones (single column). Changes are saved only while editing (not on breakpoint re-flows). The info bar (*Reset layout* / *Done*) appears only after a tile actually moved or resized (`onDragStop`/`onResizeStop` compare old vs new item); *Done* just hides it, editing stays on. Tile dashed outline shows on hover only. Nothing is locked. No special admin behaviour (decided).
- Tile content fills the tile and scrolls inside it (`.tile-body` CSS in `Dashboard`).

## Reference info

**Seeded buildings** (`backend/prisma/seed.ts` — create-only upsert; they start with no members since there is no join password any more — as an admin, add people from the console's Members tab, pasting their user IDs, yourself included):

| Building | Address | Door code | Contact links |
|---|---|---|---|
| Maple Court | 14 Ben Yehuda St (city 5000, Tel Aviv) | 1948 | WhatsApp, email |
| Rothschild Gardens | 82 Rothschild Blvd (city 5000) | 0821 | WhatsApp, phone |
| HaYarkon Terrace | 210 HaYarkon St (city 5000) | 2100 | phone |

**Mock users** (seed, create-only): ten residents with fixed IDs `00000000-0000-4000-8000-000000000001` … `…000000000010` (Noa Levi, Daniel Cohen, Maya Mizrahi, Yossi Peretz, Tamar Katz, Omer Biton, Shira Dahan, Avi Friedman, Lior Azulay, Rina Shapiro; `mockN@buildy.test`). They can't sign in — they exist so a committee head has IDs to paste into *Add residents*. The seed prints the list on every start. The dev compose command now runs `prisma generate` first (a stale Prisma client crashed the seed after the schema change, which kept the backend from starting).

Contact links are only added to a seeded building that has none, so links you edit survive re-seeding.

**Ports**: backend `3000` · frontend via Docker `8080` · frontend bare dev `5173` · Postgres `5433` (not `5432` — that's taken by an unrelated project's container on this machine).

**Cognito User Pool ID**: not written here on purpose — check your local `backend/.env` or root `.env`. If you've lost it, it's in AWS Console → Cognito → User pools → your pool → "User pool ID".

**Env files**: `backend/.env`, `frontend/.env.local`, root `.env` — all local-only, all gitignored, all required (nothing has a fallback default anymore). Each has a matching `.env.example` in the same folder showing what's needed, with no real values.

## How to run it

- Full stack, **dev mode with live reload** (default): `docker compose up -d` → app at `http://localhost:8080`. `docker-compose.override.yml` is merged automatically: source is bind-mounted, Vite dev server + `nest --watch`, file polling (Windows mounts don't send change events). Edits show up without rebuilding.
  - New npm dependency → `docker compose up -d --build -V` (rebuild + fresh container node_modules).
  - Schema change → write the migration (see [backend/README.md](../backend/README.md#common-commands)), `docker compose exec backend sh -c "npx prisma migrate deploy && npx prisma generate"`, then `docker compose restart backend`. (Also run `npx prisma generate` on the host so your editor sees the new types.)
- Full stack, **production-like** (compiled backend + nginx): `docker compose -f docker-compose.yml up -d --build`.
- Bare-metal backend: `docker compose up -d postgres`, then `cd backend && npm run start:dev`
- Bare-metal frontend: `cd frontend && npm run dev` → `http://localhost:5173`

## Known gaps / next steps

Known gaps:
- No audit log of management/admin actions (decided: not this iteration).
- Payments are a demo: *Pay* is fake, there is no undo for a paid month, no partial payments, no late/overdue logic and no reminders. Only the current month can be changed. Existing users' saved home layouts reset once (the new Payments tile changes the tile set).
- Deleting an account doesn't delete the Cognito/Google login; signing in again creates a fresh empty account.
- Uploaded files (documents, pictures) live on a local Docker volume — a real deployment will need S3 (or similar) instead.
- No test runner: `jest` isn't a dependency and the only spec is the Nest e2e scaffold (`test/app.e2e-spec.ts`, which also fails to type-check: missing `supertest` types).
- Production's Cognito app client has no sign-out URLs yet — add them (no trailing slash) before this sign-out code ships to production.

Next steps (moved from the old NEXT_ITERATION.md, which was deleted once its questions were answered):
- **Apartment center** — the My apartment(s) tile opens a placeholder dialog per apartment (`ApartmentCenter` in `MyApartmentsCard.tsx`); to be designed (likely the apartment's payment log, documents, residents).
- **Fees & payments** — the demo is built (2026-10-22). Next: a real payment provider (fill `payments.provider` / `external_ref`, async `pending` / `failed`), receipts and maintenance bills through Documents as expenses, reminders, an audit log of payments and fee changes.
- **Notifications** — urgent messages by email / WhatsApp link / web push; unread badges.
- **Message replies / comments**, pinned messages, read receipts for urgent notices.
- **Document folders/categories** (rules, budget, minutes, contracts); Excel preview via SheetJS (maintained build from cdn.sheetjs.com).
- **Invite links / QR codes** — an easier way than copying IDs around; would also let a resident show up without typing anything.
- **Audit log** of management/admin actions.
- **Deployment** — host the backend (Fargate/EC2/Lambda), move uploads to S3, production DB.
- **Quality** — e2e tests (Playwright) for the main flows, keep the HTTP permission-matrix tests as a real test suite, triage `npm audit`.
- Backend has no real deployment target yet.
- `npm audit` flags several vulnerabilities in dev-only tooling (NestJS CLI's Angular deps) — not yet triaged.
- Policy: never push to production — only the `staging` branch.

## Phone testing (dev)
- Same Wi-Fi, no login: `http://<LAN_IP>:8080` works (use `http://` explicitly). `LAN_IP` lives in the root `.env` (feeds `CORS_ORIGIN` in `docker-compose.override.yml`); `api.ts` swaps `localhost` in `VITE_API_URL` for the page's hostname.
- Login/logout can't work from the LAN IP: Cognito only accepts `http://` callbacks for `localhost`. Test it on the Amplify staging deploy (or an HTTPS tunnel).

### Info page hero (2026-10-12)
- `InfoPage` kind `info`: big "Buildy" title on the normal app background with `CrowdCanvas` walking along the bottom above the footer: our own line-drawn people, belly up, in 3/4 view (small round heads, dot eyes, solid hair, white or solid-black tops, optional glasses/cap/beanie, men and women), ~20% drawn in app green. Modelled on a black-and-white walking-people illustration set the user likes. All drawn in code — no images, no libraries. Tried and dropped: sunlit WebGL cutting-mat background, Skiper/OpenPeeps sprite crowd (CDN + license), DiceBear Open Peeps busts (front view, coloured), side-profile heads with beards/headphones/etc. (looked off). No free CC0 walking-people set in this line style was found.
- Footer links toggle their page (no back button). `html { scrollbar-gutter: stable }` keeps the centred "Buildy" from shifting when a page loses its scrollbar.

### Private S3 file storage (2026-10-18, local Docker only)
- Bytes live in one private bucket `buildy-dev-files-<accountId>` (us-east-1; Block Public Access, SSE-S3, ACLs off, TLS-only policy, CORS GET for `localhost:8080` and `<LAN_IP>:8080`). The DB still stores only the key (`docs.src`, `issue_attachments.src`, `users.avatar_src`); formats are in `dataStructure.md`.
- Uploads still pass through the backend (multer memory → `putObject`). The file endpoints (`/docs/:id/file`, `/issue-attachments/:id/file`, `/users/:id/avatar`) run the same access checks, then return `{ url }`: a presigned GET valid 5 minutes. `api.ts` `fetchPresigned` fetches it **without** the Authorization header and returns a Blob, so UI code is unchanged.
- IAM user `buildy-app-dev` (inline policy `buildy-s3-dev-objects`): Put/Get/Delete on `buildings/*` and `users/*` only, no ListBucket. Deleting a building reads its keys from the DB first (`DocsService.buildingFileKeys`) and deletes key by key. A missing object gives 403, not 404.
- A new LAN IP means updating the bucket's CORS rule. Old local files were not migrated (reseed). `UPLOADS_DIR` and the `uploads` volume are gone.
