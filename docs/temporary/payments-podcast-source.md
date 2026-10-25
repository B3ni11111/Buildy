> Purpose: source briefing for a NotebookLM podcast: why payments is a different kind of work, and how to start.

# Buildy payments: why this is different, and how to start

## What Buildy is

Buildy is an app for residents of Israeli apartment buildings. Residents see their building, their apartment, issues they report, and documents. The building committee head (ראש ועד הבית) or the management company runs the building side.

## Why payments is different from what we built before

Until now, every feature we built changed information: who lives where, reported issues, uploaded documents. If something went wrong, a record could be fixed or hidden.

Payments are about money. Three things change:

1. **Records must not disappear.** A wrong payment is cancelled with a reason, never deleted. Every payment, cancellation and fee change is logged with who did it and when.
2. **Legal and tax questions come first.** Who holds the money, what a receipt must say, whether an annual report is needed. The app can't answer these by itself. An accountant or lawyer has to check them before real money goes through the app.
3. **Decisions come before code.** Earlier features could be built and then adjusted. Fee rules and payment records affect what residents owe, so we agree the rules first and only then build.

The app tracks money. It does not hold money. Residents still pay by bank transfer, Bit/PayBox, cash, or card outside the app, and the app records the payment.

## What we have decided

- Four payment methods: credit card, cash, bank transfer, Bit/PayBox (one method).
- Card payments will be charged inside the app later. Until a provider is chosen, the committee head records card payments by hand.
- Only the committee head records cash, transfer and Bit/PayBox. One person is enough, with no second approval.
- Partial payments are allowed. Late payments show only on the management list. No automatic reminders.
- Mistakes are cancelled with a reason. Nothing is deleted. Full audit log for payments.
- Each building chooses a fixed fee or a budget split. In a budget split, management chooses the factors: size in m², number of people, floor, parking/storage.
- Only the committee head updates the number of people. The committee head creates each month's charges by hand.
- Residents see their own balance, history and receipts. Not neighbours' payments.
- One plain receipt per payment, numbered, in Hebrew, not an official tax receipt for now.

## What is still open

- Owner or renter: who pays the fee?
- A resident moves in or out mid-month: full month, split by days, or manual?
- Income and expenses of the building, or fees only?
- Where card money goes once it's live.
- Whether an annual report or audit is needed.
- Who records payments when the management company holds the money.
- The committee's exact legal form, and whether it has a bank account (it doesn't yet).

## How we start from now

1. **Answer the open questions.** Use the voice-mode interview, or answer them in writing.
2. **Check the legal and tax side with an accountant.** Especially receipts, annual reporting, and who holds the money. Cash and transfer records can start earlier than card payments, because card payments need a provider and a bank account first.
3. **Decide what happens to the current unfinished work in the repository.** Many files are changed but not committed. We should commit or set aside that work before starting payments, so the payments work stays separate.
4. **Design the data, but don't build it yet.** Write the planned tables in `docs/dataStructure.md` (fee settings, monthly charges, payments, receipts, audit log). Update it on the same day any schema change is made.
5. **Build step 1: fee settings and the calculator.** Fixed and budget-based fees, plus the people count. No money is recorded yet. Test the calculator with a known example: a 90 m², 3-person apartment in a building with a ₪12,000 budget pays ₪324 a month.
6. **Build step 2: monthly charges and recorded payments.** Charges, payments, partial payments, cancellations, balances, the unpaid list, and the audit log.
7. **Build step 3: receipts and PDF export in Hebrew.** Test the Hebrew PDF output in the Docker setup before committing to a PDF tool.
8. **Later:** statements, monthly and yearly reports, reminders, card payments through a provider, Excel export.

## Working rules for this project

- Work on the `staging` branch only. Never push to production.
- Test locally with `docker compose up` before pushing to staging.
- Update the README, worklog, backend README and data-structure doc after each feature or schema change.
