> Purpose: decisions from the payments interview (fees, payment methods, receipts, PDF), plus what is still open. Nothing built yet.

# Payments, fees and receipts: decisions

Source: interview in the Claude desktop app, 2026-10-13. Some answers were dismissed by the user; those are marked as open.

## Payment methods

- Four methods: credit card, cash, bank transfer, Bit/PayBox (one method).
- Card payments are charged inside the app in the long run. Not built yet. Until a provider is set up, the committee head records card payments by hand, like transfers.
- The building pays the provider's fees.

## Recording and confirming

- Only the committee head records cash, transfer and Bit/PayBox payments.
- One person is enough. No second approval.
- Cash and recorded transfers show as paid right away.
- No screenshot or proof upload.
- Partial payments allowed. The rest stays as the month's balance.
- Mistakes: cancel with a reason. Nothing is deleted.
- Full audit log for payments: every payment, cancellation and fee change, with who and when.

## Late payments

- Shown on the management list only. No automatic reminders.

## Fees

- Each building chooses fixed or budget-based.
  - Fixed: same amount for every apartment.
  - Budget-based: management enters the monthly budget; the app splits it.
- Budget split factors: management chooses which to use from size (m²), number of people, floor, parking/storage.
- Only the committee head updates the number of people in an apartment.
- The committee head creates each month's charges by hand.

## Visibility

- Committee head and management company: all apartments, charges, payments, can record payments.
- Resident: own current month, balance, payment history, receipts. Not neighbours' payments.

## Receipts and documents

- One plain receipt per payment, numbered per building, Hebrew only.
- Not an official tax receipt (קבלה מס) for now.
- Later (not now): monthly apartment statement, monthly building report, yearly summary.

## Building and money context

- The committee is a registered body. Exact type not known yet. It may be a resident chosen by the building, or a management company with its own bank account.
- The building has no bank account of its own.
- Money currently goes to a mix of places: committee head's personal account, management company, and cash.
- A building bank account is planned, but not decided.
- Accountant: not a concern for the app's design.

## Demo scope (2026-10-20 session)

Built first, before real payments. Supersedes the parts above only for the demo.

- Fee fixed per apartment (existing `apartments.monthly_payment`), set by the committee head. A change affects the current month's goal and future months; past months keep their stored amount.
- No partial payments in the demo. Payment rows are a permanent log: deleted only when the building is deleted (never by removing a resident or apartment). The row keeps `apartment_number` so it stays readable.
- Fee follows last month by default. When the head edits an apartment's fee he picks **one-time** (this month only) or **permanent** (updates the standing fee for future months).
- Head clicks an apartment to mark the month paid, or uses "select all". Budget shows `collected / goal`, ✓ when equal.
- Resident sees amount due, history, and a fake Pay button that counts instantly (clearly marked demo). Residents never see the building total or neighbours.
- Payment rows are provider-neutral (`provider` null in demo, `external_ref`, `status`) so a third-party provider can replace the fake Pay.
- Later: receipts and maintenance bills uploaded via Documents become expenses (money out), so the budget becomes a balance. This closes the earlier open question "does the app show income and expenses": yes, eventually.

## Round 2 design: log, methods, payer, month opening (2026-10-22, built the same day)

**Payments log window**
- A full-screen window opened from the Payments tile (no page routing yet; routes come later).
- Management sees every payment in the building. A resident sees the same columns for their own apartments only.
- Columns: for month, apartment, amount, status, paid on, paid by, method, confirmed by, how confirmed. Filters: month, apartment, method.

**Per-apartment log (resident)**
- Each of the resident's apartments in the Payments tile has a "Payment log" link. It opens the log of that apartment.
- A resident sees only the months since they were linked to the apartment. A previous renter's or owner's payments stay private.
- Needs a new `apartment_residents.linked_at` column. Existing rows are backfilled from `building_users.joined_at`.
- Gotcha: "replace apartments" in Manage must keep `linked_at` for links that stay, or the resident would lose their own history.
- Management uses the building-wide log, filtered by apartment.

**Payment methods**
- Card, cash, transfer, Bit/PayBox (one method). Adds `card`; existing `bit` and `paybox` merge into `bit_paybox`.
- Pre-selected when confirming: the apartment's method, else the building default, else card. The head can change it for that one payment.
- "Mark all" records each apartment's own default method.

**Who pays inside an apartment**
- Decided by the **owner**, not by management. The owner picks the payer (themselves or the renter) in My apartments.
- Until the owner chooses, the owner pays.
- Only the payer sees the demo Pay button; the other resident sees the amount and status read-only.
- When management confirms a payment, "paid by" is the apartment's payer at that moment.
- Assumption: with several owners, any owner can set the payer.

**How a payment was confirmed**
- `single`: the head clicked one apartment.
- `bulk`: Mark all.
- `self`: the resident pressed Pay.
- `automatic`: reserved for a future payment provider.

**For which month**
- Still current month only; no paying ahead.
- The log shows "for month" (`period`) and "paid on" (`paid_at`) separately.

**Opening a month**
- A per-building setting: manual (the head presses Open), or automatic on a day of the month (1-28).
- Automatic opens the first time anyone looks on or after that day (no scheduler).
- In 5-minute test mode, automatic opens right away.

**Setup**
- "Create a building" gets a payments step: open mode (+ day), a default fee applied to every apartment, and a default payment method.
- Existing buildings show "Set up payments" to management in the tile until it's done; residents see that the month isn't open.
- The head can change the settings later from the tile. Changes apply from the next month.

**Draft data changes**
- New table `building_payment_settings`: 1:1 with buildings, cascade on building delete. Columns: `open_mode` (manual/auto), `open_day`, `default_fee`, `default_method`, timestamps. A row exists = setup done.
- `apartments.payer_id`: FK to users, SET NULL. Empty = the owner.
- `payments` gets:
  - `method`
  - `confirmed_by` (FK to users, SET NULL)
  - `confirmation` (single/bulk/self/automatic)
  - `paid_by` now means the payer.
- `payment_method` enum: `card`, `cash`, `transfer`, `bit_paybox`.

## Open (not decided)

- Who decides owner vs renter pays the fee: building rule, per apartment, or a field the two choose in the app.
- Mid-month moves: full month charge, split by days, or manual.
- Whether the app shows income and expenses of the building (currently leaning to fees only).
- Card money recipient: building account, committee head, or management company.
- Whether the annual financial report or audit is needed (user not sure).
- Who records payments when the management company holds the money (user: no preference).
- Term length of the committee head: not needed (user: doesn't matter).

## Build order (proposed)

1. Fee settings, calculator, `people_count` (no money recorded yet).
2. Monthly charges, payment recording with cancel and audit log, balances, unpaid list.
3. Receipts and PDF export (Hebrew).
4. Later: statements, monthly and yearly reports, reminders, card payments, Excel export.
