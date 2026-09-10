# Buildy Visual Design Guide

## Overview

Buildy features a **sophisticated, professional aesthetic** with warm, muted colors and elegant typography. The design prioritizes clarity, accessibility, and calm user experience—refined without being sterile.

---

## Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary** | `#3A5A40` | rgb(58, 90, 64) | Buttons, links, active states, text, icons |
| **Primary Light** | `#6B8F71` | rgb(107, 143, 113) | Hover states, secondary backgrounds |
| **Primary Dark** | `#2A4030` | rgb(42, 64, 48) | Pressed states, focus rings, deep accents |

### Neutral Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Background Default** | `#F7F6F3` | rgb(247, 246, 243) | Page backgrounds, secondary surfaces |
| **Background Paper** | `#FFFFFF` | rgb(255, 255, 255) | Cards, containers, modals |
| **Text Primary** | `#22261F` | rgb(34, 38, 31) | Body text, primary content |
| **Text Secondary** | `#5B6660` | rgb(91, 102, 96) | Hints, captions, secondary text |
| **Divider** | `#E3E2DB` | rgb(227, 226, 219) | Borders, separators |
| **Secondary** | `#5B6660` | rgb(91, 102, 96) | Disabled states, secondary actions |

### Color Philosophy

- **Warm, muted forest green** palette creates a trustworthy, elegant feel
- **Zero harsh neons** — all colors are sophisticated and calming
- **Warm neutrals** (off-white, gray-green) create cohesion
- Designed to feel **premium and timeless**, not trendy or corporate

---

## Typography

### Font Families

**Headings (Serif):**
```
Georgia, "Iowan Old Style", "Palatino Linotype", serif
```
- Creates elegance and classic, premium feel
- Used for h1, h2, h3, h4

**Body Text (Sans-serif):**
```
-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", 
"Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", 
sans-serif
```
- Excellent screen readability
- Native feel across platforms
- Used for body text, captions, UI labels

### Type Scale

| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|-----------------|-------------|
| **h1** | 2.5rem | 600 | -0.01em | 1.2 |
| **h2** | 2rem | 600 | normal | 1.3 |
| **h3** | 1.5rem | 600 | normal | 1.4 |
| **h4** | 1.125rem | 600 | normal | 1.5 |
| **subtitle1** | 1rem | 500 | 0.0125em | 1.6 |
| **body1** | 1rem | 400 | 0.0125em | 1.6 |
| **body2** | 0.875rem | 400 | 0.0179em | 1.5 |
| **caption** | 0.75rem | 400 | 0.0333em | 1.5 |

### Text Hierarchy

1. **Headings** (serif, bold) — visual priority, elegant
2. **Body text** (sans-serif, regular) — main content
3. **Secondary text** (sans-serif, muted color) — hints, labels, captions
4. Clear distinction between levels ensures easy scanning

---

## Layout & Spacing

### Container Sizing

- **max-width: xs** — 320-480px (forms, sign-in, onboarding)
- **max-width: sm** — 480-640px (modals, settings)
- **max-width: md** — 960px (dashboard content)

### Spacing Scale (MUI units, 1 unit = 8px)

| Unit | Pixels | Usage |
|------|--------|-------|
| 0.5 | 4px | Micro spacing |
| 1 | 8px | Small gaps |
| 2 | 16px | Standard padding |
| 3 | 24px | Section spacing |
| 4 | 32px | Large padding |
| 6 | 48px | Card padding |

### Border Radius

| Element | Radius | Usage |
|---------|--------|-------|
| **Cards/Containers** | 14px | Main surfaces |
| **Buttons** | 10px | Interactive elements |
| **Input Fields** | 10px | Form inputs |
| **Modals** | 4px | Dialog paper |
| **Small Components** | 3-4px | Chips, badges |

### Responsive Breakpoints

```
xs:  0–599px   (phones)
sm:  600–959px (tablets)
md:  960–1279px (laptops)
lg:  1280–1919px (desktops)
xl:  1920px+   (large displays)
```

**Grid System:**
- Desktop: 12-column, 2-column layouts (5/7 or 6/6 splits)
- Mobile: Full-width, single column stacking
- Consistent gaps: 3 units between columns

### Whitespace

- **Generous padding** inside cards (3-4rem) creates breathing room
- **Large vertical gaps** between sections (2-3rem)
- Content never feels cramped—negative space is intentional and valuable

---

## Components

### Buttons

**Styling:**
```
border-radius: 10px
padding: 0.6em 1.2em (approximately 10-12px vertical, 19-24px horizontal)
font-weight: 600
font-size: 1rem
text-transform: none
```

**States:**

| State | Background | Text Color | Shadow |
|-------|------------|-----------|--------|
| **Default** | #3A5A40 | white | 0 2px 8px rgba(58, 90, 64, 0.12) |
| **Hover** | #6B8F71 | white | 0 4px 16px rgba(58, 90, 64, 0.16) + translateY(-1px) |
| **Pressed** | #2A4030 | white | 0 1px 4px rgba(58, 90, 64, 0.08) |
| **Disabled** | #3A5A40 | white | none; opacity: 0.6 |
| **Focus** | #3A5A40 | white | outline: 2px solid #3A5A40 |

**Variants:**

- **Contained** (default) — solid green background, high contrast
- **Outlined** — transparent background, green border, used for secondary actions
- **Text** — no background, green text, for tertiary actions

**Sizes:**

- **Small** — py: 0.5, px: 1, fontSize: 0.875rem
- **Medium** — py: 0.6, px: 1.2, fontSize: 1rem (default)
- **Large** — py: 1.5, px: 1.5, fontSize: 1rem, fontWeight: 600

**Transitions:**
```
all 0.2s ease
```

### Cards

**Styling:**
```
border-radius: 14px
background: white
padding: 2-4rem (context dependent)
```

**Shadow:**

| State | Shadow |
|-------|--------|
| **Default** | 0 1px 3px rgba(20, 24, 18, 0.05), 0 4px 12px rgba(20, 24, 18, 0.06) |
| **Hover** | 0 2px 6px rgba(20, 24, 18, 0.08), 0 8px 20px rgba(20, 24, 18, 0.08) |

**Variants:**

- **Elevation** (default) — subtle shadow, white background
- **Outlined** — no shadow, light border (#E3E2DB), white background

**Transitions:**
```
all 0.2s ease
```

### Input Fields (TextField)

**Styling:**
```
border-radius: 10px
padding: 14px 16px
font-size: 1rem
font-family: system sans-serif
```

**Border States:**

| State | Border Color | Border Width |
|-------|-------------|--------------|
| **Default** | #E3E2DB | 1px |
| **Hover** | #3A5A40 | 1px |
| **Focus** | #3A5A40 | 2px |
| **Disabled** | #E3E2DB | 1px; opacity: 0.5 |
| **Error** | #D32F2F | 2px |

**Focus Ring:**
```
box-shadow: 0 0 0 3px rgba(58, 90, 64, 0.1)
outline: none
```

**Transitions:**
```
border-color 0.2s ease
box-shadow 0.2s ease
background-color 0.2s ease
```

### Icons

**Style:** Material Design Outlined (not filled)

**Sizing:**

| Context | Size | Notes |
|---------|------|-------|
| **Top bar menu** | 24px | Standard UI icons |
| **Dashboard cards** | 18-24px | List item icons |
| **Buttons** | 18-20px | Button leading icon |
| **Avatar** | 40-64px | Profile images |

**Color:**
- **Primary usage** — #3A5A40 (primary.main)
- **Secondary usage** — #5B6660 (text.secondary)
- **Muted usage** — #E3E2DB (divider)

---

## Pages & Layouts

### Home / Sign-In Page

**Layout:**
```
Full viewport height (100vh)
Centered flex layout
Background: #F7F6F3
Content max-width: sm (480-640px)
```

**Visual Structure:**
```
┌─────────────────────────────┐
│                             │
│                             │  ← Vertical centering
│    Welcome to Buildy        │  ← h2 serif heading
│                             │
│  ┌─────────────────────┐   │
│  │ Continue with       │   │  ← Card, outlined variant
│  │   Google            │   │
│  └─────────────────────┘   │
│                             │
│  Privacy notice (small text)│
│                             │
└─────────────────────────────┘
```

**Elements:**
- **Title** — h2 serif, #3A5A40
- **Card** — rounded 4px, outlined variant, padding: 3rem
- **Button** — large contained, full width
- **Footer** — small caption, secondary gray

**Mobile:** Full-width, adjusted padding, single column

---

### Onboarding Flow

**Container:**
```
Full page height
Centered flex layout
Card variant: outlined
Border radius: 4px
Padding: 3rem (desktop), 2rem (mobile)
Background: #F7F6F3
Min height: 420px
```

**Structure Per Step:**
```
[Back Button] ← Top-left, icon only

Title              ← h4 serif
Subtitle           ← body2, secondary gray

[Content Area]     ← flex: 1, centered
  ├─ Input field (name)
  ├─ Selection buttons (language/type)
  └─ Decorative content (greeting animation)

[Continue Button]  ← Full-width, large, contained
```

**Progress Indicator:**
```
●  ●  ○  ○
← Active dot (primary green)
← Inactive dot (divider gray)

Position: Bottom center, 24px below card
Size: 6px diameter dots, 8px spacing
```

**Confirmation Message (ConfirmCheck):**
```
  ✓
  Language Saved
  
← SVG checkmark + text
← Auto-dismisses 2.15s
← Animates in from bottom, fades out
```

**Animations:**
- **Step entrance** — fade in + translateY(10px) — 0.45s ease-out
- **Word cycle** — fade + scale — 1.1s loop
- **Checkmark** — stroke animation — 0.5s
- **All transitions** — smooth, 0.2s ease

---

### Dashboard

**Top Bar:**
```
White background (#FFFFFF)
Subtle bottom border (#E3E2DB)
Padding: 1.5rem vertical
Height: ~70px (with content)
Position: sticky/fixed
```

**Header Section:**
```
"Welcome, [FirstName]" ← h4 serif, #22261F
[Building Address]     ← body2, #5B6660
                       ← Spacing: 1rem below header
```

**Main Content Grid:**
```
xs (mobile): 1 column (100%)
md (desktop): 2 columns (5/12 + 7/12 split)
Gap: 3rem between columns
```

**Card Layouts:**

**Quick Actions Card:**
```
"Quick Actions" ← subtitle1, fontWeight 600

Icon Button 1 ← Full width, text-colored
Icon Button 2    Icon on left, label on right
...              Dividers between items
                 Hover: slight background fill
```

**Documents Card:**
```
"Documents"         "View All >" ← Title + action button
────────────────────────────────

 📄 Budget Proposal   ← Icon + title + secondary text
    Building • Jan 15   Divider below
    
 📄 Lease Agreement
    Unit • Dec 30
```

**User Menu (Top Right):**
```
Position: inset-inline-end: 16px, top: 1rem
Fixed positioning

Menu items:
  [Avatar] Name
  Email
  ────────────────
  EN → ✓ (current)
     ES
     HE
  ────────────────
  Settings
  Sign Out (red text)
```

---

### Settings Page

**Layout:**
```
Centered card, max-width: sm
Background: #F7F6F3
Padding: 3-4rem
Border radius: 4px
```

**Structure:**
```
Your Settings           ← h4 serif

[Avatar] Name          ← User section
         Email
                [Edit]

────────────────────────  ← Divider

Name        Alice          ← Read-only or edit fields
Language    עברית
Role        Owner

────────────────────────

Email Verified ✓          ← Status indicators
User ID     12345...

────────────────────────

DANGER ZONE              ← Red section title
[Delete Account]         ← Red outlined button

────────────────────────

[← Back to Home]         ← Action button
```

**Edit Mode:**
- Fields become TextFields/Dropdowns
- Save/Cancel buttons appear
- Smooth transition 0.2s ease

**Delete Confirmation Dialog:**
```
Title: "Delete Account?"
Description: "This action cannot be undone..."
Input: "Type 'DELETE' to confirm"
Buttons: [Cancel] [Delete] (red, disabled until input matches)
```

---

## Visual Effects & Interactions

### Shadows (3-Layer Model)

All shadows use warm-tinted rgba(20, 24, 18, alpha):

```
Small:   0 1px 3px rgba(20, 24, 18, 0.05),
         0 4px 12px rgba(20, 24, 18, 0.06)

Medium:  0 2px 8px rgba(58, 90, 64, 0.12)

Large:   0 4px 16px rgba(58, 90, 64, 0.16)
```

### Hover Effects

**Buttons:**
```
transform: translateY(-1px)
box-shadow: increases 1-2 levels
transition: all 0.2s ease
```

**Cards:**
```
box-shadow: increases to medium/large
transition: all 0.2s ease
```

**Icon Buttons:**
```
transform: scale(1.05)
background: slight alpha fill
transition: all 0.2s ease
```

**Links/Text Buttons:**
```
color: changes to primary.main
text-decoration: underline
transition: all 0.2s ease
```

### Focus States

**Keyboard Navigation:**
```
outline: 2px solid #3A5A40
outline-offset: 2px
border-radius: maintained
```

**Form Inputs:**
```
box-shadow: 0 0 0 3px rgba(58, 90, 64, 0.1)
border-color: #3A5A40
border-width: 2px
```

### Transitions

**Global transition duration:** `0.2s ease`

**Specific transitions:**
- Border color: `0.25s ease`
- Background color: `0.2s ease`
- Transform: `0.2s ease`
- Box shadow: `0.2s ease`
- Opacity: `0.2s ease`

---

## RTL Support

### Direction Handling

**Supported RTL Languages:**
- Hebrew (he)
- Arabic (ar)

**Supported LTR Languages:**
- English (en)
- Russian (ru)
- French (fr)
- Spanish (es)

### CSS Mirroring

Uses `stylis-plugin-rtl` with Emotion cache to automatically mirror:
- `margin-left` ↔ `margin-right`
- `padding-left` ↔ `padding-right`
- `text-align: left` ↔ `text-align: right`
- `inset-inline-start` ↔ `inset-inline-end`
- All directional properties

**No separate CSS files** — single runtime transformation

### Browser APIs

```javascript
document.documentElement.dir = 'rtl' | 'ltr'
document.documentElement.lang = language code
```

---

## Animation Examples

### Word Cycle (Greeting Step)

```css
@keyframes wordCycle {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  15% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  85% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

animation: wordCycle 1.1s cubic-bezier(0.4, 0, 0.2, 1);
```

### Checkmark Draw (Confirmation)

```css
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

animation: checkmark 0.5s cubic-bezier(0.65, 0, 0.35, 1);
```

### Step Entrance

```css
@keyframes stepIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: stepIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Branding

### Logo

**Display:**
```
Text: "buildy"
Font: Georgia, serif
Font-weight: 600
Color: #3A5A40 (primary)
Size: 1.25rem (header), 2.5-3.5rem (splash)
```

**Placement:**
- Header: Top-left
- Home/Splash: Center
- Responsive: Scales with viewport

### Brand Colors in Context

- **Primary Action** — Forest Green (#3A5A40)
- **Success/Confirmation** — Green (#3A5A40)
- **Danger** — Red (#D32F2F)
- **Warning** — Amber/Orange (typically)
- **Info** — Blue (typically)

### Visual Language

**Professional yet approachable:**
- Serif + sans-serif combination for elegance and readability
- Muted color palette for sophistication
- Generous spacing for clarity
- Smooth animations for polish
- RTL support for inclusivity

**Suitable for:**
- Building residents and managers
- Community platforms
- Property management
- Trust-based interactions

---

## Accessibility

### Color Contrast

All text meets WCAG AA standards:
- **Text Primary (#22261F) on Background (#F7F6F3):** 11.5:1 ✓
- **Text Secondary (#5B6660) on Background (#F7F6F3):** 5.2:1 ✓
- **Button Text (white) on Primary (#3A5A40):** 5.5:1 ✓

### Focus Management

- Clear focus rings on all interactive elements
- Focus order follows DOM structure
- No focus traps

### Typography

- Minimum font size: 12px (captions)
- Body text: 16px (mobile-friendly)
- Line height: 1.5-1.6 (excellent readability)
- Letter spacing: natural for serif, slightly increased for sans-serif

### RTL & Internationalization

- Full bidirectional text support
- Proper text direction indicators
- No hardcoded directional assets

---

## Usage Guidelines

### When to Use Primary Green (#3A5A40)

- Buttons and call-to-action elements
- Active/selected states
- Primary text and headings
- Focus rings and focus indicators
- Important UI elements

### When to Use Neutral Gray (#5B6660)

- Secondary text, captions, hints
- Disabled states
- Dividers and borders
- Background overlays
- Less important UI elements

### When to Use Background Colors

- **#F7F6F3** — Page backgrounds, secondary surfaces
- **#FFFFFF** — Cards, containers, modals, primary surfaces

### Spacing Rules

- **Never less than 8px** between interactive elements
- **Minimum touch target:** 44px × 44px
- **Standard gap between sections:** 24px–32px
- **Within card:** 32px–48px padding

### Typography Rules

- **Never use font-size smaller than 12px** for body text
- **Headings should always use serif font**
- **Body text should use sans-serif for screen readability**
- **Line height minimum 1.5** for body text
- **Maximum line length: 75 characters** for optimal readability (achieved via max-width containers)

---

## Design System Status

✓ **Defined:** Color palette, typography, spacing, component styles
✓ **Implemented:** MUI theme with custom overrides
✓ **Tested:** Responsive design, RTL support, accessibility
⚠️ **TODO:** Storybook or design system documentation site

---

**Document Version:** 1.0  
**Last Updated:** August 21, 2026  
**Design Lead:** Buildy Design System  
**Framework:** Material-UI v9.3.1 + Emotion CSS-in-JS
