import { useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StepShell from './StepShell';
import { USER_TYPE_OPTIONS, UserTypeIcon } from './onboardingData';
import { useLanguage } from '../i18n/LanguageContext';

const ICONS: Record<UserTypeIcon, typeof HomeOutlinedIcon> = {
  home: HomeOutlinedIcon,
  key: KeyOutlinedIcon,
  group: GroupsOutlinedIcon,
  admin: AdminPanelSettingsOutlinedIcon,
};

interface UserTypeStepProps {
  initialValue?: string;
  onSubmit: (value: string) => void;
  onBack: () => void;
}

export default function UserTypeStep({ initialValue, onSubmit, onBack }: UserTypeStepProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(initialValue ?? '');

  return (
    <StepShell
      title={t('userType.title')}
      subtitle={t('userType.subtitle')}
      onContinue={() => selected && onSubmit(selected)}
      continueDisabled={!selected}
      onBack={onBack}
      continueLabel={t('common.finish')}
    >
      <Stack spacing={1.25}>
        {USER_TYPE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          const Icon = ICONS[opt.icon];
          return (
            <ButtonBase
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              sx={{
                justifyContent: 'flex-start',
                gap: 1.5,
                px: 2.25,
                py: 1.75,
                borderRadius: 3,
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: (theme) => (isSelected ? alpha(theme.palette.primary.main, 0.07) : 'background.paper'),
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: (theme) => (isSelected ? theme.palette.primary.main : theme.palette.primary.light),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, isSelected ? 0.08 : 0.04),
                },
              }}
            >
              <Icon
                sx={{
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.2s ease',
                  fontSize: '1.5rem',
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {t(opt.labelKey)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    lineHeight: 1.4,
                  }}
                >
                  {t(opt.descriptionKey)}
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
