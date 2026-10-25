import { Box, Container, Typography } from '@mui/material';
import { useLanguage } from '../i18n/LanguageContext';
import CrowdCanvas from './CrowdCanvas';

export type InfoPageKind = 'info' | 'terms' | 'privacy';

const serif = '"Rubik", system-ui, sans-serif';

/** The pages behind the footer. The footer links toggle them, so there is no back button. */
export default function InfoPage({ kind }: { kind: InfoPageKind }) {
  const { t } = useLanguage();
  const title = kind === 'info' ? t('footer.infoTitle') : kind === 'terms' ? t('footer.terms') : t('footer.privacy');
  const body = kind === 'info' ? t('footer.infoBody') : t('footer.comingSoon');

  if (kind === 'info') {
    return (
      <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3, pb: 30 }}>
          <Typography
            component="h1"
            sx={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(4.5rem, 18vw, 13rem)', lineHeight: 1, letterSpacing: '-0.03em', color: 'text.primary' }}
          >
            Buildy
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 520, color: 'text.secondary', fontSize: '1.0625rem' }}>{body}</Typography>
        </Box>
        {/* The crowd walks along the bottom, cut off at the footer bar. */}
        <Box sx={{ position: 'absolute', insetInline: 0, bottom: 36, height: 250, pointerEvents: 'none' }}>
          <CrowdCanvas height={250} />
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ pt: 8, pb: 12 }}>
        <Typography variant="h4" sx={{ fontFamily: serif, fontWeight: 600, mb: 2 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{body}</Typography>
      </Container>
    </Box>
  );
}
