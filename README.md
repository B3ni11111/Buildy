# buildy

A web app for the residents of an apartment building: one place for the building's messages, documents, members and contacts, in six languages (English, Hebrew, Arabic, Russian, French, Spanish — with right-to-left layouts for Hebrew and Arabic).

This README explains what the app does and how it works. For decisions, gotchas and environment notes see [DEVLOG.md](DEVLOG.md); for the API see [backend/README.md](backend/README.md).

## How it works for a user

1. **Sign in with Google** (via AWS Cognito's hosted login page).
2. **Onboarding** — pick a language, enter your name, and say whether you're an owner, tenant, committee member or manager. This profile is kept in the browser and mirrored to the backend so neighbours see your name.
3. **Join a building** — choose it from the list and enter its shared **join password** (like an invite code, handed out by the committee).
4. **Home screen** for that building:
   - **Quick actions** — report an issue, post a message, upload a document, see the members.
   - **Building** — address and city, description, door code, number of residents on buildy, and the building's **contact links** (WhatsApp group, phone, email — tap to open).
   - **My apartment** — your own apartment, floor, owner/tenant, size and payment method (you edit these; the monthly fee is set by an admin).
   - **Members** — the **committee on top** (committee head first, then committee members and the building manager), then residents by apartment.
   - **Messages** — anyone can post. Each has a type: *general*, *urgent* or *maintenance* ("report an issue" is a maintenance message). Filter by type; the author (or an admin) can edit or delete.
   - **Documents** — anyone can upload (PDF, Word, Excel, PowerPoint, images, text; up to 10 MB), with a **preview before uploading**. Clicking a document opens a **viewer pop-up** (full-screen toggle, download button): PDFs in the browser's built-in PDF viewer, images and text directly, Word (.docx) rendered with [docx-preview](https://github.com/VolodymyrBaydalka/docxjs); Excel/PowerPoint/.doc show a "download to open" note. The uploader (or an admin) can rename or delete.
5. **User menu** (avatar, top corner) — *Edit profile*, *App preferences*, sign out, and for admins a *View as resident* switch.
6. **Settings** — three sections: **Profile** (name and role, with an *Edit profile* button), **App preferences** (language, and Light / Dark / System appearance — the dark theme is a navy, AWS-console-style palette with buildy's green accent; saved on the device), and **Account** (admin panel, leave the building, delete account — deletion is still a placeholder).

You stay signed in across reloads for up to 30 days: the app silently renews Cognito's 1-hour login token with the refresh token, both on page load and shortly before it expires.

## Roles

| Who | What they can do |
|---|---|
| **Resident** (anyone who joined) | See their building; post messages and upload docs; edit/delete their *own* messages and docs; edit their own apartment details. |
| **Committee head / committee member / building manager** | Same abilities as residents today — the role is shown on the members list (committee first). Assigned by an admin. |
| **Admin** (global super user, `users.is_admin`) | Everything, in every building: create / edit / delete buildings (with a step-by-step wizard for new ones), manage contact links, assign member roles or remove members, and edit/delete any message or document. Admins can also switch to **View as resident** to see the app exactly as residents do. |

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
- **Uploads** are stored on disk under `UPLOADS_DIR` (a Docker named volume, `uploads`, in compose) with server-generated file names; the database keeps the title, original file name, type and size.

### Data model

| Table | Holds |
|---|---|
| `cities` | Official Israeli settlement list (CBS "סמל יישוב" code as the id), seeded from `backend/prisma/data/cities.json`. |
| `buildings` | Name, city, address, description, door code, hashed join password. |
| `users` | Cognito identity, name, email, onboarding profile, `is_admin`. |
| `building_users` | Membership + the member's unit: apartment, floor, owner/tenant, size, monthly fee, payment method. |
| `users_roles` | A member's role in a building: `committee_head`, `committee_member`, `manager`, `resident`. |
| `contact_links` | A building's WhatsApp / phone / email contacts. |
| `messages` | Building messages with a type (`general`, `urgent`, `maintenance`). |
| `docs` | Uploaded documents and their file metadata. |

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
