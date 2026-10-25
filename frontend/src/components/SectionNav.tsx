import { useEffect, useState } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeIcon from '@mui/icons-material/Home';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import { useLanguage } from '../i18n/LanguageContext';

/** The app's top-level places: Home plus one page per section. */
export const SECTIONS = ['home', 'issues', 'money', 'docs', 'people'] as const;
export type Section = (typeof SECTIONS)[number];

const ICONS: Record<Section, [typeof HomeIcon, typeof HomeIcon]> = {
  home: [HomeOutlinedIcon, HomeIcon],
  issues: [BuildOutlinedIcon, BuildIcon],
  money: [AccountBalanceWalletOutlinedIcon, AccountBalanceWalletIcon],
  docs: [FolderOutlinedIcon, FolderIcon],
  people: [GroupsOutlinedIcon, GroupsIcon],
};

function readSection(): Section {
  const hash = window.location.hash.slice(1);
  return (SECTIONS as readonly string[]).includes(hash) ? (hash as Section) : 'home';
}

/**
 * The current section, kept in the URL hash (#issues, #money …) so the browser's and the phone's back
 * button move between sections, and a reload stays on the same one.
 */
export function useSection(): [Section, (next: Section) => void] {
  const [section, setSection] = useState(readSection);
  useEffect(() => {
    const sync = () => setSection(readSection());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  const go = (next: Section) => {
    if (next === section) return;
    const { pathname, search } = window.location;
    window.history.pushState(null, '', next === 'home' ? pathname + search : `#${next}`);
    setSection(next);
    window.scrollTo({ top: 0 });
  };
  return [section, go];
}

/** Desktop and tablet: the sections as pill tabs in the middle of the header. */
export function SectionTabs({ section, onChange }: { section: Section; onChange: (next: Section) => void }) {
  const { t } = useLanguage();
  return (
    <Box
      component="nav"
      aria-label={t('nav.label')}
      sx={(theme) => ({
        display: { xs: 'none', md: 'flex' },
        gap: 0.25,
        p: 0.5,
        borderRadius: 999,
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
      })}
    >
      {SECTIONS.map((id) => {
        const on = id === section;
        return (
          <ButtonBase
            key={id}
            onClick={() => onChange(id)}
            aria-current={on ? 'page' : undefined}
            sx={(theme) => ({
              px: 2.25,
              height: 36,
              borderRadius: 999,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: on ? 'text.primary' : 'text.secondary',
              bgcolor: on ? 'background.paper' : 'transparent',
              boxShadow: on ? `0 1px 2px ${alpha('#28241C', theme.palette.mode === 'dark' ? 0.4 : 0.1)}` : 'none',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              '&:hover': { color: 'text.primary' },
            })}
          >
            {t(`nav.${id}`)}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/**
 * Phones: the sections in a bar at the bottom, in thumb reach. Light mode: a plain bar a shade brighter
 * than the page. Dark mode: a dark bar floating above the edge.
 */
export function SectionBar({ section, onChange }: { section: Section; onChange: (next: Section) => void }) {
  const { t } = useLanguage();
  return (
    <Box
      component="nav"
      aria-label={t('nav.label')}
      sx={(theme) => {
        const dark = theme.palette.mode === 'dark';
        return {
          display: { xs: 'grid', md: 'none' },
          gridTemplateColumns: `repeat(${SECTIONS.length}, 1fr)`,
          position: 'fixed',
          zIndex: theme.zIndex.appBar,
          ...(dark
            ? {
                insetInline: 16,
                bottom: 'calc(16px + env(safe-area-inset-bottom))',
                height: 64,
                borderRadius: '22px',
                bgcolor: '#232A24',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
              }
            : {
                insetInline: 0,
                bottom: 0,
                height: 'calc(64px + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)',
                bgcolor: '#FAF9F6',
                borderTop: '1px solid',
                borderColor: 'divider',
              }),
        };
      }}
    >
      {SECTIONS.map((id) => {
        const on = id === section;
        const Icon = ICONS[id][on ? 1 : 0];
        return (
          <ButtonBase
            key={id}
            onClick={() => onChange(id)}
            aria-current={on ? 'page' : undefined}
            sx={(theme) => {
              const dark = theme.palette.mode === 'dark';
              return {
                flexDirection: 'column',
                gap: 0.25,
                borderRadius: '16px',
                fontSize: '0.6875rem',
                fontWeight: on ? 600 : 500,
                color: dark ? (on ? '#ECEAE3' : '#8A948B') : on ? 'primary.main' : '#3F4540',
              };
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
            {t(`nav.${id}`)}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
