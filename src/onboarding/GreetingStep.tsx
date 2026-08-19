import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { GREETING_WORDS } from './onboardingData';
import { useLanguage } from '../i18n/LanguageContext';
import './onboarding.css';

/**
 * Apple-style multilingual "Hello" splash — the first thing a resident
 * sees. Words cycle continuously; a "Get Started" button fades in a
 * couple of seconds in, and tapping anywhere (once it's visible) also
 * advances. The word cycle itself is decorative and unrelated to the
 * language picked on the next screen.
 */
export default function GreetingStep({ onContinue }: { onContinue: () => void }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setIndex((i) => (i + 1) % GREETING_WORDS.length);
    }, 1100);
    const ctaTimer = setTimeout(() => setShowCta(true), 2600);
    return () => {
      clearInterval(wordTimer);
      clearTimeout(ctaTimer);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        textAlign: 'center',
      }}
    >
      <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          key={index}
          className="ob-hello-word"
          sx={{
            fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
            fontSize: { xs: '3rem', sm: '3.75rem' },
            fontWeight: 500,
            color: 'primary.main',
            letterSpacing: '-0.5px',
          }}
        >
          {GREETING_WORDS[index]}
        </Typography>
      </Box>

      <Box sx={{ minHeight: 48, transition: 'all 0.3s ease' }}>
        {showCta ? (
          <Button
            className="ob-cta"
            onClick={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            variant="contained"
            size="large"
            sx={{
              textTransform: 'none',
              px: 5,
              fontWeight: 600,
              fontSize: '0.95rem',
              letterSpacing: '0.3px',
            }}
          >
            {t('common.getStarted')}
          </Button>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 400,
              letterSpacing: '0.2px',
            }}
          >
            {t('common.welcomeToBuildy')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
