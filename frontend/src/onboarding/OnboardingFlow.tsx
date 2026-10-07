import { useState } from 'react';
import { Box, Container, Paper } from '@mui/material';
import GreetingStep from './GreetingStep';
import LanguageStep from './LanguageStep';
import NameStep from './NameStep';
import ConfirmCheck from './ConfirmCheck';
import { OnboardingData } from '../types/onboarding';
import { saveOnboardingData } from '../utils/onboarding';
import { useLanguage } from '../i18n/LanguageContext';

// Ordered list of data-entry steps (the greeting screen isn't part of
// this list — it doesn't collect anything). Append future steps here;
// the dot progress indicator and back navigation follow automatically.
// Owner/renter is no longer asked here: it's per apartment, suggested when joining a building
// and confirmed by building management.
const DATA_STEPS = ['language', 'name'] as const;
type DataStep = (typeof DATA_STEPS)[number];
type Step = 'greeting' | DataStep;

interface OnboardingFlowProps {
  defaultName?: string;
  onComplete: (data: OnboardingData) => void;
}

export default function OnboardingFlow({ defaultName, onComplete }: OnboardingFlowProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('greeting');
  const [data, setData] = useState<Partial<OnboardingData>>({ name: defaultName });
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
    const finalData = { ...data, name } as OnboardingData;
    setData(finalData);
    confirmThen(t('name.confirm', { name: name.split(' ')[0] }), () => {
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
