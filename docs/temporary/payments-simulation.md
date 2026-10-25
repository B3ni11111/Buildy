> Purpose: Working brief for the payments redesign and its first clickable simulation.

# Payments (re)design: simulation brief

Status: brief agreed 2026-10-19. Prototype is a standalone single file, payments-sim/index.html, NOT attached to the real app (open it in a browser). Resident view includes notifications, fake checkout, and approval flow.

## Goal
Redesign how buildy handles building payments. First step is a small **clickable UI prototype** (fake/seed data, no real DB or backend logic) to feel the flow before building it for real.

## Model
- All residents' payments add up to the **building budget**.
- Budget view: running balance + **monthly target** with progress toward it. Expenses come later.

## Committee head
- Creates a monthly cycle: total to collect, **due date**, calculator.
- Calculators in the simulation: **equal split**, **by apartment size (sqm)**, **manual override per apartment**. (More calculators later, so keep it pluggable.)
- Sends notifications (in-app only, simulated) to residents; can remind unpaid/overdue apartments.
- **Manually approves** received payments.
- UI: one "Payments" screen: cycle setup on top, per-apartment table (amount, status, approve) below, budget progress bar.

## Resident
- Sees amount due + due date for their apartment.
- Taps **Pay** (fake in-app checkout) -> status becomes Pending until the head approves.
- Later: in-app charges or an external payment service. Not now.

## Statuses (per apartment, per cycle)
Unpaid -> Pending approval -> Approved. Overdue = unpaid after the due date (automatic).
Not in v1: partial payments, rejection.

## Open questions
- Where it lives in the app (new card on Dashboard vs own page).
- Seed data: how many apartments, which sqm values.
- Does one apartment with several residents pay once (one payer) or split?
- Persistence in the prototype (in-memory vs localStorage).
