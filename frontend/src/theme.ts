import { alpha, createTheme, type Theme } from '@mui/material';

export type ColorMode = 'light' | 'dark';

// Soft tiles (Option C): warm stone page, forest green accent, and each home section filled with its
// own pastel. Dark keeps the same warmth: charcoal page, every section a deep tint of its colour.
const PALETTES = {
  light: {
    primary: { main: '#3A5A40', light: '#6B8F71', dark: '#2A4030', contrastText: '#FFFFFF' },
    secondary: { main: '#6B716C' },
    background: { default: '#F2F0EA', paper: '#FFFFFF' },
    text: { primary: '#1F2421', secondary: '#5F665F' },
    divider: '#E3E0D7',
    shadow: 'rgba(40, 36, 28, 0.06)',
  },
  dark: {
    // buildy's forest green, lifted so it stays readable on charcoal.
    primary: { main: '#9DCB9F', light: '#BFE0C0', dark: '#6FA374', contrastText: '#121613' },
    secondary: { main: '#9AA39B' },
    background: { default: '#121613', paper: '#1D221E' },
    text: { primary: '#ECEAE3', secondary: '#A3AAA2' },
    divider: '#2E352F',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
} as const;

// Rubik covers Latin, Hebrew and Cyrillic in one family (loaded in index.html).
export const FONT = '"Rubik", system-ui, -apple-system, "Segoe UI", sans-serif';

/** The home sections, each with a fixed colour that means the same thing everywhere. */
export type TileSection = 'payments' | 'issues' | 'docs' | 'members' | 'building' | 'apartments';

const TILES: Record<ColorMode, Record<TileSection, { bg: string; ink: string }>> = {
  light: {
    payments: { bg: '#DDE8D9', ink: '#22402A' },
    issues: { bg: '#F3E6CC', ink: '#5E4210' },
    docs: { bg: '#DCE9F2', ink: '#1F4460' },
    members: { bg: '#E8E1EE', ink: '#4A3560' },
    building: { bg: '#FFFFFF', ink: '#1F2421' },
    apartments: { bg: '#FFFFFF', ink: '#1F2421' },
  },
  dark: {
    payments: { bg: '#22382A', ink: '#DDEBD9' },
    issues: { bg: '#3A3020', ink: '#F1DDB2' },
    docs: { bg: '#1D2E3A', ink: '#CFE2F0' },
    members: { bg: '#2E2638', ink: '#E3D6EE' },
    building: { bg: '#1D221E', ink: '#ECEAE3' },
    apartments: { bg: '#1D221E', ink: '#ECEAE3' },
  },
};

/** A section's fill and text colour (for previews; tiles themselves use tileVars). */
export function tileColors(mode: ColorMode, section: TileSection) {
  return TILES[mode][section];
}

/** "#22402A" -> "34 64 42", the form MUI's *Channel variables expect. */
function channel(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * CSS variables that recolour everything inside one home tile: its paper, text, dividers and accent
 * take the section's colours, and inner corners get smaller. Dialogs opened from a tile render outside
 * it, so they keep the normal look.
 */
export function tileVars(mode: ColorMode, section: TileSection): Record<string, string> {
  const { bg, ink } = TILES[mode][section];
  return {
    '--mui-palette-background-paper': bg,
    '--mui-palette-background-paperChannel': channel(bg),
    '--mui-palette-text-primary': ink,
    '--mui-palette-text-primaryChannel': channel(ink),
    '--mui-palette-text-secondary': alpha(ink, 0.74),
    '--mui-palette-text-secondaryChannel': channel(ink),
    '--mui-palette-divider': alpha(ink, 0.16),
    '--mui-palette-dividerChannel': channel(ink),
    '--mui-palette-primary-main': ink,
    '--mui-palette-primary-mainChannel': channel(ink),
    '--mui-palette-primary-light': ink,
    '--mui-palette-primary-dark': ink,
    '--mui-palette-primary-contrastText': bg,
    '--mui-palette-primary-contrastTextChannel': channel(bg),
    '--mui-shape-borderRadius': '4px',
    color: ink,
  };
}

// Direction is threaded through so Hebrew/Arabic mirror correctly.
export function getTheme(direction: 'ltr' | 'rtl', mode: ColorMode): Theme {
  const p = PALETTES[mode];
  const accent = p.primary.main;

  return createTheme({
    // Colours and corners resolve through CSS variables, so a home tile can recolour its own content.
    cssVariables: true,
    direction,
    palette: {
      mode,
      primary: p.primary,
      secondary: p.secondary,
      background: p.background,
      text: p.text,
      divider: p.divider,
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: FONT,
      h1: { fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 },
    },
    components: {
      // Opening a dialog or menu must not hide the page scrollbar: that changes the page width and
      // makes the grid (and everything else) jump sideways. The page simply stays scrollable behind it.
      MuiModal: { defaultProps: { disableScrollLock: true } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '&:active': { transform: 'scale(0.98)' },
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': { outline: `2px solid ${accent}`, outlineOffset: 2 },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: `0 1px 3px ${p.shadow}, 0 4px 12px ${p.shadow}`,
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', transition: 'all 0.2s ease' },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: accent },
              '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(accent, 0.1)}` },
            },
          },
        },
      },
    },
  });
}
