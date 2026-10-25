import { useState } from 'react';
import { TextField } from '@mui/material';
import StepShell from './StepShell';
import { useLanguage } from '../i18n/LanguageContext';

interface PhoneStepProps {
  initialValue?: string;
  /** Empty string = skipped. */
  onSubmit: (phone: string) => void;
  onBack: () => void;
}

/** Optional: only building management can see it. */
export default function PhoneStep({ initialValue, onSubmit, onBack }: PhoneStepProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState(initialValue ?? '');

  return (
    <StepShell
      title={t('phoneStep.title')}
      subtitle={t('phoneStep.subtitle')}
      onContinue={() => onSubmit(phone.trim())}
      onBack={onBack}
      onSkip={() => onSubmit('')}
    >
      <TextField
        autoFocus
        fullWidth
        label={t('settings.phoneLabel')}
        helperText={t('settings.phoneHint')}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(phone.trim())}
        slotProps={{ htmlInput: { inputMode: 'tel', dir: 'ltr' } }}
      />
    </StepShell>
  );
}
