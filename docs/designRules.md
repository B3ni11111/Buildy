# buildy — design rules

> Purpose: the short list of visual rules (colors, fonts, corners, shadows, spacing, style) that keep the app looking consistent.

The code is the source of truth: [`frontend/src/theme.ts`](../frontend/src/theme.ts). Rules are added here only after a style has been settled and approved.

## Feel

Warm, calm, editorial. Muted forest green on warm neutrals, a serif for big headings, generous whitespace. No neons, gradients or heavy shadows.

## Colors

| Role | Light | Dark |
|---|---|---|
| Primary (buttons, links, active, focus) | `#3A5A40` | `#7FB685` |
| Primary light (hover) | `#6B8F71` | `#A8D0AD` |
| Primary dark (pressed) | `#2A4030` | `#5C8F63` |
| Page background | `#F7F6F3` | `#0F1B2A` |
| Surface (cards, dialogs) | `#FFFFFF` | `#192534` |
| Text | `#22261F` | `#E9EBED` |
| Text, secondary | `#5B6660` | `#9BA7B6` |
| Divider / borders | `#E3E2DB` | `#414D5C` |
| Danger | MUI `error` red | MUI `error` red |

- Dark mode uses deep navy surfaces and cool gray text, modelled on the AWS console, with buildy's green lifted for contrast.

## Typography

- **Serif** (`Georgia, "Iowan Old Style", "Palatino Linotype", serif`) for h1, h2, page and section titles, and the "buildy" wordmark.
- **Sans-serif** (system UI stack) for everything else, including h3 and h4.
- Sizes: h1 2.5rem · h2 2rem · h3 1.5rem · h4 1.125rem · body 1rem · small 0.875rem. Headings weight 600.
- Body line-height 1.5–1.6. Never go below 12px.

## Corners

MUI multiplies a numeric `borderRadius` in `sx` by the theme's base of 14px.

| Element | Value in code | Actual |
|---|---|---|
| Theme default (Paper, inputs) | `shape.borderRadius: 14` | 14px |
| Buttons | theme override | 10px |
| Cards, dialogs, wizard panels | `borderRadius: 4` | 56px |
| Dashboard tiles, menus, alerts | `borderRadius: 3` | 42px |
| Avatars, dots | `'50%'` | round |

## Surfaces and shadows

- Cards are mostly `variant="outlined"`: a thin divider-colored border and no shadow.
- An elevated card gets a soft two-layer shadow, slightly stronger on hover.
- Buttons have no elevation. A contained button gets a faint green-tinted shadow, plus a 1px lift on hover.
- No background images on Paper.

## Interaction

- Transitions are `all 0.2s ease`.
- Focus: `2px solid` primary outline with a 2px offset. Inputs get a soft 3px primary glow.
- Button text is not uppercased (set per button with `textTransform: 'none'`, not yet in the theme).

## Spacing and layout

- MUI spacing unit is 8px. Section gaps are 24–32px, and card padding 24–32px.
- Touch targets are at least 44px.
- Content uses centered containers (`xs`/`sm` for forms and settings, `md` for the dashboard). Mobile is a single column.

## Icons

- Material icons, mostly the **Outlined** variant.

## RTL

- Hebrew and Arabic mirror automatically (`stylis-plugin-rtl` flips left and right at runtime), so styles are written once, for LTR.
