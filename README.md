# buildy

A web app for the residents of an apartment building: one place for the building's messages, documents, members and contacts, in six languages (English, Hebrew, Arabic, Russian, French, Spanish — with right-to-left layouts for Hebrew and Arabic).

This README explains what the app does and how it works. For decisions, gotchas and environment notes see [DEVLOG.md](DEVLOG.md); for the API see [backend/README.md](backend/README.md); for the tables and the user hierarchy see [DATABASE.md](DATABASE.md).

## How it works for a user

1. **Sign in with Google** (via AWS Cognito's hosted login page). Google always asks which account to use, and **signing out** ends the Cognito session too, so you can switch accounts. Returning users skip onboarding — it's only for brand-new accounts.
2. **Onboarding** — pick a language and enter your name. This profile is kept in the browser and mirrored to the backend so neighbours see your name.
3. **Join a building** — choose it from the list and enter its shared **join password** (like an invite code, handed out by building management). Wrong passwords are limited to 5 tries per 15 minutes; blocked users can't rejoin.
4. **Several buildings** — you can belong to more than one (e.g. owner in one, renter in another, committee head in a third). The **building switcher** in the top bar changes buildings and has *Join another building*.
5. **Home screen** for the selected building — the welcome header, a row of **quick action** buttons under it (report an issue, post a message, upload a document, see the members), then a grid of tiles. While your apartment isn't known yet, a **Finish setting up your account** banner asks for your apartment number and whether you own or rent (required — building management confirms it), then phone and profile picture (optional). It opens by itself the first time.
   - **Building** — address and city, description, door code, number of residents on buildy, and the building's **contact links** (WhatsApp group, phone, email — tap to open). Building management sees *Edit details* — the same editor as the admin console: description, door code, join password and contact links (name, city and address stay admin-only and show read-only).
   - **My apartments** — read-only: your apartments in this building (number, floor, size, owner/renter, payment method), set by building management; a "waiting for confirmation" note while your join suggestion is pending.
   - **Members** — profile pictures; **building management on top** (committee head and management company), then residents by apartment. Building management also sees phone numbers and pending suggestions — with a one-click **Approve** (gives them the apartment and owner/renter they asked for) — and gets **Manage** per member (set apartments / owner-renter / floor / size / payment method, remove, block) and the **Blocked** list (unblock).
   - **Customizable layout (AWS-console style)** — on by default (*Edit home layout* in Settings → App preferences turns it off): hover a tile to drag it by its handle or resize it from the corner. After you move or resize a tile, a bar offers *Reset layout* and *Done* (hides the bar). The grid has 4 columns of rectangle cells; while you drag or resize, the grid appears behind the tiles, the cells the tile will take are filled in, and the other tiles move up and sideways to fill empty space. Right-to-left languages show the layout mirrored. Sizes are limited (1–4 cells wide, 1–3 tall, never more than twice as long as wide) so tiles don't turn into strips. *Reset layout* restores the default. One layout for all your buildings, saved on the device; phones show a single column.
   - **Messages** — anyone can post. Each has a type: *general*, *urgent* or *maintenance* ("report an issue" is a maintenance message). Filter by type; the author (or an admin) can edit or delete.
   - **Documents** — anyone can upload (PDF, Word, Excel, PowerPoint, images, text; up to 10 MB), with a **preview before uploading**. Clicking a document opens a **viewer pop-up** (full-screen toggle, download button): PDFs in the browser's built-in PDF viewer, images and text directly, Word (.docx) rendered with [docx-preview](https://github.com/VolodymyrBaydalka/docxjs); Excel/PowerPoint/.doc show a "download to open" note. The uploader (or an admin) can rename or delete.
6. **User menu** (avatar, right end of the top bar — the top bar stays pinned while scrolling) — *Edit profile*, *App preferences*, sign out.
   **Admin wrench** (floating 🔧 button, bottom corner, admins only) — *View as* picker (Admin / Committee head / Management company / Resident) and *Open admin console*.
7. **Settings** — three sections: **Profile** (your private info: name, profile picture — the **+** / pencil on the avatar offers *Upload file* (with a round crop step) or *Remove picture*; changes apply when you press *Save* — Google photo by default — and an optional phone only building management sees), **App preferences** (language, Light / Dark / System appearance — dark is a navy, AWS-console-style palette with buildy's green accent — and the home-layout editing switch; all saved on the device), and **Account** (admin console, leave the current building, delete account — your messages and documents stay, shown as "Former resident").

You stay signed in across reloads for up to 30 days: the app silently renews Cognito's 1-hour login token with the refresh token, both on page load and shortly before it expires.

## Roles

| Who | What they can do |
|---|---|
| **Resident** — owner or renter (anyone who joined) | See their building; post messages and upload docs; edit/delete their *own* messages and docs; edit their own **private info** (name, picture, phone, preferences). Apartments and owner/renter are set by building management. |
| **Committee head / management company** (same level, per building) | Everything a resident can, plus in their building: edit members' **technical info** (apartments, owner/renter, floor, size, payment method), confirm join suggestions, **remove** or **block/unblock** residents, edit the building's description, door code and join password, see phone numbers. They can't remove/block themselves, each other or admins. Assigned by an admin. There is no separate committee-member role: every resident is a member. |
| **Admin** (global super user, `users.is_admin`) | Everything, in every building: create / edit / delete buildings (with a step-by-step wizard for new ones), manage contact links, assign member roles, remove or block anyone, and edit/delete any message or document. Admins work from the **admin console** (opened from the floating wrench): a searchable building list on the side to jump between buildings, and per-building tabs — Overview, Members, Messages, Documents. The wrench also has **View as** — Admin, Committee head, Management company or Resident — which makes the app *and the backend* treat the admin as that role in every building (management roles keep building-management powers, but no admin powers) until switched back to Admin. |

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
- **Uploads** (documents and profile pictures) are stored on disk under `UPLOADS_DIR` (a Docker named volume, `uploads`, in compose) with server-generated file names; the database keeps the details.
- **Permissions** are enforced in the backend (`BuildingsService.requireMember` / `requireManager`, `AdminGuard`), not just by hiding buttons.

### Data model

Full details, diagrams and the user hierarchy: [DATABASE.md](DATABASE.md).

| Table | Holds |
|---|---|
| `cities` | Official Israeli settlement list (CBS "סמל יישוב" code as the id), seeded from `backend/prisma/data/cities.json`. |
| `buildings` | Name, city, address, description, door code, hashed join password. |
| `users` | Cognito identity and private info: name, email, phone, profile picture, language, `is_admin`. |
| `building_users` | Membership (a user can be in several buildings) + the apartment/owner-renter they suggested when joining. |
| `apartments` / `apartment_residents` | The building's apartments (number, floor, size, fee, payment method) and who owns or rents each — several per user, owner + renter per apartment. |
| `building_blocks` | Users blocked from rejoining a building. |
| `users_roles` | A member's role in a building: `committee_head` or `management_company` (same level), or `resident`. |
| `contact_links` | A building's WhatsApp / phone / email contacts. |
| `messages` | Building messages with a type (`general`, `urgent`, `maintenance`); author null = "Former resident". |
| `docs` | Uploaded documents and their file metadata; uploader null = "Former resident". |

## Running it locally

Needs Docker, plus a root `.env` (copy `.env.example`) and `frontend/.env.local` (copy `frontend/.env.example`) filled with your own Postgres and Cognito values.

```bash
docker compose up -d        # dev mode with live reload → http://localhost:8080
```

- Code edits show up immediately — no rebuild.
- New npm dependency → `docker compose up -d --build -V`.
- Production-like check before pushing: `docker compose -f docker-compose.yml up -d --build`.

On start the backend applies database migrations and seeds the city list plus three demo buildings (passwords in [DEVLOG.md](DEVLOG.md)).

## Branches

Work goes to the `staging` branch; nothing is pushed to production directly.
