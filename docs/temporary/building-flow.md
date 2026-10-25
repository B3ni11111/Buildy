> Purpose: working checklist for the building-creation / add-by-ID / issues rework (2026-10-11).

Full plan: `~/.claude/plans/i-want-to-improve-enumerated-cray.md`.

## Decisions
- Shared ID = the user's UUID. Management adds residents directly (no accept step).
- Password join removed (`password_hash`, `requested_*` dropped).
- Any user can create a building and picks committee head / management company.
- Messages → issues (whole building sees them). Old `type` dropped; types come later.
- Status: opened → in_process / denied → resolved. Management only; note required on every change.
- Ping: author, once per 7 days, bumps the issue to the top. Notifications later (mobile).

## Progress
- [x] Schema + migrations
- [x] Backend: buildings (create, preview, bulk add), issues, shared uploads
- [x] Frontend: onboarding steps, NoBuildingHome, wizard, ResidentsEditor + AddResidentsDialog, IssuesCard/IssueDialog
- [x] i18n (en + he; other languages fall back to English), docs
- [ ] Manual click-through with two accounts (needs Google sign-in) — migrations and services already verified on a throwaway DB
