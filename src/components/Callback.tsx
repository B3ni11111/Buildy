import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { exchangeCodeForTokens, saveTokens } from '../utils/cognito';

export default function Callback() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(
            `Authorization failed: ${errorParam} - ${params.get('error_description') || ''}`
          );
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const tokens = await exchangeCodeForTokens(code);
        saveTokens(tokens);

        window.location.href = '/';
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred'
          );
          setIsProcessing(false);
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isProcessing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: 4,
          px: 2,
        }}
      >
        <Stack sx={{ textAlign: 'center', alignItems: 'center' }} spacing={3}>
          <CircularProgress sx={{ color: 'primary.main' }} />
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                fontWeight: 600,
                mb: 1,
              }}
            >
              Processing sign-in...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completing your login securely
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

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
          <Box sx={{ fontSize: '3rem' }}>⚠️</Box>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                fontWeight: 600,
                color: 'error.main',
                mb: 1,
              }}
            >
              Sign-in Failed
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {error}
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ pt: 3, pb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => (window.location.href = '/')}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
