# Test data (local dev seed)

Created by `backend/prisma/seed.ts` on every `docker compose up`. Create-only, so edits you make to these rows survive re-seeding.

## Mock users

They can't sign in (no Cognito login). They exist so you can paste their IDs into **Add residents**. None of them is in a building.

| # | Name | ID | Email |
|---|---|---|---|
| 1 | Noa Levi | `00000000-0000-4000-8000-000000000001` | mock1@buildy.test |
| 2 | Daniel Cohen | `00000000-0000-4000-8000-000000000002` | mock2@buildy.test |
| 3 | Maya Mizrahi | `00000000-0000-4000-8000-000000000003` | mock3@buildy.test |
| 4 | Yossi Peretz | `00000000-0000-4000-8000-000000000004` | mock4@buildy.test |
| 5 | Tamar Katz | `00000000-0000-4000-8000-000000000005` | mock5@buildy.test |
| 6 | Omer Biton | `00000000-0000-4000-8000-000000000006` | mock6@buildy.test |
| 7 | Shira Dahan | `00000000-0000-4000-8000-000000000007` | mock7@buildy.test |
| 8 | Avi Friedman | `00000000-0000-4000-8000-000000000008` | mock8@buildy.test |
| 9 | Lior Azulay | `00000000-0000-4000-8000-000000000009` | mock9@buildy.test |
| 10 | Rina Shapiro | `00000000-0000-4000-8000-000000000010` | mock10@buildy.test |

All ten IDs, ready to paste in one go:

```
00000000-0000-4000-8000-000000000001
00000000-0000-4000-8000-000000000002
00000000-0000-4000-8000-000000000003
00000000-0000-4000-8000-000000000004
00000000-0000-4000-8000-000000000005
00000000-0000-4000-8000-000000000006
00000000-0000-4000-8000-000000000007
00000000-0000-4000-8000-000000000008
00000000-0000-4000-8000-000000000009
00000000-0000-4000-8000-000000000010
```

## Seeded buildings

All in Tel Aviv (city 5000). They start with no members; an admin can add people from the admin console → Members tab.

| Building | Address | Door code | Description | Contact links |
|---|---|---|---|---|
| Maple Court | 14 Ben Yehuda St | 1948 | 6 floors, 24 units. Elevator serviced every March. | WhatsApp: `https://chat.whatsapp.com/maple-court-demo` · email: `committee@maplecourt.example` |
| Rothschild Gardens | 82 Rothschild Blvd | 0821 | Bauhaus building, 4 floors, shared rooftop. | WhatsApp: `https://chat.whatsapp.com/rothschild-demo` · phone: `+972-3-555-0182` |
| HaYarkon Terrace | 210 HaYarkon St | 2100 | Sea-facing, 9 floors, underground parking. | phone: `+972-3-555-0210` |

## Walkthrough

1. Settings → Account → delete your account, then sign in again (fresh account, waiting screen with your ID).
2. *Create a building* → fill in the steps → in the residents step paste the ten IDs, set apartments, create.
3. Report an issue as a resident, change its status as the committee head (a note is required), ping it, and so on.
