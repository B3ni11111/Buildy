import { useEffect, useMemo, useState } from 'react';
import { CacheProvider } from '@emotion/react';
import { Box, Button, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import Home from './components/Home';
import Settings, { type SettingsSection } from './components/Settings';
import Dashboard from './components/Dashboard';
import OnboardingFlow from './onboarding/OnboardingFlow';
import JoinBuildingStep from './onboarding/JoinBuildingStep';
import AdminPanel from './admin/AdminPanel';
import CreateBuildingWizard from './admin/CreateBuildingWizard';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import { getOnboardingData } from './utils/onboarding';
import { ltrCache, rtlCache } from './i18n/rtlCache';
import { api } from './utils/api';
import { getTheme } from './theme';
import { useColorMode } from './context/ColorModeContext';
import type { OnboardingData } from './types/onboarding';
import type { Building, CurrentUser } from './types/building';

function App() {
  const { isAuthenticated, user, tokens } = useAuth();
  const { dir, t } = useLanguage();
  const [view, setView] = useState<'home' | 'settings' | 'admin' | 'createBuilding'>('home');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  // Admins can preview the app as a resident; remembered on this device.
  const [viewAsResident, setViewAsResident] = useState(() => {
    try {
      return localStorage.getItem('buildy_view_as_resident') === 'true';
    } catch {
      return false;
    }
  });
  const [profile, setProfile] = useState<OnboardingData | null>(() => getOnboardingData());
  const [building, setBuilding] = useState<Building | null | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  // Bumped to refetch the user's building (e.g. after an admin edits or deletes it).
  const [buildingReload, setBuildingReload] = useState(0);

  const { mode } = useColorMode();
  const theme = useMemo(() => getTheme(dir, mode), [dir, mode]);

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
    api
      .getMe(tokens.id_token)
      .then(async (me) => {
        // The onboarding profile lives in the browser; mirror it to the backend so
        // neighbours see real names on members and messages.
        const needsSync = me.name !== profile.name;
        const synced = needsSync ? await api.updateProfile(tokens.id_token, profile) : me;
        if (!cancelled) setCurrentUser(synced);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profile, tokens, buildingReload]);

  const handleLeaveBuilding = async () => {
    if (!tokens) return;
    await api.leaveBuilding(tokens.id_token);
    setBuilding(null);
    setView('home');
  };

  const isRealAdmin = !!currentUser?.isAdmin;
  // Everything below uses the *effective* user, so "view as resident" hides admin tools everywhere.
  const isAdmin = isRealAdmin && !viewAsResident;
  const effectiveUser = currentUser && { ...currentUser, isAdmin };

  const toggleViewAsResident = () => {
    const next = !viewAsResident;
    setViewAsResident(next);
    try {
      localStorage.setItem('buildy_view_as_resident', String(next));
    } catch {
      // not persisted — still applies for this session
    }
    if (next && (view === 'admin' || view === 'createBuilding')) setView('home');
  };

  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section);
    setView('settings');
  };

  let content;
  if (!isAuthenticated) {
    content = <Home />;
  } else if (!profile) {
    // Config gate: the home page only appears once onboarding is complete.
    content = <OnboardingFlow defaultName={user?.name} onComplete={setProfile} />;
  } else if (isAdmin && view === 'createBuilding') {
    content = (
      <CreateBuildingWizard
        idToken={tokens!.id_token}
        onCancel={() => setView('admin')}
        onDone={() => {
          setBuildingReload((n) => n + 1);
          setView('admin');
        }}
      />
    );
  } else if (isAdmin && view === 'admin') {
    // Before the building gate on purpose: admins manage buildings even when they belong to none.
    content = (
      <AdminPanel
        idToken={tokens!.id_token}
        currentUser={effectiveUser!}
        onCreateBuilding={() => setView('createBuilding')}
        onBack={() => setView(building ? 'settings' : 'home')}
        onBuildingsChanged={() => setBuildingReload((n) => n + 1)}
      />
    );
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
    content = (
      <>
        <JoinBuildingStep idToken={tokens!.id_token} onJoined={setBuilding} />
        {isAdmin && (
          <Box sx={{ position: 'fixed', bottom: 24, insetInlineStart: 0, insetInlineEnd: 0, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setView('admin')}
              sx={{ textTransform: 'none', bgcolor: 'background.paper' }}
            >
              {t('admin.openPanel')}
            </Button>
          </Box>
        )}
      </>
    );
  } else if (view === 'settings') {
    content = (
      <Settings
        profile={profile}
        onUpdateProfile={setProfile}
        onBack={() => setView('home')}
        onLeaveBuilding={handleLeaveBuilding}
        onOpenAdmin={isAdmin ? () => setView('admin') : undefined}
        initialSection={settingsSection}
      />
    );
  } else {
    content = (
      <Dashboard
        profile={profile}
        building={building}
        idToken={tokens!.id_token}
        onOpenSettings={openSettings}
        adminView={isRealAdmin ? { viewAsResident, onToggle: toggleViewAsResident } : undefined}
        currentUser={effectiveUser}
        onBuildingChange={setBuilding}
        onBuildingRefresh={() => setBuildingReload((n) => n + 1)}
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
