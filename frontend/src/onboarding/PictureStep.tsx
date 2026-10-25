import { useState } from 'react';
import { Alert, Box } from '@mui/material';
import StepShell from './StepShell';
import AvatarEditor, { type StagedPicture } from '../components/AvatarEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Picture } from '../types/building';

interface PictureStepProps {
  name: string;
  staged: StagedPicture;
  onStage: (picture: StagedPicture) => void;
  /** `skipped`: ignore anything staged. */
  onSubmit: (skipped: boolean) => void;
  onBack: () => void;
}

const NO_PICTURE: Picture = { google: null, version: null };

/** Optional profile picture; the Google photo (or initials) is used when skipped. */
export default function PictureStep({ name, staged, onStage, onSubmit, onBack }: PictureStepProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <StepShell
      title={t('pictureStep.title')}
      subtitle={t('pictureStep.subtitle')}
      onContinue={() => onSubmit(false)}
      onBack={onBack}
      onSkip={() => onSubmit(true)}
      continueLabel={t('common.finish')}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <AvatarEditor
          userId="me"
          name={name}
          picture={{ ...NO_PICTURE, google: user?.picture ?? null }}
          staged={staged}
          onStage={(next) => {
            if (staged?.kind === 'upload') URL.revokeObjectURL(staged.previewUrl);
            onStage(next);
          }}
          onError={setError}
          size={120}
        />
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </StepShell>
  );
}
