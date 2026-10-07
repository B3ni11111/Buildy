# buildy

Apartment-building resident management app. Backend: NestJS + Prisma + Postgres. Frontend: Vite + React + MUI. Dockerized locally, deployed via Amplify.

## Docs map

| File | Purpose | Update when |
|---|---|---|
| `README.md` | Project overview, features | A feature ships |
| `DEVLOG.md` | Running log of decisions/gotchas, architecture notes | Any notable change |
| `DATABASE.md` | Schema docs (Prisma/Postgres, role hierarchy) | Same day as any schema/role change |
| `VISUAL_DESIGN.md` | Color palette, typography, aesthetic spec | Visual direction changes |
| `backend/README.md` | Backend module map (`src/`, `prisma/`), access rules | Backend modules added/restructured |

Keep this table in sync if a doc's purpose changes — don't let it go stale.

## Docs workflow

After each feature or schema/role change, update the relevant file(s) above. This already applies to README/DEVLOG/backend README/DATABASE.md.

## Skills

Only two design-taste skills are kept under `.claude/skills/`: `design-taste-frontend` and `minimalist-ui`, calibrated by `.claude/guide/design.md` (warm minimalist + editorial aesthetic, matches `VISUAL_DESIGN.md`). There is no `.claude/agents/` folder in this project — no custom agents, just these two skills.

## Workflow rules

- Never push to production — only push to the `staging` branch.
- Test locally via `docker compose up` (live reload) before pushing to staging; keep the compose setup working.
