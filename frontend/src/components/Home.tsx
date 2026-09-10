import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { getAuthorizationUrl } from '../utils/cognito';
import { useLanguage } from '../i18n/LanguageContext';

// Signed-out landing page. Once authenticated, App.tsx routes straight
// to onboarding (if not yet complete) or the Dashboard — this component
// only ever renders the sign-in card. If this browser previously had a
// language chosen (even from a prior session), it's honored here too.
export default function Home() {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ textAlign: 'center' }}>
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                fontWeight: 600,
                mb: 1,
              }}
            >
              {t('home.title')}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {t('home.tagline')}
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ pt: 4, pb: 4 }}>
              <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                {t('home.signInPrompt')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                href={getAuthorizationUrl()}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  px: 4,
                }}
              >
                {t('home.signInButton')}
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
