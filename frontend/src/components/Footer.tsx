import { Box, ButtonBase, Typography } from '@mui/material';
import { useLanguage } from '../i18n/LanguageContext';
import type { InfoPageKind } from './InfoPage';

const linkSx = {
  fontSize: '0.8125rem',
  color: 'text.secondary',
  borderRadius: 1,
  px: 0.75,
  py: 0.25,
  '&:hover': { color: 'text.primary' },
  // No browser focus ring on click; keyboard users get a soft highlight instead.
  '&:focus, &:focus-visible': { outline: 'none' },
  '&.Mui-focusVisible': { bgcolor: 'action.hover' },
} as const;

/** Thin bar fixed to the bottom of the screen, like the top bar is fixed to the top. */
/** hideOnPhone: the dashboard's section bar takes the bottom of the screen on phones. */
export default function Footer({ active, onOpenPage, onFeedback, hideOnPhone }: { hideOnPhone?: boolean; active: InfoPageKind | null; onOpenPage: (kind: InfoPageKind | null) => void; onFeedback: () => void }) {
  const { t } = useLanguage();
  // Each link toggles its page: a second click goes back to wherever the user was.
  const toggle = (kind: InfoPageKind) => onOpenPage(active === kind ? null : kind);
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        height: 36,
        display: hideOnPhone ? { xs: 'none', md: 'grid' } : 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        gap: 2,
        px: { xs: 1.5, sm: 3 },
        // Zooming in must never make the page scroll sideways: columns may shrink, text never overflows.
        maxWidth: '100vw',
        overflow: 'hidden',
        '& > *': { minWidth: 0 },
        '& button': { whiteSpace: 'nowrap' },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ justifySelf: 'start' }}>
        <ButtonBase onClick={onFeedback} sx={linkSx}>
          {t('footer.feedback')}
        </ButtonBase>
      </Box>
      <ButtonBase
        onClick={() => toggle('info')}
        sx={{
          fontFamily: '"Rubik", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: '0.9375rem',
          color: 'primary.main',
          borderRadius: 1,
          px: 1,
          '&:focus, &:focus-visible': { outline: 'none' },
          '&.Mui-focusVisible': { bgcolor: 'action.hover' },
        }}
      >
        Buildy
      </ButtonBase>
      <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1 } }}>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.75, display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </Typography>
        <ButtonBase onClick={() => toggle('privacy')} sx={linkSx}>
          {t('footer.privacy')}
        </ButtonBase>
        <ButtonBase onClick={() => toggle('terms')} sx={linkSx}>
          {t('footer.terms')}
        </ButtonBase>
      </Box>
    </Box>
  );
}
