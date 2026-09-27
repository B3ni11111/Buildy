import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ColorMode } from '../theme';

export type ColorModePreference = ColorMode | 'system';

const STORAGE_KEY = 'buildy_color_mode';

interface ColorModeContextType {
  /** What the user picked in App preferences. */
  preference: ColorModePreference;
  /** What's actually shown (system resolved to light/dark). */
  mode: ColorMode;
  setPreference: (preference: ColorModePreference) => void;
}

const ColorModeContext = createContext<ColorModeContextType | null>(null);

function readPreference(): ColorModePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // storage unavailable — fall through to the default
  }
  return 'light';
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorModePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(() => systemQuery().matches);

  useEffect(() => {
    const query = systemQuery();
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setPreference = (next: ColorModePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not persisted — still applies for this session
    }
  };

  const mode: ColorMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  return (
    <ColorModeContext.Provider value={{ preference, mode, setPreference }}>{children}</ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}
