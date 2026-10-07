import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MobileStepper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AvatarEditor, { type StagedPicture } from './AvatarEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import type { Building, CurrentUser, RelationType } from '../types/building';

const STEPS = ['apartment', 'phone', 'picture'] as const;
type Step = (typeof STEPS)[number];

const shownKey = (buildingId: string) => `buildy_setup_shown:${buildingId}`;

/** Required info is missing while there's no confirmed apartment and no full suggestion for this building. */
function needsSetup(building: Building) {
  if (building.myApartments.length > 0) return false;
  return !(building.myRequest?.apartment != null && building.myRequest?.relationType);
}

function wasShown(buildingId: string) {
  try {
    return localStorage.getItem(shownKey(buildingId)) === 'true';
  } catch {
    return true;
  }
}

function markShown(buildingId: string) {
  try {
    localStorage.setItem(shownKey(buildingId), 'true');
  } catch {
    // not remembered — the banner still offers it
  }
}

interface AccountSetupProps {
  building: Building;
  currentUser: CurrentUser | null;
  idToken: string;
  onBuildingChange: (building: Building) => void;
  onCurrentUserChange: (user: CurrentUser) => void;
}

/**
 * "Finish setting up your account": a banner on the home screen while required info is
 * missing for this building, and a short dialog — apartment + owner/renter (required),
 * then phone and picture (optional, can be skipped). Opens by itself the first time.
 */
export default function AccountSetup({ building, currentUser, idToken, onBuildingChange, onCurrentUserChange }: AccountSetupProps) {
  const { t } = useLanguage();
  const missing = needsSetup(building);
  const [open, setOpen] = useState(() => missing && !wasShown(building.id));
  const [step, setStep] = useState<Step>('apartment');
  const [apartment, setApartment] = useState(building.myRequest?.apartment?.toString() ?? '');
  const [relationType, setRelationType] = useState<RelationType | null>(building.myRequest?.relationType ?? null);
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [picture, setPicture] = useState<StagedPicture>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!missing && !open) return null;

  const close = () => {
    markShown(building.id);
    if (picture?.kind === 'upload') URL.revokeObjectURL(picture.previewUrl);
    setPicture(null);
    setOpen(false);
    setStep('apartment');
    setError(null);
  };

  const apartmentNumber = Number.parseInt(apartment, 10);
  const requiredDone = apartmentNumber >= 1 && apartmentNumber <= 32767 && !!relationType;

  const finish = async () => {
    if (!requiredDone || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updatedBuilding = await api.setMyRequest(idToken, building.id, { apartment: apartmentNumber, relationType: relationType! });
      if (phone.trim() !== (currentUser?.phone ?? '')) onCurrentUserChange(await api.updateMe(idToken, { phone: phone.trim() }));
      if (picture?.kind === 'upload') onCurrentUserChange(await api.setAvatar(idToken, picture.file));
      onBuildingChange(updatedBuilding);
      close();
    } catch (err) {
      setError(t(err instanceof ApiError && err.status === 400 ? 'settings.phoneInvalid' : 'settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const index = STEPS.indexOf(step);
  const isLast = index === STEPS.length - 1;

  return (
    <>
      {missing && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" variant="outlined" onClick={() => setOpen(true)} sx={{ textTransform: 'none' }}>
              {t('setup.open')}
            </Button>
          }
        >
          <strong>{t('setup.title')}</strong> — {t('setup.bannerHint')}
        </Alert>
      )}

      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('setup.title')}
          <Typography variant="body2" color="text.secondary">
            {building.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {step === 'apartment' && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('setup.apartmentHint')}
              </Typography>
              <TextField
                autoFocus
                required
                label={t('myUnit.apartment')}
                value={apartment}
                onChange={(e) => setApartment(e.target.value.replace(/\D/g, '').slice(0, 5))}
                slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  {t('myUnit.relation')} *
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={relationType}
                  onChange={(_e, value: RelationType | null) => value && setRelationType(value)}
                >
                  <ToggleButton value="owner" sx={{ textTransform: 'none' }}>
                    {t('relationType.owner')}
                  </ToggleButton>
                  <ToggleButton value="tenant" sx={{ textTransform: 'none' }}>
                    {t('relationType.tenant')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>
          )}
          {step === 'phone' && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('setup.optionalHint')}
              </Typography>
              <TextField
                autoFocus
                label={t('settings.phoneLabel')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText={t('settings.phoneHint')}
                slotProps={{ htmlInput: { inputMode: 'tel', dir: 'ltr' } }}
              />
            </Stack>
          )}
          {step === 'picture' && (
            <Stack spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'stretch' }}>
                {t('setup.optionalHint')}
              </Typography>
              <AvatarEditor
                userId={currentUser?.id ?? 'me'}
                name={currentUser?.name}
                picture={currentUser?.picture ?? { google: null, version: null }}
                staged={picture}
                onStage={(next) => {
                  if (picture?.kind === 'upload') URL.revokeObjectURL(picture.previewUrl);
                  setPicture(next);
                }}
                onError={setError}
                size={96}
              />
            </Stack>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <MobileStepper
            variant="dots"
            steps={STEPS.length}
            position="static"
            activeStep={index}
            backButton={null}
            nextButton={null}
            sx={{ justifyContent: 'center', bgcolor: 'transparent', mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={index === 0 ? close : () => setStep(STEPS[index - 1])} sx={{ textTransform: 'none' }}>
            {index === 0 ? t('setup.later') : t('setup.back')}
          </Button>
          <Stack direction="row" spacing={1}>
            {index > 0 && !isLast && (
              <Button onClick={() => setStep(STEPS[index + 1])} sx={{ textTransform: 'none' }}>
                {t('setup.skip')}
              </Button>
            )}
            <Button
              variant="contained"
              disabled={(step === 'apartment' && !requiredDone) || saving}
              onClick={isLast ? finish : () => setStep(STEPS[index + 1])}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {isLast ? t('setup.finish') : t('common.continue')}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
