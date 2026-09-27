import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { api } from '../utils/api';
import { Building, Membership, PaymentMethod, RelationType } from '../types/building';

const RELATION_TYPES: RelationType[] = ['owner', 'tenant'];
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'transfer', 'bit', 'paybox'];

interface Draft {
  apartment: string;
  floor: string;
  relationType: RelationType | '';
  sqrm: string;
  paymentMethod: PaymentMethod | '';
}

const toDraft = (m: Membership | null): Draft => ({
  apartment: m?.apartment?.toString() ?? '',
  floor: m?.floor?.toString() ?? '',
  relationType: m?.relationType ?? '',
  sqrm: m?.sqrm?.toString() ?? '',
  paymentMethod: m?.paymentMethod ?? '',
});

const toInt = (value: string) => (value.trim() === '' ? null : Number.parseInt(value, 10));

interface MyUnitCardProps {
  building: Building;
  idToken: string;
  onBuildingChange: (building: Building) => void;
}

export default function MyUnitCard({ building, idToken, onBuildingChange }: MyUnitCardProps) {
  const { t } = useLanguage();
  const membership = building.membership;
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(membership));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rows: { labelKey: TranslationKey; value: string | null }[] = [
    { labelKey: 'myUnit.apartment', value: membership?.apartment?.toString() ?? null },
    { labelKey: 'myUnit.floor', value: membership?.floor?.toString() ?? null },
    {
      labelKey: 'myUnit.relation',
      value: membership?.relationType ? t(`relationType.${membership.relationType}`) : null,
    },
    { labelKey: 'myUnit.sqrm', value: membership?.sqrm?.toString() ?? null },
    {
      labelKey: 'myUnit.paymentMethod',
      value: membership?.paymentMethod ? t(`paymentMethod.${membership.paymentMethod}`) : null,
    },
    // Read-only for residents — set by the building admin.
    { labelKey: 'myUnit.monthlyPayment', value: membership?.monthlyPayment != null ? `₪${membership.monthlyPayment}` : null },
  ];
  const filled = rows.filter((row) => row.value !== null);

  const openEdit = () => {
    setDraft(toDraft(membership));
    setSaveError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.updateMembership(idToken, {
        apartment: toInt(draft.apartment),
        floor: toInt(draft.floor),
        relationType: draft.relationType || null,
        sqrm: toInt(draft.sqrm),
        paymentMethod: draft.paymentMethod || null,
      });
      onBuildingChange(updated);
      setEditOpen(false);
    } catch {
      setSaveError(t('myUnit.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('myUnit.title')}
            </Typography>
            {filled.length > 0 && (
              <Button startIcon={<EditOutlinedIcon />} onClick={openEdit} sx={{ textTransform: 'none', fontWeight: 500 }}>
                {t('common.edit')}
              </Button>
            )}
          </Stack>

          {filled.length === 0 ? (
            <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Typography variant="body2" color="text.secondary">
                {t('myUnit.empty')}
              </Typography>
              <Button variant="outlined" onClick={openEdit} sx={{ textTransform: 'none', fontWeight: 500 }}>
                {t('myUnit.addDetails')}
              </Button>
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 2 }}>
              {filled.map(({ labelKey, value }) => (
                <Box key={labelKey}>
                  <Typography variant="caption" color="text.secondary">
                    {t(labelKey)}
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('myUnit.title')}
          </Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={t('myUnit.apartment')}
                value={draft.apartment}
                onChange={(e) => setField('apartment', e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label={t('myUnit.floor')}
                value={draft.floor}
                onChange={(e) => setField('floor', e.target.value)}
              />
            </Stack>
            <TextField
              select
              fullWidth
              label={t('myUnit.relation')}
              value={draft.relationType}
              onChange={(e) => setField('relationType', e.target.value as RelationType)}
            >
              {RELATION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`relationType.${type}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label={t('myUnit.sqrm')}
              value={draft.sqrm}
              onChange={(e) => setField('sqrm', e.target.value)}
            />
            <TextField
              select
              fullWidth
              label={t('myUnit.paymentMethod')}
              value={draft.paymentMethod}
              onChange={(e) => setField('paymentMethod', e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {t(`paymentMethod.${method}`)}
                </MenuItem>
              ))}
            </TextField>
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
