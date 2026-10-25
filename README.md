# buildy

A web app for the residents of an apartment building: one place for the building's issues, documents, members and contacts, in six languages (English, Hebrew, Arabic, Russian, French, Spanish — with right-to-left layouts for Hebrew and Arabic).

**The idea:** running an apartment building usually means a WhatsApp group, paper notes and someone's personal bank account. buildy gives each building one clear place for its people, problems, documents and money, built on trust between neighbours and the committee. Coming next: monthly fees per apartment (the committee head sees what was collected against the monthly goal; each resident sees only their own part), then real online payments, and receipts for maintenance bills so the building can see money coming in and going out.

This README explains what the app does and how it works. For decisions, gotchas and environment notes see [worklog](docs/worklog.md); for the API see [backend/README.md](backend/README.md); for the tables and the user hierarchy see [dataStructure](docs/dataStructure.md).

## How it works for a user

1. **Sign in with Google** (via AWS Cognito's hosted login page). Google always asks which account to use, and **signing out** ends the Cognito session too, so you can switch accounts. Returning users skip onboarding — it's only for brand-new accounts.
2. **Onboarding** — set up your profile and preferences: language, your name, light / dark / system appearance, and optionally a phone number and a profile picture. Nothing about a building yet. The profile is mirrored to the backend so neighbours see your name.
3. **Waiting for your building** — your home screen shows **your ID** (with a *Copy* button) and what to do with it: send it to your committee head or management company. They add you to the building and set your apartment; the building then appears on your home screen (the app checks again when you come back to the tab, or press *Check again*). Until then you can only edit your profile and settings. Your ID is also in Settings → Profile.
4. **Managing a building?** *Create a building* (on that waiting screen, or from the building switcher) — a step-by-step wizard: your role (committee head or management company), name, city, address, details, contact links, and optionally your **residents**: paste everyone's IDs in one go (any text — the IDs are picked out), see who they are, then set apartment number, owner/renter, floor and payment method for each in one table, with a *Set for everyone* row for the shared values. You can add more residents later from the Members tile (*Add residents*). Nobody can get into a building unless its management adds them, so a building created by mistake (or for fun) stays empty.
5. **Several buildings** — you can belong to more than one (e.g. owner in one, renter in another, committee head in a third). The **building switcher** in the top bar changes buildings and has *Create a building*.
6. **Home screen** for the selected building — the welcome header, a row of **quick action** buttons under it (report an issue, upload a document, see the members), then a grid of tiles.
   - **Building** — address and city, description, door code, number of residents on buildy, and the building's **contact links** (WhatsApp group, phone, email — tap to open). Building management sees *Edit details* — the same editor as the admin console: description, door code and contact links (name, city and address stay admin-only and show read-only).
   - **My apartment(s)** — your apartments in **all** your buildings (the current one first; the title is singular when you have one). Click one to open its **apartment center**: its details (floor, size, owner/renter, payment method, fee, set by building management), **who pays** (an owner chooses), and the apartment's **payment log**. More will live there later.
   - **Members** — profile pictures; **building management on top** (committee head and management company), then residents by apartment. Building management also sees phone numbers, can **Add residents** by ID, and gets **Manage** per member (set apartments / owner-renter / floor / size / payment method, remove, block) and the **Blocked** list (unblock).
   - **Customizable layout (AWS-console style)** — on by default (the *Edit home layout* switch at the top of the widgets panel, or in Settings → App preferences, turns it off): hover a tile to drag it by its handle or resize it from the corner. A *Reset layout* button sits next to *Add widgets*. The grid has 4 columns of cells; while you drag or resize, the grid appears behind the tiles, the cells the tile will take are filled in, and the other tiles move out of the way and float up to fill empty space, like the AWS console. Right-to-left languages show the layout mirrored. Tiles are at least 2 columns wide (and 2 rows tall), or a single column that is at least 3 rows tall; up to 4 columns and 6 rows. The page can only grow 4 rows past its default height: if a move would stack tiles higher than that, tiles that would not fit are rearranged, and if they still don't fit the move is quietly cancelled. *Reset layout* restores the default. One layout for all your buildings, saved on the device; phones show a single column.
   - **Widgets** — each person chooses which tiles are on *their* home page: hover a tile and press ✕ to remove it, after confirming (always visible on touch screens), and use **Add widgets** (top row and bottom of the page) to open a side panel (right side; left in right-to-left languages) with the widgets that aren't on your page: **drag** one onto the grid where you want it (or click it to add; on phones, tap). An empty home page is fine, and it doesn't affect anyone else's. *Reset layout* brings everything back. Under the bottom button: "Want to see more widgets? Tell us" opens a feedback form.
   - **Issues** — any resident can report a problem, with pictures and files (up to 10, 10 MB each). Reports with pictures show small previews of them in the list and the issue window. Each issue has a **status**: it starts *opened*; the committee head / management company then **accepts** it (*in process*) or **denies** it, and an issue in process can be **marked resolved**. Denied and resolved are final. Accepting, denying and resolving each need a **note** (e.g. why it was denied) and can carry pictures or files; while an issue is in process, management and the author can keep **adding updates** (messages, pictures, files). The issue keeps its **history**. Posted something by mistake? The author of an update or a resolve has **5 minutes to undo** it: the note and pictures come back into the form to edit and send again (accepting and denying are final). Residents can **ping** their own opened or in-process issue once a week to bring it back to the top of the list. The whole building sees the issues; filter by status; the author can edit or delete while it's still *opened*. (Notifications will come with the mobile app.)
   - **Documents** — anyone can upload (PDF, Word, Excel, PowerPoint, images, text; up to 10 MB each), **several at once** (choose or drop many files; each gets its own title, and one that fails stays in the list with its error), with a **preview before uploading**. Pictures show a small preview in the list. Clicking a document opens a **viewer pop-up** (full-screen toggle, download button): PDFs in the browser's built-in PDF viewer, images and text directly, Word (.docx) rendered with [docx-preview](https://github.com/VolodymyrBaydalka/docxjs); Excel/PowerPoint/.doc show a "download to open" note. The uploader (or an admin) can rename or delete.
   - **Payments** (demo) — monthly fees per apartment.
     - **Setup:** building management sets payments up once (in the *Create a building* wizard, or in the tile for older buildings): months open **by hand** or **automatically on a day of the month**, a **default fee** for apartments without their own, and a **default payment method** (card, cash, bank transfer, Bit / PayBox). The settings button changes them later; changes apply to coming months.
     - **Management** sees a budget of *collected / goal* (the bar fills up, with a ✓ when everything is collected) and every apartment with who pays it and a paid / unpaid state. They mark one apartment as paid (choosing the **method** for that payment, pre-filled from the apartment) or *all* at once (each with its own method). Marking paid is final, no undo. An apartment's fee can be changed **for this month only or from now on**; paid months and past months never change.
     - **Payments log:** a full-screen table of every payment: the month it is for, apartment, amount, status, paid on, **who paid**, **method**, **who confirmed** it and **how** (marked by management, *Mark all*, or paid by the resident). Filter by month, apartment and method.
     - **Who pays:** in an apartment with an owner and a renter, the **owner** decides who pays (in the apartment center); by default the owner. Only the payer sees the *Pay* button.
     - **Residents** see only their own apartments: this month's amount, *Pay*, earlier months and each apartment's **payment log**, only from the time they were linked to the apartment (a previous resident's payments stay private).
     - For now *Pay* is a demo: it only marks the month as paid and no real money moves. Real online payments and receipts for maintenance bills are planned.
   **Footer** — a thin bar pinned to the bottom of the screen: *Feedback* on the left, *Buildy* in the middle (opens a page about the app), and the copyright, *Privacy* and *Terms* on the right (the pages are placeholders for now).
6. **User menu** (avatar, right end of the top bar — the top bar stays pinned while scrolling) — *Edit profile*, *App preferences*, sign out.
   **Admin wrench** (floating 🔧 button, bottom corner, admins only) — *View as* picker (Admin / Committee head / Management company / Resident) and *Open admin console*.
7. **Settings** — three sections: **Profile** (your private info: name, profile picture — the **+** / pencil on the avatar offers *Upload file* (with a round crop step) or *Remove picture*; changes apply when you press *Save* — Google photo by default — and an optional phone only building management sees), **App preferences** (language, Light / Dark / System appearance — dark is a navy, AWS-console-style palette with buildy's green accent — and the home-layout editing switch; all saved on the device), and **Account** (admin console, leave the current building, delete account — your issues and documents stay, shown as "Former resident").

You stay signed in across reloads for up to 30 days: the app silently renews Cognito's 1-hour login token with the refresh token, both on page load and shortly before it expires.

## Roles

| Who | What they can do |
|---|---|
| **Resident** — owner or renter (anyone building management added) | See their building; report issues and ping their own; upload docs; edit/delete their *own* docs, and their own issues while *opened*; edit their own **private info** (name, picture, phone, preferences). Apartments and owner/renter are set by building management. |
| **Committee head / management company** (same level, per building) | Everything a resident can, plus in their building: edit members' **technical info** (apartments, owner/renter, floor, size, payment method), **add residents by their user ID**, **change issue statuses** (with a note), **remove** or **block/unblock** residents, edit the building's description, door code and contact links, see phone numbers. They can't remove/block themselves, each other or admins. Anyone can create a building and become its committee head or management company; an admin can change roles later. There is no separate committee-member role: every resident is a member. |
| **Admin** (global super user, `users.is_admin`) | Everything, in every building: create / edit / delete buildings (with the same wizard, without becoming a member), manage contact links, assign member roles, remove or block anyone, change any issue's status, and edit/delete any issue or document. Admins work from the **admin console** (opened from the floating wrench): a searchable building list on the side to jump between buildings, and per-building tabs — Overview, Members, Issues, Documents. From a building's Overview an admin can **join** it (as resident, committee head or management company), so it appears in their own building switcher; **Open building** jumps straight to it in the app (joining first, with a role, if needed). Two more tabs: **Apartments** (every apartment with floor, size, residents, who pays, fee, method and this month's state) and **Payments** (the same budget, settings and payments log the committee head has). The wrench also has **View as** — Admin, Committee head, Management company or Resident — which makes the app *and the backend* treat the admin as that role in every building (management roles keep building-management powers, but no admin powers) until switched back to Admin. |

Making someone an admin: they sign in once, then
`docker compose exec backend npm run admin:grant -- their@email.com` (add `--revoke` to undo).

## Architecture

```
buildy/
  frontend/   Vite + React 19 + MUI. Talks to the backend with the user's Cognito id token.
  backend/    NestJS + Prisma 7 + PostgreSQL. Verifies every request's Cognito token.
  docker-compose.yml            postgres + backend + frontend (production-style images)
  docker-compose.override.yml   dev mode: live reload for both apps (merged automatically)
  amplify.yml                   deploys the frontend only (AWS Amplify Hosting)
```

- **Identity** is owned by Cognito. The backend's global guard verifies the `id_token` on every request and finds-or-creates the matching `users` row by its Cognito `sub`.
- **Uploads** (documents and profile pictures) are stored in a private S3 bucket under server-generated keys; the database keeps the details. Files open through short-lived (5 minute) links the backend issues only after its access checks.
- **Permissions** are enforced in the backend (`BuildingsService.requireMember` / `requireManager`, `AdminGuard`), not just by hiding buttons.

### Data model

Full details, diagrams and the user hierarchy: [dataStructure](docs/dataStructure.md).

| Table | Holds |
|---|---|
| `cities` | Official Israeli settlement list (CBS "סמל יישוב" code as the id), seeded from `backend/prisma/data/cities.json`. |
| `buildings` | Name, city, address, description, door code. |
| `users` | Cognito identity and private info: name, email, phone, profile picture, language, `is_admin`. |
| `building_users` | Membership (a user can be in several buildings) — created when building management adds the user's ID. |
| `apartments` / `apartment_residents` | The building's apartments (number, floor, size, fee, payment method) and who owns or rents each — several per user, owner + renter per apartment. |
| `building_blocks` | Users who can't be added to a building until unblocked. |
| `users_roles` | A member's role in a building: `committee_head` or `management_company` (same level), or `resident`. |
| `contact_links` | A building's WhatsApp / phone / email contacts. |
| `issues` / `issue_updates` / `issue_attachments` | Reported problems with a status (`opened`, `in_process`, `denied`, `resolved`) and weekly ping; the status history with each change's note; their pictures and files. Author null = "Former resident". |
| `docs` | Uploaded documents and their file metadata; uploader null = "Former resident". |
| `payments` | The permanent monthly-fee log: one row per apartment per month (amount, paid or not, paid on, who paid, who confirmed, how, method). Deleted only with the building. |
| `building_payment_settings` | A building's payments setup: how months open (by hand / on a day), default fee and default method. |

## Running it locally

Needs Docker, plus a root `.env` (copy `.env.example`) and `frontend/.env.local` (copy `frontend/.env.example`) filled with your own Postgres and Cognito values.

```bash
docker compose up -d        # dev mode with live reload → http://localhost:8080
```

- Code edits show up immediately — no rebuild.
- New npm dependency → `docker compose up -d --build -V`.
- Production-like check before pushing: `docker compose -f docker-compose.yml up -d --build`.

On start the backend applies database migrations and seeds the city list plus three demo buildings (empty — an admin adds people from the console's Members tab, using their user IDs).

**Automated tests (`e2e/`, Playwright):** with the Docker stack running, run once `cd e2e && npm install && npx playwright install chromium`, then `npm test` (or `npm run test:headed` to watch, `npm run report` for the HTML report). The suite signs in as the mock users, creates its own throwaway building through the API, walks the main flows (dev sign-in, payments across head / owner / renter, the admin console) and deletes the building at the end; it never touches real data or the Dev Playground. The payments flow waits for a fresh 5-minute dev period if one is about to end.

**Testing without Google (dev only):** in local Docker the sign-in page also shows *Dev: sign in as…* — pick one of the mock users to use the app as them, no Google account needed. A **Dev Playground** building is seeded where they hold every role (committee head, management company, owners, renters, an owner with two apartments) and one mock admin, **claudeAdminTesting**, exists for testing the admin console (no other mock user is an admin). This only exists in the local dev setup (`docker-compose.override.yml`); production never has it. In dev, a payments "month" also lasts only 5 minutes, for demos.

## Branches

Work goes to the `staging` branch; nothing is pushed to production directly.
