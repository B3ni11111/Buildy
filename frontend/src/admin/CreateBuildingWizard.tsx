import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import StepShell from '../onboarding/StepShell';
import ConfirmCheck from '../onboarding/ConfirmCheck';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { AdminBuilding, City, ContactLinkInput } from '../types/building';
import ContactLinksEditor from './ContactLinksEditor';

// Ordered wizard steps — the dot indicator and back navigation follow this list.
const STEPS = ['name', 'city', 'address', 'details', 'contacts', 'password', 'review'] as const;
type Step = (typeof STEPS)[number];

// ~1.3k cities: only render the first matches while typing.
const filterCities = createFilterOptions<City>({ limit: 50 });

interface Draft {
  name: string;
  city: City | null;
  address: string;
  description: string;
  entryCode: string;
  contactLinks: ContactLinkInput[];
  password: string;
}

interface CreateBuildingWizardProps {
  idToken: string;
  onDone: (created: AdminBuilding) => void;
  onCancel: () => void;
}

export default function CreateBuildingWizard({ idToken, onDone, onCancel }: CreateBuildingWizardProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('name');
  const [draft, setDraft] = useState<Draft>({
    name: '',
    city: null,
    address: '',
    description: '',
    entryCode: '',
    contactLinks: [],
    password: '',
  });
  const [cities, setCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminBuilding | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listCities(idToken)
      .then((list) => {
        if (!cancelled) setCities(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idToken]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const next = () => setStep(STEPS[STEPS.indexOf(step) + 1]);
  // First step's back button leaves the wizard.
  const back = () => (step === STEPS[0] ? onCancel() : setStep(STEPS[STEPS.indexOf(step) - 1]));

  const handleCreate = async () => {
    if (!draft.city || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const building = await api.admin.createBuilding(idToken, {
        name: draft.name.trim(),
        cityId: draft.city.id,
        address: draft.address.trim(),
        password: draft.password,
        description: draft.description.trim() || null,
        entryCode: draft.entryCode.trim() || null,
        contactLinks: draft.contactLinks,
      });
      setCreated(building);
    } catch (err) {
      setError(t(err instanceof ApiError && err.status === 409 ? 'admin.duplicateError' : 'admin.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const enterToContinue = (valid: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && valid) next();
  };

  const reviewRows: { label: string; value: string }[] = [
    { label: t('admin.fieldName'), value: draft.name },
    { label: t('admin.fieldCity'), value: draft.city?.name ?? '' },
    { label: t('admin.fieldAddress'), value: draft.address },
    { label: t('admin.fieldDescription'), value: draft.description },
    { label: t('dashboard.entryCode'), value: draft.entryCode },
    { label: t('admin.contactsTitle'), value: draft.contactLinks.map((c) => c.link).join('\n') },
    { label: t('admin.fieldPassword'), value: '•'.repeat(draft.password.length) },
  ].filter((row) => row.value.trim());

  let content;
  if (created) {
    content = <ConfirmCheck message={t('wizard.done')} onDone={() => onDone(created)} />;
  } else if (step === 'name') {
    const valid = !!draft.name.trim();
    content = (
      <StepShell
        title={t('wizard.name.title')}
        subtitle={t('wizard.name.subtitle')}
        onContinue={next}
        continueDisabled={!valid}
        onBack={back}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder={t('wizard.name.placeholder')}
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          onKeyDown={enterToContinue(valid)}
        />
      </StepShell>
    );
  } else if (step === 'city') {
    content = (
      <StepShell
        title={t('wizard.city.title')}
        subtitle={t('wizard.city.subtitle')}
        onContinue={next}
        continueDisabled={!draft.city}
        onBack={back}
      >
        <Autocomplete
          options={cities}
          value={draft.city}
          onChange={(_e, city) => set('city', city)}
          getOptionLabel={(city) => city.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={filterCities}
          loading={cities.length === 0}
          renderInput={(params) => <TextField {...params} autoFocus placeholder={t('wizard.city.placeholder')} />}
        />
      </StepShell>
    );
  } else if (step === 'address') {
    const valid = !!draft.address.trim();
    content = (
      <StepShell
        title={t('wizard.address.title')}
        subtitle={t('wizard.address.subtitle')}
        onContinue={next}
        continueDisabled={!valid}
        onBack={back}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder={t('wizard.address.placeholder')}
          value={draft.address}
          onChange={(e) => set('address', e.target.value)}
          onKeyDown={enterToContinue(valid)}
        />
      </StepShell>
    );
  } else if (step === 'details') {
    content = (
      <StepShell title={t('wizard.details.title')} subtitle={t('wizard.details.subtitle')} onContinue={next} onBack={back}>
        <Stack spacing={2.5}>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label={t('admin.fieldDescription')}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <TextField
            fullWidth
            label={t('dashboard.entryCode')}
            value={draft.entryCode}
            onChange={(e) => set('entryCode', e.target.value)}
            slotProps={{ htmlInput: { maxLength: 20, dir: 'ltr' } }}
          />
        </Stack>
      </StepShell>
    );
  } else if (step === 'contacts') {
    content = (
      <StepShell title={t('wizard.contacts.title')} subtitle={t('wizard.contacts.subtitle')} onContinue={next} onBack={back}>
        <ContactLinksEditor
          links={draft.contactLinks}
          onAdd={(link) => set('contactLinks', [...draft.contactLinks, link])}
          onRemove={(_link, index) =>
            set(
              'contactLinks',
              draft.contactLinks.filter((_, i) => i !== index),
            )
          }
        />
      </StepShell>
    );
  } else if (step === 'password') {
    const valid = draft.password.length >= 4;
    content = (
      <StepShell
        title={t('wizard.password.title')}
        subtitle={t('wizard.password.subtitle')}
        onContinue={next}
        continueDisabled={!valid}
        onBack={back}
      >
        <TextField
          autoFocus
          fullWidth
          type="password"
          placeholder={t('wizard.password.placeholder')}
          value={draft.password}
          onChange={(e) => set('password', e.target.value)}
          onKeyDown={enterToContinue(valid)}
        />
      </StepShell>
    );
  } else {
    content = (
      <StepShell
        title={t('wizard.review.title')}
        subtitle={t('wizard.review.subtitle')}
        onContinue={handleCreate}
        continueDisabled={submitting}
        continueLabel={t('wizard.review.create')}
        onBack={back}
      >
        <Stack spacing={1.5}>
          {reviewRows.map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </StepShell>
    );
  }

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
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper' }}>
          {content}
        </Paper>

        {!created && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
            {STEPS.map((s) => (
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
