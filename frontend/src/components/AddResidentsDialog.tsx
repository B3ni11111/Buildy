import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import ResidentsEditor, { addableResidents, residentsReady, toResidentInputs, type ResidentDraft } from './ResidentsEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';

interface AddResidentsDialogProps {
  buildingId: string;
  idToken: string;
  onClose: () => void;
  onAdded: () => void;
}

/** Building management pastes residents' user IDs, sets their apartments in one table, and adds them all at once. */
export default function AddResidentsDialog({ buildingId, idToken, onClose, onAdded }: AddResidentsDialogProps) {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<ResidentDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = addableResidents(drafts).length;
  const ready = count > 0 && residentsReady(drafts);

  const add = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.manage.addMembers(idToken, buildingId, toResidentInputs(drafts));
      onAdded();
    } catch (err) {
      // 404/403/409 carry a readable reason (unknown IDs, already a member, blocked).
      setError(err instanceof ApiError && err.status !== 500 ? err.message : t('residents.addError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('residents.addTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('residents.addHint')}
        </Typography>
        <ResidentsEditor idToken={idToken} buildingId={buildingId} drafts={drafts} onChange={setDrafts} />
        {drafts.length > 0 && count > 0 && !residentsReady(drafts) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('residents.needApartments')}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" disabled={!ready || saving} onClick={add} sx={{ textTransform: 'none', fontWeight: 600 }}>
          {t('residents.add', { count })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
