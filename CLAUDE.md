# buildy

Apartment-building resident management app. Backend: NestJS + Prisma + Postgres. Frontend: Vite + React + MUI. Dockerized locally, deployed via Amplify.

## The idea

Buildy replaces the WhatsApp group, the paper notes and the personal bank account of the person who runs a building (usually the committee head, or a management company). One place per building where:

- **People** are known: who lives where, owner or renter, who manages (added by user ID, never self-join).
- **Problems** are visible: issues with a status and history, so nothing is lost in chat.
- **Documents** are kept: rules, contracts, and later **receipts for maintenance bills**.
- **Money** is clear: each apartment has a monthly fee, the committee head sees *collected / goal* for the month, and each resident sees only their own part.

The core value is **trust and transparency** between neighbours and the people managing the building. Privacy stays strict: residents never see other residents' payment state.

Money roadmap (design every step so the next one fits without a rewrite):
1. **Demo payments** (now): fixed fee per apartment, the head marks paid or "select all", resident has a fake instant Pay button. Real DB data, no real money.
2. **Real payments**: a third-party provider (not chosen yet) confirms payments. Payment rows stay provider-neutral (provider, external reference, status).
3. **Money out**: receipts and maintenance bills uploaded through Documents become expenses, so the budget turns into a real balance (money in vs money out).

Details of the payments interview and open questions: `docs/temporary/payments.md`.

## Docs map

Follows the global docs layout and rules in `~/.claude/CLAUDE.md`.

| File | Purpose | Update when |
|---|---|---|
| `README.md` | For outsiders: what the product does, features | A feature ships |
| `docs/dataStructure.md` | Current database structure: tables, relations, role hierarchy | Same day as any schema/role change |
| `docs/designRules.md` | Short visual rules: palette (light + dark), fonts, corners, shadows | Only after the user approves a settled style |
| `docs/worklog.md` | Decisions, gotchas, architecture notes | Any notable change |
| `docs/ideas.md` | Brainstorming sandbox for future features | When the user says to note an idea |
| `docs/temporary/` | Working notes for the current iteration | Ask before deleting once the work is done |
| `backend/README.md` | Backend module map (`src/`, `prisma/`), access rules | Backend modules added/restructured |

Keep this table in sync with what exists.

## Skills

Skills are installed with the `skills` installer into `.agents/skills/` (the full taste-skill pack, tracked in `skills-lock.json`). Only those symlinked into `.claude/skills/` are active for Claude: `design-taste-frontend`, `minimalist-ui` and `impeccable` (pbakaus/impeccable, added 2026-10-22; its `scripts/impeccable` launcher downloads a binary on first run, which has not been run), calibrated by `.claude/guide/design.md` (a warm minimalist, editorial aesthetic that matches `docs/designRules.md`). There is no `.claude/agents/` folder, so no custom agents.

## Workflow rules

- Never push to production — only push to the `staging` branch.
- Test locally via `docker compose up` (live reload) before pushing to staging; keep the compose setup working.
