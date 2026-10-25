import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  createFilterOptions,
} from '@mui/material';
import StepShell from '../onboarding/StepShell';
import ConfirmCheck from '../onboarding/ConfirmCheck';
import ContactLinksEditor from '../admin/ContactLinksEditor';
import ResidentsEditor, { addableResidents, residentsReady, toResidentInputs, type ResidentDraft } from './ResidentsEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { City, ContactLinkInput, PaymentSettings } from '../types/building';
import { PaymentSettingsForm } from './PaymentsShared';
import { DEFAULT_PAYMENT_SETTINGS, paymentSettingsValid } from '../utils/payments';

type ManagementRole = 'committee_head' | 'management_company';

// Ordered wizard steps — the dot indicator and back navigation follow the list.
// Admins create buildings without becoming part of them, so they don't pick a role.
const MEMBER_STEPS = ['role', 'name', 'city', 'address', 'details', 'contacts', 'residents', 'payments', 'review'] as const;
const ADMIN_STEPS = MEMBER_STEPS.filter((s) => s !== 'role');
type Step = (typeof MEMBER_STEPS)[number];

// ~1.3k cities: only render the first matches while typing.
const filterCities = createFilterOptions<City>({ limit: 50 });

interface Draft {
  role: ManagementRole;
  name: string;
  city: City | null;
  address: string;
  description: string;
  entryCode: string;
  contactLinks: ContactLinkInput[];
  residents: ResidentDraft[];
  payments: PaymentSettings;
}

interface CreateBuildingWizardProps {
  idToken: string;
  /** An admin creates a building for others; anyone else becomes its committee head / management company. */
  asAdmin: boolean;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Create a building: its details, its contact links, and — optionally — the first residents, pasted
 * as user IDs and given their apartments in one table. Any signed-in user may do this; nobody can
 * get into the building unless its management adds them.
 */
export default function CreateBuildingWizard({ idToken, asAdmin, onDone, onCancel }: CreateBuildingWizardProps) {
  const { t } = useLanguage();
  const steps: readonly Step[] = asAdmin ? ADMIN_STEPS : MEMBER_STEPS;
  const [step, setStep] = useState<Step>(steps[0]);
  const [draft, setDraft] = useState<Draft>({
    role: 'committee_head',
    name: '',
    city: null,
    address: '',
    description: '',
    entryCode: '',
    contactLinks: [],
    residents: [],
    payments: DEFAULT_PAYMENT_SETTINGS,
  });
  const [cities, setCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

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
  const next = () => setStep(steps[steps.indexOf(step) + 1]);
  // First step's back button leaves the wizard.
  const back = () => (step === steps[0] ? onCancel() : setStep(steps[steps.indexOf(step) - 1]));

  const handleCreate = async () => {
    if (!draft.city || submitting) return;
    setSubmitting(true);
    setError(null);
    const building = {
      name: draft.name.trim(),
      cityId: draft.city.id,
      address: draft.address.trim(),
      description: draft.description.trim() || null,
      entryCode: draft.entryCode.trim() || null,
      contactLinks: draft.contactLinks,
      residents: toResidentInputs(draft.residents),
      payments: draft.payments,
    };
    try {
      if (asAdmin) await api.admin.createBuilding(idToken, building);
      else await api.createBuilding(idToken, { ...building, role: draft.role });
      setCreated(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError(t(asAdmin ? 'admin.duplicateError' : 'wizard.duplicateError'));
      else if (err instanceof ApiError && (err.status === 404 || err.status === 403)) setError(err.message);
      else setError(t('admin.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const enterToContinue = (valid: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && valid) next();
  };

  const residentCount = addableResidents(draft.residents).length;
  const reviewRows: { label: string; value: string }[] = [
    ...(asAdmin ? [] : [{ label: t('wizard.role.label'), value: t(`role.${draft.role}`) }]),
    { label: t('admin.fieldName'), value: draft.name },
    { label: t('admin.fieldCity'), value: draft.city?.name ?? '' },
    { label: t('admin.fieldAddress'), value: draft.address },
    { label: t('admin.fieldDescription'), value: draft.description },
    { label: t('dashboard.entryCode'), value: draft.entryCode },
    { label: t('admin.contactsTitle'), value: draft.contactLinks.map((c) => c.link).join('\n') },
    {
      label: t('members.residents'),
      value: addableResidents(draft.residents)
        .map((r) => `${r.name || t('members.unnamed')} · ${t('members.apartment', { apartment: r.number })} · ${t(`relationType.${r.relationType}`)}`)
        .join('\n'),
    },
    {
      label: t('payments.wizardTitle'),
      value: [
        draft.payments.openMode === 'auto' ? t('payments.autoOpensOn', { day: draft.payments.openDay }) : t('payments.openManual'),
        draft.payments.defaultFee !== null ? `${t('payments.defaultFee')}: ₪${draft.payments.defaultFee}` : '',
        `${t('payments.defaultMethod')}: ${t(`paymentMethod.${draft.payments.defaultMethod ?? 'card'}`)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ].filter((row) => row.value.trim());

  let content;
  if (created) {
    content = <ConfirmCheck message={t('wizard.done')} onDone={onDone} />;
  } else if (step === 'role') {
    content = (
      <StepShell title={t('wizard.role.title')} subtitle={t('wizard.role.subtitle')} onContinue={next} onBack={back}>
        <ToggleButtonGroup
          exclusive
          fullWidth
          orientation="vertical"
          value={draft.role}
          onChange={(_e, value: ManagementRole | null) => value && set('role', value)}
        >
          {(['committee_head', 'management_company'] as const).map((role) => (
            <ToggleButton key={role} value={role} sx={{ textTransform: 'none', py: 1.5 }}>
              {t(`role.${role}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </StepShell>
    );
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
  } else if (step === 'residents') {
    content = (
      <StepShell
        title={t('wizard.residents.title')}
        subtitle={t('wizard.residents.subtitle')}
        onContinue={next}
        continueDisabled={!residentsReady(draft.residents)}
        onBack={back}
      >
        <ResidentsEditor
          idToken={idToken}
          drafts={draft.residents}
          onChange={(residents) => set('residents', residents)}
          blockSelf={!asAdmin}
        />
        {residentCount > 0 && !residentsReady(draft.residents) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {t('residents.needApartments')}
          </Typography>
        )}
      </StepShell>
    );
  } else if (step === 'payments') {
    content = (
      <StepShell
        title={t('payments.wizardTitle')}
        subtitle={t('payments.wizardSubtitle')}
        onContinue={next}
        continueDisabled={!paymentSettingsValid(draft.payments)}
        onBack={back}
      >
        <PaymentSettingsForm value={draft.payments} onChange={(payments) => set('payments', payments)} />
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
      {/* The residents table needs more room than the other single-field steps. */}
      <Container maxWidth={step === 'residents' ? 'sm' : 'xs'} disableGutters>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper' }}>
          {content}
        </Paper>

        {!created && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
            {steps.map((s) => (
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
