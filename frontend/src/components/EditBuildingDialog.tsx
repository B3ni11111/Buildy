import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import ContactLinksEditor from '../admin/ContactLinksEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError } from '../utils/api';
import type { City, ContactLink, ContactLinkInput } from '../types/building';

const filterCities = createFilterOptions<City>({ limit: 50 });

export interface BuildingFields {
  name: string;
  city: City;
  address: string;
  description: string | null;
  entryCode: string | null;
  contactLinks: ContactLink[];
}

export interface BuildingSave {
  /** Only sent when `canEditIdentity`. */
  name?: string;
  cityId?: number;
  address?: string;
  description: string | null;
  entryCode: string | null;
  password?: string;
}

interface EditBuildingDialogProps {
  building: BuildingFields;
  /** Admins edit name, city and address; building management sees them read-only. */
  canEditIdentity: boolean;
  /** City choices (only needed when `canEditIdentity`). */
  cities?: City[];
  onClose: () => void;
  /** Saves the fields; throw an ApiError to show it (409 = duplicate address). */
  onSave: (fields: BuildingSave) => Promise<void>;
  /** Contact links save immediately (not on "Save"). */
  onAddLink: (input: ContactLinkInput) => Promise<ContactLink>;
  onRemoveLink: (link: ContactLink) => Promise<void>;
  onContactLinksChange: (links: ContactLink[]) => void;
}

/** The one building editor — used by the admin console and the home screen's building tile. */
export default function EditBuildingDialog({
  building,
  canEditIdentity,
  cities = [],
  onClose,
  onSave,
  onAddLink,
  onRemoveLink,
  onContactLinksChange,
}: EditBuildingDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(building.name);
  const [city, setCity] = useState<City | null>(building.city);
  const [address, setAddress] = useState(building.address);
  const [description, setDescription] = useState(building.description ?? '');
  const [entryCode, setEntryCode] = useState(building.entryCode ?? '');
  const [password, setPassword] = useState('');
  const [contactLinks, setContactLinks] = useState<ContactLink[]>(building.contactLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && city && address.trim() && (password === '' || password.length >= 4);

  const handleSave = async () => {
    if (!valid || !city || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(canEditIdentity ? { name: name.trim(), cityId: city.id, address: address.trim() } : {}),
        description: description.trim() || null,
        entryCode: entryCode.trim() || null,
        ...(password ? { password } : {}),
      });
    } catch (err) {
      setError(t(err instanceof ApiError && err.status === 409 ? 'admin.duplicateError' : 'admin.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('admin.editBuilding')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label={t('admin.fieldName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEditIdentity}
          />
          <Autocomplete
            options={cities.length ? cities : [building.city]}
            value={city}
            onChange={(_e, value) => setCity(value)}
            getOptionLabel={(c) => c.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={filterCities}
            disabled={!canEditIdentity}
            renderInput={(params) => <TextField {...params} label={t('admin.fieldCity')} />}
          />
          <TextField
            fullWidth
            label={t('admin.fieldAddress')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEditIdentity}
            helperText={canEditIdentity ? undefined : t('admin.identityAdminOnly')}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label={t('admin.fieldDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            fullWidth
            label={t('dashboard.entryCode')}
            value={entryCode}
            onChange={(e) => setEntryCode(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 20, dir: 'ltr' } }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('admin.passwordKeep')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={password !== '' && password.length < 4}
            helperText={password !== '' && password.length < 4 ? t('wizard.password.placeholder') : undefined}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('admin.contactsTitle')}
            </Typography>
            <ContactLinksEditor
              links={contactLinks}
              onAdd={async (input) => {
                const created = await onAddLink(input);
                const next = [...contactLinks, created];
                setContactLinks(next);
                onContactLinksChange(next);
              }}
              onRemove={async (link) => {
                try {
                  await onRemoveLink(link);
                  const next = contactLinks.filter((l) => l.id !== link.id);
                  setContactLinks(next);
                  onContactLinksChange(next);
                } catch {
                  setError(t('admin.saveError'));
                }
              }}
            />
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!valid || saving}
          onClick={handleSave}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
