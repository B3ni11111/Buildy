import { ReactNode } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useLanguage } from '../i18n/LanguageContext';

interface StepShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  onBack?: () => void;
}

/**
 * Shared chrome for every data-entry onboarding step: heading, optional
 * back button, body content, and a full-width continue button. Keeping
 * this generic makes it cheap to append new steps later.
 */
export default function StepShell({
  title,
  subtitle,
  children,
  onContinue,
  continueDisabled,
  continueLabel,
  onBack,
}: StepShellProps) {
  const { t, dir } = useLanguage();
  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;

  return (
    <Box className="ob-step-enter" sx={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
      {onBack && (
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mb: 2,
            ml: -1,
            transition: 'all 0.2s ease',
            '&:hover': { bgcolor: 'rgba(58, 90, 64, 0.08)' },
            color: 'primary.main',
          }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
      )}
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
          fontWeight: 600,
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 2.5,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>
      )}

      <Box sx={{ flex: 1, mt: 4 }}>{children}</Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={continueDisabled}
        onClick={onContinue}
        sx={{
          mt: 5,
          textTransform: 'none',
          py: 1.5,
          fontWeight: 600,
          fontSize: '0.95rem',
          letterSpacing: '0.3px',
          transition: 'all 0.2s ease',
          '&:disabled': { opacity: 0.6 },
        }}
      >
        {continueLabel ?? t('common.continue')}
      </Button>
    </Box>
  );
}
