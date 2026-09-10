import { useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StepShell from './StepShell';
import { LANGUAGE_OPTIONS } from './onboardingData';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageCode } from '../types/language';

interface LanguageStepProps {
  initialValue?: string;
  onSubmit: (code: LanguageCode) => void;
}

export default function LanguageStep({ initialValue, onSubmit }: LanguageStepProps) {
  const { t, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode | ''>((initialValue as LanguageCode) ?? '');

  const handleSelect = (code: LanguageCode) => {
    setSelected(code);
  };

  const handleSubmit = () => {
    if (selected) {
      setLanguage(selected);
      onSubmit(selected);
    }
  };

  return (
    <StepShell
      title={t('language.title')}
      subtitle={t('language.subtitle')}
      onContinue={handleSubmit}
      continueDisabled={!selected}
    >
      <Stack spacing={1.25}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.code;
          return (
            <ButtonBase
              key={opt.code}
              onClick={() => handleSelect(opt.code)}
              sx={{
                justifyContent: 'space-between',
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: (theme) => (isSelected ? alpha(theme.palette.primary.main, 0.07) : 'background.paper'),
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: (theme) => (isSelected ? theme.palette.primary.main : theme.palette.primary.light),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, isSelected ? 0.08 : 0.03),
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 600 }}>{opt.nativeLabel}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.label}
                </Typography>
              </Box>
              {isSelected && <CheckCircleIcon sx={{ color: 'primary.main' }} fontSize="small" />}
            </ButtonBase>
          );
        })}
      </Stack>
    </StepShell>
  );
}
