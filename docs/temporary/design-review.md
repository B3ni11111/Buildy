> Purpose: notes from the 2026-10-22 design review of the live app, to guide the redesign.

Slides: https://claude.ai/artifact/M5AdmvtGJrrH7Qfo1KJs8Z (private). Review only, no code changed.
Captured with Playwright on the local compose build (dev sign-in), desktop 1440, mobile 390, dark, Hebrew.

## Keep
- Warm stone background, one forest green accent, serif wordmark, plain copy.
- Payments privacy (residents see only their part). RTL auto-mirroring.

## Problems found
1. **Type:** Georgia has no Hebrew glyphs, so Hebrew headings fall back to another font ("שלום, Noa" mixes two). System stack differs per OS. Card titles same size as body; captions 11-12px.
2. **Corners:** 56px card radius clips content (last "Unpaid" chip in Payments, Members list cut). Pills inside pills.
3. **Hierarchy:** fixed-height equal tiles, half empty or cut off. Payments (core value) is last. Same layout for head and resident.
4. **Duplication:** Report an issue x2, Add widgets / Reset layout top and bottom, "Payment log" vs "Payments log", "buildy" vs "Buildy". Fixed footer covers content.
5. **Color:** dark mode is cold navy vs warm light (two personalities). Resolved/Paid use brand green; Denied is a loud filled red. Gray initials avatars look disabled. Black focus outline on the building switcher and Add widgets after click.
6. **Mobile:** action buttons wrap to 3 rows; widget × easy to hit; filter chips ~26px (< 44px rule); no quick way to Issues/Payments.
7. **First impression:** sign-in page is a small centered card, no product shown, Google button has no mark. No-building page shows a raw UUID to copy. Empty states are one gray line.

## Proposed direction ("the building's front desk")
- Role-aware **Today** home: money first (head: collected / goal bar; resident: my part + Pay), then needs-attention, then a compact building strip.
- Sections instead of a widget wall: Issues, Money, Docs, People. Bottom tabs on phone, slim top tabs on desktop.
- Fonts: Frank Ruhl Libre (display) + Heebo (UI), both Hebrew + Latin. Alt: IBM Plex Sans + IBM Plex Sans Hebrew. Scale 40/28/20/16/14.
- Radius: cards 16, inner 12, buttons 10, pills only for chips.
- Status pastels: Open #FBF3DB/#7A5300, In process #E1F3FE/#1F6C9F, Resolved/Paid #EDF3EC/#346538, Denied/Unpaid #FDEBEC/#9F2F2D.
- Warm dark: page #161A17, surface #1F2520, text #E8E6DF, accent #8DBF92.
- References: Apple Home, Monzo Pots, Splitwise, Linear, Notion, Airbnb host Today, Mercury.

## Options mocked up (deck slides "Three directions" onward)
- **A Refined:** Frank Ruhl Libre + Heebo, white 16px cards, top tabs, bottom bar on phone. Recommended base.
- **B Editorial:** Newsreader + Geist, no cards, hairlines, 12-apartment paid strip. No Hebrew in those fonts.
- **C Soft tiles:** Rubik only, pastel tiles per section (sage money, sand issues, blue docs), floating tab bar.
- Recommendation: A + B's apartment grid on the Money page + C's big phone tiles; pastel status pills; warm charcoal dark; split sign-in with product preview.
- Mockup sources (throwaway, not app code): scratchpad `mock/` folder of the 2026-10-22 session.

## Round 2 (same day): deep dive, 87 slides
- Method: impeccable critique/audit/typeset/animate/delight/onboard playbooks + taste pack. Degraded run: impeccable's detector binary not run.
- Score: 19/40 on Nielsen heuristics; cognitive load high (5 of 8 checks fail on Home).
- Measured on head's Home: 17 button styles, 10 button heights (17 to 72px), 7 radii, 8 font sizes (one 13.68px), 16 labels at 12px, touch targets 18 to 31px.
- i18n: ar/ru/fr/es have 212 of 429 keys, so 217 strings show in English (e.g. "Add widgets"). 12 em dashes in English copy.
- Dialogs use three shapes (56px, 16px, full-screen). Privacy and Terms say "coming soon". About page has the line-drawn crowd (CrowdCanvas), onboarding has a WebGL splash: reuse both.
- New styles: D Lobby signage, E Neighbourhood (crowd), F Evening lobby (lit windows = paid apartments), G Notice board.
- Page options mocked for sign-in, onboarding, waiting room, issues, report, documents, money, pay flow, apartment, people, invite, building profile, settings, admin, wizard, menus, about.
- Customization: edit mode with Done, reorderable list, role presets, building colour/cover, text size.
- Special objects: Pay (amount in button / slide / hold), door code (keypad, hold to reveal, send to guest), amber Report, contact chips, role badges, mark paid with undo, hold to leave.
- Pick: A as the system, F's lit-window building as the money signature, E's crowd on sign-in and empty states.
- Mockup sources: scratchpad `mock/` (pages1-4, cust, comps, styles2) and `deck/embeds/` of this session.

## Decisions (2026-10-23): direction is Option C, soft tiles
- **Tile colour** = fixed per section, soft pastels: money sage, issues sand, documents blue, people lilac, door code white. Nobody can recolour tiles.
- **Font**: Rubik only (covers English, Hebrew, Russian). Today's serif goes.
- **Corners**: 24px on tiles, like C.
- **Dark mode**: deep tinted tiles (dark sage, dark sand, dark blue...) on a warm charcoal page.
- **Phone nav**: light mode = bottom bar a slightly brighter version of the page background, icons a little darker; dark mode = C's floating dark bar.
- **Desktop nav**: centred pill tabs (Home, Issues, Money, Documents, People).
- **Roles**: shared base; the head and residents will get different features over time, so leave room for role-specific tiles.
- **Alive**: Pay animation and time-of-day greeting only (no lit-window building, no crowd on Home).
- **Customization**: keep today's drag and resize; add four presets to the widgets menu (Claude picks: Committee head, Resident, Just the essentials, Everything).
- **Pay**: slide to pay.
- **Door code**: hidden until held.
- **Status inside tiles**: dot + word, no background.
- **Languages**: Arabic, Russian, French, Spanish stay, marked "partial" in the picker.
- **Root page**: the public About/product page, with sign-in on it (not a separate sign-in screen).
- Nested white cards inside tiles (original C issue rows) are out: rows sit on the tile colour with thin dividers.

## Phases
1. Quick wins: fonts + scale, radius, status colors, dedupe buttons, drop fixed footer.
2. New frame: Today home, section pages, mobile tabs.
3. Polish: warm dark, empty states, landing page, share-ID link/QR.
