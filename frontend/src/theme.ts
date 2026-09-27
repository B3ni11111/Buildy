import { alpha, createTheme, type Theme } from '@mui/material';

export type ColorMode = 'light' | 'dark';

// Light: classic, minimal — a muted forest green anchor on warm neutral grays.
// Dark: modelled on the AWS console's dark mode — deep navy surfaces and cool
// gray text — keeping buildy's green as the accent.
const PALETTES = {
  light: {
    primary: { main: '#3A5A40', light: '#6B8F71', dark: '#2A4030', contrastText: '#FFFFFF' },
    secondary: { main: '#5B6660' },
    background: { default: '#F7F6F3', paper: '#FFFFFF' },
    text: { primary: '#22261F', secondary: '#5B6660' },
    divider: '#E3E2DB',
    shadow: 'rgba(20, 24, 18, 0.06)',
  },
  dark: {
    // buildy's forest green, lifted so it stays readable on navy.
    primary: { main: '#7FB685', light: '#A8D0AD', dark: '#5C8F63', contrastText: '#0F1B2A' },
    secondary: { main: '#8D99A8' },
    background: { default: '#0F1B2A', paper: '#192534' },
    text: { primary: '#E9EBED', secondary: '#9BA7B6' },
    divider: '#414D5C',
    shadow: 'rgba(0, 7, 22, 0.45)',
  },
} as const;

const SERIF = '"Georgia","Iowan Old Style","Palatino Linotype",serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Direction is threaded through so Hebrew/Arabic mirror correctly.
export function getTheme(direction: 'ltr' | 'rtl', mode: ColorMode): Theme {
  const p = PALETTES[mode];
  const accent = p.primary.main;

  return createTheme({
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
      fontFamily: SANS,
      h1: { fontFamily: SERIF, fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' },
      h2: { fontFamily: SERIF, fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
      h3: { fontFamily: SANS, fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h4: { fontFamily: SANS, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)' },
          },
          contained: {
            boxShadow: `0 2px 8px ${alpha(accent, 0.12)}`,
            '&:hover': { boxShadow: `0 4px 16px ${alpha(accent, 0.16)}` },
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
            '&:hover': { boxShadow: `0 2px 6px ${p.shadow}, 0 8px 20px ${p.shadow}` },
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
