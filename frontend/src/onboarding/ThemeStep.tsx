import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import StepShell from './StepShell';
import { useLanguage } from '../i18n/LanguageContext';
import { useColorMode, type ColorModePreference } from '../context/ColorModeContext';

const OPTIONS: { value: ColorModePreference; icon: typeof LightModeOutlinedIcon }[] = [
  { value: 'light', icon: LightModeOutlinedIcon },
  { value: 'dark', icon: DarkModeOutlinedIcon },
  { value: 'system', icon: SettingsBrightnessOutlinedIcon },
];

/** Light, dark or follow the device — applied live, like the language step. */
export default function ThemeStep({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const { t } = useLanguage();
  const { preference, setPreference } = useColorMode();

  return (
    <StepShell title={t('themeStep.title')} subtitle={t('themeStep.subtitle')} onContinue={onSubmit} onBack={onBack}>
      <Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          orientation="vertical"
          value={preference}
          onChange={(_e, value: ColorModePreference | null) => value && setPreference(value)}
        >
          {OPTIONS.map(({ value, icon: Icon }) => (
            <ToggleButton key={value} value={value} sx={{ textTransform: 'none', gap: 1.5, justifyContent: 'flex-start', py: 1.5 }}>
              <Icon fontSize="small" />
              {t(`theme.${value}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </StepShell>
  );
}
