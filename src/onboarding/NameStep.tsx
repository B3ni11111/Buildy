import { useState } from 'react';
import { TextField } from '@mui/material';
import StepShell from './StepShell';
import { useLanguage } from '../i18n/LanguageContext';

interface NameStepProps {
  initialValue?: string;
  onSubmit: (name: string) => void;
  onBack: () => void;
}

export default function NameStep({ initialValue, onSubmit, onBack }: NameStepProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialValue ?? '');
  const trimmed = name.trim();

  return (
    <StepShell
      title={t('name.title')}
      subtitle={t('name.subtitle')}
      onContinue={() => trimmed && onSubmit(trimmed)}
      continueDisabled={!trimmed}
      onBack={onBack}
    >
      <TextField
        autoFocus
        fullWidth
        placeholder={t('name.placeholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && trimmed) onSubmit(trimmed);
        }}
        slotProps={{
          input: {
            sx: {
              fontSize: '1rem',
              padding: '14px 16px',
            },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            fontSize: '1rem',
            '& fieldset': {
              borderColor: '#E3E2DB',
            },
            '&:hover fieldset': {
              borderColor: '#3A5A40',
              borderWidth: '1.5px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3A5A40',
              borderWidth: '1.5px',
            },
          },
        }}
      />
    </StepShell>
  );
}
