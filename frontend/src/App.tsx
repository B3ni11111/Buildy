import { useEffect, useMemo, useState } from 'react';
import { CacheProvider } from '@emotion/react';
import { Box, CircularProgress, CssBaseline, ThemeProvider, createTheme, type Theme } from '@mui/material';
import Home from './components/Home';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import OnboardingFlow from './onboarding/OnboardingFlow';
import JoinBuildingStep from './onboarding/JoinBuildingStep';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import { getOnboardingData } from './utils/onboarding';
import { ltrCache, rtlCache } from './i18n/rtlCache';
import { api } from './utils/api';
import type { OnboardingData } from './types/onboarding';
import type { Building } from './types/building';

// Classic, minimal, no-neon palette: a muted forest green anchor on warm
// neutral grays, soft rounded corners, and a serif accent for headings.
// Direction is threaded through so Hebrew/Arabic mirror correctly.
function getTheme(direction: 'ltr' | 'rtl'): Theme {
  return createTheme({
    direction,
    palette: {
      mode: 'light',
      primary: {
        main: '#3A5A40',
        light: '#6B8F71',
        dark: '#2A4030',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#5B6660',
      },
      background: {
        default: '#F7F6F3',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#22261F',
        secondary: '#5B6660',
      },
      divider: '#E3E2DB',
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h2: {
        fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 400,
      },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 2px 8px rgba(58, 90, 64, 0.12)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(58, 90, 64, 0.16)',
            },
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: '2px solid #3A5A40',
              outlineOffset: 2,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(20, 24, 18, 0.05), 0 4px 12px rgba(20, 24, 18, 0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 6px rgba(20, 24, 18, 0.08), 0 8px 20px rgba(20, 24, 18, 0.08)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#3A5A40',
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 3px rgba(58, 90, 64, 0.1)',
              },
            },
          },
        },
      },
    },
  });
}

function App() {
  const { isAuthenticated, user, tokens } = useAuth();
  const { dir } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<OnboardingData | null>(() => getOnboardingData());
  const [building, setBuilding] = useState<Building | null | undefined>(undefined);

  const theme = useMemo(() => getTheme(dir), [dir]);

  useEffect(() => {
    if (!isAuthenticated || !profile || !tokens) {
      setBuilding(undefined);
      return;
    }
    let cancelled = false;
    api
      .getMyBuilding(tokens.id_token)
      .then((b) => {
        if (!cancelled) setBuilding(b);
      })
      .catch(() => {
        if (!cancelled) setBuilding(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profile, tokens]);

  const handleLeaveBuilding = async () => {
    if (!tokens) return;
    await api.leaveBuilding(tokens.id_token);
    setBuilding(null);
    setShowSettings(false);
  };

  let content;
  if (!isAuthenticated) {
    content = <Home />;
  } else if (!profile) {
    // Config gate: the home page only appears once onboarding is complete.
    content = <OnboardingFlow defaultName={user?.name} onComplete={setProfile} />;
  } else if (building === undefined) {
    content = (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  } else if (!building) {
    // Second, separate gate: building membership is server-owned (unlike
    // the local profile above), so it's checked asynchronously and kept
    // out of OnboardingFlow's synchronous DATA_STEPS wizard.
    content = <JoinBuildingStep idToken={tokens!.id_token} onJoined={setBuilding} />;
  } else if (showSettings) {
    content = (
      <Settings
        profile={profile}
        onUpdateProfile={setProfile}
        onBack={() => setShowSettings(false)}
        onLeaveBuilding={handleLeaveBuilding}
      />
    );
  } else {
    content = (
      <Dashboard
        profile={profile}
        building={building}
        idToken={tokens!.id_token}
        onViewUserInfo={() => setShowSettings(true)}
      />
    );
  }

  return (
    <CacheProvider value={dir === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {content}
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
