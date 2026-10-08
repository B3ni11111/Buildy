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
import AdminFab from './admin/AdminFab';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import { getOnboardingData, saveOnboardingData } from './utils/onboarding';
import { SUPPORTED_LANGUAGES, type LanguageCode } from './types/language';
import { ltrCache, rtlCache } from './i18n/rtlCache';
import { api, setViewAs as setApiViewAs } from './utils/api';
import { getTheme } from './theme';
import { useColorMode } from './context/ColorModeContext';
import type { OnboardingData } from './types/onboarding';
import { BUILDING_ROLES, type Building, type BuildingRole, type CurrentUser } from './types/building';

const CURRENT_BUILDING_KEY = 'buildy_current_building';
const VIEW_AS_KEY = 'buildy_view_as';

function App() {
  const { isAuthenticated, user, tokens } = useAuth();
  const { dir, t, setLanguage } = useLanguage();
  const [view, setView] = useState<'home' | 'settings' | 'admin' | 'createBuilding' | 'join'>('home');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  // Admins can preview the app as a building role (null = full admin); remembered on this device.
  const [viewAs, setViewAs] = useState<BuildingRole | null>(() => {
    try {
      const stored = localStorage.getItem(VIEW_AS_KEY) as BuildingRole | null;
      if (stored && BUILDING_ROLES.includes(stored)) return stored;
      // Before 2026-10-08 the only preview was "view as resident".
      return localStorage.getItem('buildy_view_as_resident') === 'true' ? 'resident' : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<OnboardingData | null>(() => getOnboardingData());
  // No profile in this browser (new device, or signed out): ask the server before showing onboarding.
  const [profileChecked, setProfileChecked] = useState(false);
  // Every building the user belongs to (undefined = still loading).
  const [buildings, setBuildings] = useState<Building[] | undefined>(undefined);
  // Which one the home screen shows; remembered on this device.
  const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_BUILDING_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  // Bumped to refetch the user's buildings (e.g. after management edits one or an admin deletes it).
  const [buildingReload, setBuildingReload] = useState(0);

  // The backend treats requests as the previewed role too (header set in utils/api), not just the UI.
  // Set from the remembered choice before the first fetch — the backend ignores management roles
  // from non-admins and "resident" only removes powers, so sending it early is harmless.
  setApiViewAs(viewAs);

  const { mode } = useColorMode();
  const theme = useMemo(() => getTheme(dir, mode), [dir, mode]);

  // Onboarding is for new accounts only: restore the profile of a user who already finished it.
  useEffect(() => {
    if (!isAuthenticated || !tokens || profile || profileChecked) return;
    let cancelled = false;
    api
      .getMe(tokens.id_token)
      .then((me) => {
        if (cancelled) return;
        const language = me.language as LanguageCode | null;
        if (me.onboarded && me.name && language && SUPPORTED_LANGUAGES.includes(language)) {
          const restored = { name: me.name, language };
          saveOnboardingData(restored);
          setLanguage(language);
          setProfile(restored);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tokens, profile, profileChecked, setLanguage]);

  useEffect(() => {
    if (!isAuthenticated || !profile || !tokens) {
      setBuildings(undefined);
      return;
    }
    let cancelled = false;
    api
      .getMyBuildings(tokens.id_token)
      .then((list) => {
        if (!cancelled) setBuildings(list);
      })
      .catch(() => {
        if (!cancelled) setBuildings([]);
      });
    api
      .getMe(tokens.id_token)
      .then(async (me) => {
        // The onboarding profile lives in the browser; mirror it to the backend so
        // neighbours see real names on members and messages.
        const needsSync = me.name !== profile.name || me.language !== profile.language;
        const synced = needsSync ? await api.syncOnboarding(tokens.id_token, profile) : me;
        if (!cancelled) setCurrentUser(synced);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profile, tokens, buildingReload]);

  const building = buildings?.find((b) => b.id === currentBuildingId) ?? buildings?.[0] ?? null;

  const selectBuilding = (id: string) => {
    setCurrentBuildingId(id);
    try {
      localStorage.setItem(CURRENT_BUILDING_KEY, id);
    } catch {
      // not remembered — fine
    }
  };

  const handleJoined = (joined: Building) => {
    setBuildings((current) => [...(current ?? []).filter((b) => b.id !== joined.id), joined]);
    selectBuilding(joined.id);
    setView('home');
  };

  /** Replace one building in the list (e.g. after management edits its details). */
  const replaceBuilding = (updated: Building) =>
    setBuildings((current) => (current ?? []).map((b) => (b.id === updated.id ? updated : b)));

  const handleLeaveBuilding = async () => {
    if (!tokens || !building) return;
    await api.leaveBuilding(tokens.id_token, building.id);
    setBuildings((current) => (current ?? []).filter((b) => b.id !== building.id));
    setView('home');
  };

  const isRealAdmin = !!currentUser?.isAdmin;
  // Everything below uses the *effective* user, so previewing a role hides admin tools everywhere.
  const isAdmin = isRealAdmin && !viewAs;
  const effectiveUser = currentUser && { ...currentUser, isAdmin };

  const changeViewAs = (next: BuildingRole | null) => {
    if (next === viewAs) return;
    setViewAs(next);
    try {
      if (next) localStorage.setItem(VIEW_AS_KEY, next);
      else localStorage.removeItem(VIEW_AS_KEY);
      localStorage.removeItem('buildy_view_as_resident');
    } catch {
      // not persisted — still applies for this session
    }
    if (next && (view === 'admin' || view === 'createBuilding')) setView('home');
    // Refetch so roles/permissions come back at the new level.
    setApiViewAs(next);
    setBuildingReload((n) => n + 1);
  };

  const openConsole = () => {
    changeViewAs(null);
    setView('admin');
  };

  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section);
    setView('settings');
  };

  let content;
  if (!isAuthenticated) {
    content = <Home />;
  } else if (!profile && !profileChecked) {
    content = (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
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
        onBack={() => setView('home')}
        onBuildingsChanged={() => setBuildingReload((n) => n + 1)}
      />
    );
  } else if (buildings === undefined) {
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
        <JoinBuildingStep idToken={tokens!.id_token} onJoined={handleJoined} />
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
  } else if (view === 'join') {
    content = (
      <JoinBuildingStep
        idToken={tokens!.id_token}
        onJoined={handleJoined}
        onCancel={() => setView('home')}
        excludeIds={buildings.map((b) => b.id)}
      />
    );
  } else if (view === 'settings') {
    content = (
      <Settings
        profile={profile}
        onUpdateProfile={setProfile}
        currentUser={currentUser}
        onCurrentUserChange={setCurrentUser}
        onBack={() => setView('home')}
        buildingName={building.name}
        onLeaveBuilding={handleLeaveBuilding}
        onOpenAdmin={isAdmin ? () => setView('admin') : undefined}
        initialSection={settingsSection}
      />
    );
  } else {
    content = (
      <Dashboard
        profile={profile}
        buildings={buildings}
        building={building}
        idToken={tokens!.id_token}
        onSelectBuilding={selectBuilding}
        onJoinAnother={() => setView('join')}
        onOpenSettings={openSettings}
        adminView={isRealAdmin ? { viewAs, onExit: () => changeViewAs(null) } : undefined}
        currentUser={effectiveUser}
        onCurrentUserChange={setCurrentUser}
        onBuildingChange={replaceBuilding}
        onBuildingRefresh={() => setBuildingReload((n) => n + 1)}
      />
    );
  }

  return (
    <CacheProvider value={dir === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {content}
        {/* The wrench: admin tools for real admins, everywhere except the full-screen wizard. */}
        {isAuthenticated && profile && isRealAdmin && view !== 'createBuilding' && (
          <AdminFab
            viewAs={viewAs}
            onViewAsChange={changeViewAs}
            onOpenConsole={openConsole}
            consoleOpen={isAdmin && view === 'admin'}
          />
        )}
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
