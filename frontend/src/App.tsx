import { useEffect, useMemo, useState } from 'react';
import { CacheProvider } from '@emotion/react';
import { Box, Button, CircularProgress, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import Home from './components/Home';
import Settings, { type SettingsSection } from './components/Settings';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import FeedbackDialog from './components/FeedbackDialog';
import InfoPage, { type InfoPageKind } from './components/InfoPage';
import OnboardingFlow from './onboarding/OnboardingFlow';
import NoBuildingHome from './components/NoBuildingHome';
import AdminPanel from './admin/AdminPanel';
import CreateBuildingWizard from './components/CreateBuildingWizard';
import AdminFab from './admin/AdminFab';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import { getOnboardingData, saveOnboardingData } from './utils/onboarding';
import { SUPPORTED_LANGUAGES, type LanguageCode } from './types/language';
import { ltrCache, rtlCache } from './i18n/rtlCache';
import { api, setViewAs as setApiViewAs } from './utils/api';
import { alpha } from '@mui/material/styles';
import { getTheme } from './theme';
import { useColorMode } from './context/ColorModeContext';
import type { OnboardingData } from './types/onboarding';
import { BUILDING_ROLES, type Building, type BuildingRole, type CurrentUser } from './types/building';

const CURRENT_BUILDING_KEY = 'buildy_current_building';
const VIEW_AS_KEY = 'buildy_view_as';

function App() {
  const { isAuthenticated, user, tokens } = useAuth();
  const { dir, t, setLanguage } = useLanguage();
  const [view, setView] = useState<'home' | 'settings' | 'admin' | 'createBuilding'>('home');
  // The wizard is for everyone; admins opening it from the console create buildings for others.
  const [createAsAdmin, setCreateAsAdmin] = useState(false);
  // Footer pages (about, terms, privacy) show over everything else until the user goes back.
  const [infoPage, setInfoPage] = useState<InfoPageKind | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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

  // Waiting to be added by building management: check again whenever the user comes back to this tab.
  const waiting = !!buildings && buildings.length === 0;
  useEffect(() => {
    if (!waiting) return;
    const check = () => document.visibilityState === 'visible' && setBuildingReload((n) => n + 1);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [waiting]);

  const building = buildings?.find((b) => b.id === currentBuildingId) ?? buildings?.[0] ?? null;

  const selectBuilding = (id: string) => {
    setCurrentBuildingId(id);
    try {
      localStorage.setItem(CURRENT_BUILDING_KEY, id);
    } catch {
      // not remembered — fine
    }
  };

  const openCreateBuilding = (asAdmin: boolean) => {
    setCreateAsAdmin(asAdmin);
    setView('createBuilding');
  };

  /** After the wizard: refetch, and show the new building if the user became part of it. */
  const handleBuildingCreated = async () => {
    if (tokens) {
      const list = await api.getMyBuildings(tokens.id_token).catch(() => null);
      if (list) {
        setBuildings(list);
        if (!createAsAdmin && list.length) selectBuilding(list[list.length - 1].id);
      }
    }
    setView(createAsAdmin ? 'admin' : 'home');
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
  let showsDashboard = false;
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
  } else if (infoPage) {
    content = <InfoPage kind={infoPage} />;
  } else if (view === 'createBuilding' && (!createAsAdmin || isAdmin)) {
    content = (
      <CreateBuildingWizard
        idToken={tokens!.id_token}
        asAdmin={createAsAdmin}
        onCancel={() => setView(createAsAdmin ? 'admin' : 'home')}
        onDone={handleBuildingCreated}
      />
    );
  } else if (isAdmin && view === 'admin') {
    // Before the building gate on purpose: admins manage buildings even when they belong to none.
    content = (
      <AdminPanel
        idToken={tokens!.id_token}
        currentUser={effectiveUser!}
        onCreateBuilding={() => openCreateBuilding(true)}
        onBack={() => setView('home')}
        onBuildingsChanged={() => setBuildingReload((n) => n + 1)}
        onOpenBuilding={(id) => {
          // The admin is a member by now (the console joins first if needed): refetch and show it.
          selectBuilding(id);
          setBuildingReload((n) => n + 1);
          setView('home');
        }}
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
        buildingName={building?.name}
        onLeaveBuilding={building ? handleLeaveBuilding : undefined}
        onOpenAdmin={isAdmin ? () => setView('admin') : undefined}
        initialSection={settingsSection}
      />
    );
  } else if (buildings === undefined) {
    content = (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  } else if (!building) {
    // Second, separate gate: building membership is server-owned (unlike the local profile
    // above) — building management adds the user by their ID, so until then they see their ID.
    content = (
      <NoBuildingHome
        firstName={profile.name.split(' ')[0]}
        currentUser={currentUser}
        onOpenSettings={() => openSettings('profile')}
        onCreateBuilding={() => openCreateBuilding(false)}
        onRefresh={() => setBuildingReload((n) => n + 1)}
      >
        {isAdmin && (
          <Button variant="outlined" onClick={() => setView('admin')} sx={{ textTransform: 'none' }}>
            {t('admin.openPanel')}
          </Button>
        )}
      </NoBuildingHome>
    );
  } else {
    showsDashboard = true;
    content = (
      <Dashboard
        profile={profile}
        buildings={buildings}
        building={building}
        idToken={tokens!.id_token}
        onSelectBuilding={selectBuilding}
        onCreateBuilding={() => openCreateBuilding(false)}
        onOpenSettings={openSettings}
        footerLinks={{ onFeedback: () => setFeedbackOpen(true), onOpenPage: setInfoPage }}
        adminView={isRealAdmin ? { viewAs, onExit: () => changeViewAs(null) } : undefined}
        currentUser={effectiveUser}
        onBuildingChange={replaceBuilding}
        onBuildingRefresh={() => setBuildingReload((n) => n + 1)}
      />
    );
  }

  return (
    <CacheProvider value={dir === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* No sideways page scroll, e.g. when the browser is zoomed in. `clip` (not `hidden`) so sticky bars
            keep working and MUI's scroll lock on menus/dialogs doesn't mistake <html> for a scroll container. */}
        <GlobalStyles
          styles={(theme) => {
            // Scrollbars in the palette: a quiet thumb on a transparent track, in light and dark.
            const thumb = alpha(theme.palette.text.secondary, 0.4);
            const thumbHover = alpha(theme.palette.primary.main, 0.7);
            return {
              // No sideways page scroll. On <html> (not <body>) so the page background and the viewport scroll
              // behave normally; menus and dialogs no longer lock scrolling, so this can't make the page jump.
              html: { overflowX: 'hidden', scrollbarGutter: 'stable' },
              // `:root` (not `html`) so it beats the starter stylesheet's grey root background.
              ':root': { backgroundColor: theme.palette.background.default },
              body: { minHeight: '100vh' },
              // Chrome/Edge/Safari use the ::-webkit-scrollbar rules below (and ignore them if the standard
              // properties are also set), so the standard ones are only for Firefox.
              '@supports not selector(::-webkit-scrollbar)': {
                '*': { scrollbarWidth: 'thin', scrollbarColor: `${thumb} transparent` },
              },
              '*::-webkit-scrollbar': { width: 10, height: 10 },
              '*::-webkit-scrollbar-track': { background: 'transparent' },
              '*::-webkit-scrollbar-corner': { background: 'transparent' },
              '*::-webkit-scrollbar-thumb': {
                backgroundColor: thumb,
                borderRadius: 8,
                border: '2px solid transparent',
                backgroundClip: 'content-box',
              },
              '*::-webkit-scrollbar-thumb:hover': { backgroundColor: thumbHover, backgroundClip: 'content-box' },
            };
          }}
        />
        {content}
        {isAuthenticated && profile && view !== 'createBuilding' && (
          <Footer hideOnPhone={showsDashboard} active={infoPage} onOpenPage={setInfoPage} onFeedback={() => setFeedbackOpen(true)} />
        )}
        {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}
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
