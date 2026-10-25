import { useEffect, useId, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { api } from '../utils/api';
import { PaymentsLog } from './PaymentsShared';
import { alpha } from '@mui/material/styles';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { Building, MyApartment, MyPayments } from '../types/building';

interface Entry {
  building: Building;
  apartment: MyApartment;
}

/**
 * The user's apartments across every building they belong to (the current building first). Most people
 * have one, so the title is singular then. Clicking an apartment opens its "apartment center" — a
 * placeholder for now (to be designed). Apartments and owner/renter are set by building management.
 */
export default function MyApartmentsCard({
  buildings,
  currentBuildingId,
  idToken,
  onPaymentsChanged,
}: {
  buildings: Building[];
  currentBuildingId: string;
  idToken: string;
  /** Payment data changed here (e.g. the payer): the Payments tile should reload. */
  onPaymentsChanged?: () => void;
}) {
  const { t, dir } = useLanguage();
  const [open, setOpen] = useState<Entry | null>(null);

  const ordered = [...buildings].sort((a, b) => Number(b.id === currentBuildingId) - Number(a.id === currentBuildingId));
  const entries: Entry[] = ordered.flatMap((building) => building.myApartments.map((apartment) => ({ building, apartment })));
  // Only name the building when the apartments are in more than one.
  const severalBuildings = new Set(entries.map((e) => e.building.id)).size > 1;

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {entries.length > 1 ? t('myUnit.title') : t('myUnit.titleOne')}
        </Typography>

        {entries.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('myUnit.empty')}
          </Typography>
        )}

        <Stack spacing={1}>
          {entries.map((entry) => (
            <Box
              key={`${entry.building.id}-${entry.apartment.number}`}
              component="button"
              type="button"
              onClick={() => setOpen(entry)}
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                textAlign: 'start',
                font: 'inherit',
                color: 'inherit',
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 1.5,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
              })}
            >
              <HomeOutlinedIcon fontSize="small" color="primary" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }}>{t('members.apartment', { apartment: entry.apartment.number })}</Typography>
                {severalBuildings && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {entry.building.name}
                  </Typography>
                )}
              </Box>
              <Chip size="small" label={t(`relationType.${entry.apartment.relationType}`)} />
              <ChevronRightIcon fontSize="small" color="action" sx={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }} />
            </Box>
          ))}
        </Stack>
      </CardContent>

      {open && <ApartmentCenter entry={open} idToken={idToken} onPaymentsChanged={onPaymentsChanged} onClose={() => setOpen(null)} />}
    </Card>
  );
}

/** Who pays this apartment: an owner chooses among its residents; everyone else just sees it. */
function WhoPays({
  buildingId,
  apartmentId,
  idToken,
  onChanged,
}: {
  buildingId: string;
  apartmentId: number;
  idToken: string;
  onChanged?: () => void;
}) {
  const { t } = useLanguage();
  const [mine, setMine] = useState<MyPayments | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const labelId = useId();

  useEffect(() => {
    let cancelled = false;
    api.payments
      .mine(idToken, buildingId)
      .then((data) => {
        if (!cancelled) setMine(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  const apartment = mine?.apartments.find((a) => a.apartmentId === apartmentId);
  if (error) return <Alert severity="error">{t('payments.error')}</Alert>;
  if (!apartment) return null;

  const choose = async (userId: string) => {
    setSaving(true);
    setError(false);
    try {
      setMine(await api.payments.setPayer(idToken, buildingId, apartmentId, userId));
      onChanged?.();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('payments.whoPays')}
      </Typography>
      {apartment.canChoosePayer ? (
        <>
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={saving}>
            <InputLabel id={labelId}>{t('payments.whoPays')}</InputLabel>
            <Select labelId={labelId} label={t('payments.whoPays')} value={apartment.payer?.id ?? ''} onChange={(e) => choose(e.target.value)}>
              {apartment.residents.map((r) => (
                <MenuItem key={r.userId} value={r.userId}>
                  {r.name || t('members.unnamed')} · {t(`relationType.${r.relationType}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {t('payments.whoPaysHint')}
          </Typography>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {apartment.isPayer ? t('payments.payerYou') : t('payments.payerOther', { name: apartment.payer?.name || t('members.unnamed') })}
        </Typography>
      )}
    </Box>
  );
}

/** "Apartment center" (to be designed): details, who pays, and the apartment's payment log since I was linked to it. */
function ApartmentCenter({
  entry,
  idToken,
  onPaymentsChanged,
  onClose,
}: {
  entry: Entry;
  idToken: string;
  onPaymentsChanged?: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { apartment, building } = entry;
  const rows: { labelKey: TranslationKey; value: string | null }[] = [
    { labelKey: 'myUnit.floor', value: apartment.floor?.toString() ?? null },
    { labelKey: 'myUnit.sqrm', value: apartment.sqrm?.toString() ?? null },
    { labelKey: 'myUnit.paymentMethod', value: apartment.paymentMethod ? t(`paymentMethod.${apartment.paymentMethod}`) : null },
    { labelKey: 'myUnit.monthlyPayment', value: apartment.monthlyPayment != null ? `₪${apartment.monthlyPayment}` : null },
  ];

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('myUnit.center')} · {t('members.apartment', { apartment: apartment.number })}
        <Typography variant="body2" color="text.secondary">
          {building.name} · {building.address}, {building.city.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" sx={{ mb: 2 }}>
          <Chip size="small" label={t(`relationType.${apartment.relationType}`)} />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
          {rows
            .filter((row) => row.value !== null)
            .map(({ labelKey, value }) => (
              <Box key={labelKey}>
                <Typography variant="caption" color="text.secondary">
                  {t(labelKey)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {value}
                </Typography>
              </Box>
            ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {t('myUnit.setByManagement')}
        </Typography>

        <Divider sx={{ my: 2.5 }} />
        <WhoPays buildingId={building.id} apartmentId={apartment.id} idToken={idToken} onChanged={onPaymentsChanged} />

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('payments.apartmentLog')}
        </Typography>
        <PaymentsLog showApartment={false} load={() => api.payments.apartmentLog(idToken, building.id, apartment.id)} />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {t('myUnit.centerSoon')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('docs.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
