import { useState } from 'react';
import { Box, Container, Paper } from '@mui/material';
import GreetingStep from './GreetingStep';
import LanguageStep from './LanguageStep';
import NameStep from './NameStep';
import ThemeStep from './ThemeStep';
import PhoneStep from './PhoneStep';
import PictureStep from './PictureStep';
import ConfirmCheck from './ConfirmCheck';
import type { StagedPicture } from '../components/AvatarEditor';
import { OnboardingData } from '../types/onboarding';
import { saveOnboardingData } from '../utils/onboarding';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

// Ordered list of data-entry steps (the greeting screen isn't part of
// this list — it doesn't collect anything). Append future steps here;
// the dot progress indicator and back navigation follow automatically.
// Profile and preferences only — nothing about a building: building management adds the user
// (by the ID shown on the home screen) and sets their apartment.
const DATA_STEPS = ['language', 'name', 'theme', 'phone', 'picture'] as const;
type DataStep = (typeof DATA_STEPS)[number];
type Step = 'greeting' | DataStep;

interface OnboardingFlowProps {
  defaultName?: string;
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingFlow({ defaultName, onComplete }: OnboardingFlowProps) {
  const { t } = useLanguage();
  const { tokens } = useAuth();
  const [step, setStep] = useState<Step>('greeting');
  const [data, setData] = useState<Partial<OnboardingData>>({ name: defaultName });
  const [phone, setPhone] = useState('');
  const [picture, setPicture] = useState<StagedPicture>(null);
  const [confirming, setConfirming] = useState<{ message: string; onDone: () => void } | null>(null);

  const goToDataStep = (s: DataStep) => setStep(s);

  const stepAfter = (current: DataStep): DataStep | null => {
    const idx = DATA_STEPS.indexOf(current);
    return idx < DATA_STEPS.length - 1 ? DATA_STEPS[idx + 1] : null;
  };
  const stepBefore = (current: DataStep): Step => {
    const idx = DATA_STEPS.indexOf(current);
    return idx > 0 ? DATA_STEPS[idx - 1] : 'greeting';
  };

  const confirmThen = (message: string, next: () => void) => {
    setConfirming({ message, onDone: next });
  };

  const handleLanguage = (language: string) => {
    // The language has already been applied live by LanguageStep — this
    // just persists it into the profile-in-progress.
    const updated = { ...data, language };
    setData(updated);
    confirmThen(t('language.confirm'), () => {
      setConfirming(null);
      goToDataStep(stepAfter('language')!);
    });
  };

  const handleName = (name: string) => {
    setData({ ...data, name });
    goToDataStep(stepAfter('name')!);
  };

  /** Everything is collected: save the optional extras (best effort — Settings can redo them), then finish. */
  const finish = (skippedPicture: boolean) => {
    const finalData = data as OnboardingData;
    const upload = !skippedPicture && picture?.kind === 'upload' ? picture.file : null;
    confirmThen(t('name.confirm', { name: finalData.name.split(' ')[0] }), async () => {
      if (tokens) {
        await Promise.allSettled([
          phone ? api.updateMe(tokens.id_token, { phone }) : null,
          upload ? api.setAvatar(tokens.id_token, upload) : null,
        ]);
      }
      if (picture?.kind === 'upload') URL.revokeObjectURL(picture.previewUrl);
      saveOnboardingData(finalData);
      onComplete(finalData);
    });
  };

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
      <Container maxWidth="xs" disableGutters>
        <Paper
          variant="outlined"
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper' }}
        >
          {confirming ? (
            <ConfirmCheck message={confirming.message} onDone={confirming.onDone} />
          ) : (
            <>
              {step === 'greeting' && <GreetingStep onContinue={() => setStep('language')} />}
              {step === 'language' && <LanguageStep initialValue={data.language} onSubmit={handleLanguage} />}
              {step === 'name' && (
                <NameStep initialValue={data.name} onSubmit={handleName} onBack={() => setStep(stepBefore('name'))} />
              )}
              {step === 'theme' && (
                <ThemeStep onSubmit={() => goToDataStep('phone')} onBack={() => setStep(stepBefore('theme'))} />
              )}
              {step === 'phone' && (
                <PhoneStep
                  initialValue={phone}
                  onSubmit={(value) => {
                    setPhone(value);
                    goToDataStep('picture');
                  }}
                  onBack={() => setStep(stepBefore('phone'))}
                />
              )}
              {step === 'picture' && (
                <PictureStep
                  name={data.name ?? ''}
                  staged={picture}
                  onStage={setPicture}
                  onSubmit={finish}
                  onBack={() => setStep(stepBefore('picture'))}
                />
              )}
            </>
          )}
        </Paper>

        {step !== 'greeting' && !confirming && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
            {DATA_STEPS.map((s) => (
              <Box
                key={s}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: s === step ? 'primary.main' : 'divider',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
