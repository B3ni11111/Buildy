import { useEffect, useId, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../i18n/LanguageContext';
import { PAYMENT_METHODS, PaymentCharge, PaymentLogRow, PaymentMethod, PaymentSettings } from '../types/building';
import { useMonthLabel } from '../utils/payments';
import StatusLabel from './StatusLabel';

export function StatusChip({ charge }: { charge: Pick<PaymentCharge, 'status'> | null }) {
  const { t } = useLanguage();
  if (!charge) return <Typography variant="body2" color="text.secondary">—</Typography>;
  const paid = charge.status === 'paid';
  return <StatusLabel tone={paid ? 'done' : 'open'} label={paid ? t('payments.paid') : t('payments.unpaid')} />;
}

export function MethodSelect({ value, onChange, label }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void; label?: string }) {
  const { t } = useLanguage();
  const text = label ?? t('payments.method');
  // The label is linked to the field, so screen readers (and tests) find it by name.
  const labelId = useId();
  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{text}</InputLabel>
      <Select labelId={labelId} label={text} value={value} onChange={(e) => onChange(e.target.value as PaymentMethod)}>
        {PAYMENT_METHODS.map((method) => (
          <MenuItem key={method} value={method}>
            {t(`paymentMethod.${method}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}


/** The payments setup: how months open (and on which day), the default fee and the default method. */
export function PaymentSettingsForm({ value, onChange }: { value: PaymentSettings; onChange: (s: PaymentSettings) => void }) {
  const { t } = useLanguage();
  const set = (patch: Partial<PaymentSettings>) => onChange({ ...value, ...patch });
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('payments.openMode')}
        </Typography>
        <RadioGroup value={value.openMode} onChange={(e) => set({ openMode: e.target.value as PaymentSettings['openMode'] })}>
          <FormControlLabel value="manual" control={<Radio size="small" />} label={t('payments.openManual')} />
          <FormControlLabel value="auto" control={<Radio size="small" />} label={t('payments.openAuto')} />
        </RadioGroup>
        {value.openMode === 'auto' && (
          <TextField
            size="small"
            label={t('payments.openDay')}
            value={value.openDay ? String(value.openDay) : ''}
            onChange={(e) => set({ openDay: Number(e.target.value.replace(/[^\d]/g, '').slice(0, 2)) || 0 })}
            error={!(value.openDay >= 1 && value.openDay <= 28)}
            slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
            sx={{ mt: 1, maxWidth: 200 }}
          />
        )}
      </Box>
      <TextField
        size="small"
        label={t('payments.defaultFee')}
        helperText={t('payments.defaultFeeHint')}
        value={value.defaultFee === null ? '' : String(value.defaultFee)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 7);
          set({ defaultFee: digits === '' ? null : Number(digits) });
        }}
        slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
      />
      <MethodSelect value={value.defaultMethod ?? 'card'} onChange={(defaultMethod) => set({ defaultMethod })} label={t('payments.defaultMethod')} />
    </Stack>
  );
}

/** A payments log with month / apartment / method filters (the apartment filter only for the building-wide log). */
export function PaymentsLogTable({ rows, showApartment }: { rows: PaymentLogRow[]; showApartment: boolean }) {
  const { t, language } = useLanguage();
  const monthLabel = useMonthLabel();
  const [month, setMonth] = useState('');
  const [apartment, setApartment] = useState('');
  const [method, setMethod] = useState('');
  const idPrefix = useId();

  const months = useMemo(() => [...new Set(rows.map((r) => r.period))], [rows]);
  const apartments = useMemo(() => [...new Set(rows.map((r) => r.apartmentNumber))].sort((a, b) => a - b), [rows]);
  const shown = rows.filter(
    (r) =>
      (!month || r.period === month) &&
      (!apartment || r.apartmentNumber === Number(apartment)) &&
      (!method || r.method === method),
  );
  const person = (p: PaymentLogRow['paidBy']) => (p ? p.name || t('members.unnamed') : '—');

  const filter = (key: string, label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id={`${idPrefix}-${key}`}>{label}</InputLabel>
      <Select labelId={`${idPrefix}-${key}`} label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value="">{t('payments.filterAll')}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box>
      <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        {filter('month', t('payments.filterMonth'), month, setMonth, months.map((m) => ({ value: m, label: monthLabel(m) })))}
        {showApartment &&
          filter(
            'apartment',
            t('payments.filterApartment'),
            apartment,
            setApartment,
            apartments.map((n) => ({ value: String(n), label: t('members.apartment', { apartment: n }) })),
          )}
        {filter('method', t('payments.filterMethod'), method, setMethod, PAYMENT_METHODS.map((m) => ({ value: m, label: t(`paymentMethod.${m}`) })))}
      </Stack>

      {shown.length === 0 ? (
        <Typography color="text.secondary">{t('payments.logEmpty')}</Typography>
      ) : (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('payments.colMonth')}</TableCell>
                {showApartment && <TableCell>{t('payments.filterApartment')}</TableCell>}
                <TableCell>{t('payments.colAmount')}</TableCell>
                <TableCell>{t('payments.colStatus')}</TableCell>
                <TableCell>{t('payments.colPaidOn')}</TableCell>
                <TableCell>{t('payments.colPaidBy')}</TableCell>
                <TableCell>{t('payments.filterMethod')}</TableCell>
                <TableCell>{t('payments.colConfirmedBy')}</TableCell>
                <TableCell>{t('payments.colHow')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{monthLabel(r.period)}</TableCell>
                  {showApartment && <TableCell>{r.apartmentNumber}</TableCell>}
                  <TableCell dir="ltr" sx={{ textAlign: 'start' }}>
                    ₪{r.amount}
                  </TableCell>
                  <TableCell>
                    <StatusChip charge={r} />
                  </TableCell>
                  <TableCell>
                    {r.paidAt
                      ? new Date(r.paidAt).toLocaleString(language, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </TableCell>
                  <TableCell>{r.status === 'paid' ? person(r.paidBy) : '—'}</TableCell>
                  <TableCell>{r.method ? t(`paymentMethod.${r.method}`) : '—'}</TableCell>
                  <TableCell>{r.status === 'paid' ? person(r.confirmedBy) : '—'}</TableCell>
                  <TableCell>{r.confirmation ? t(`payments.confirmation.${r.confirmation}`) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

/** Loads a log and shows it in a table (`load` is the building-wide or one apartment's log). */
export function PaymentsLog({ load, showApartment }: { load: () => Promise<PaymentLogRow[]>; showApartment: boolean }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PaymentLogRow[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (error) return <Alert severity="error">{t('payments.error')}</Alert>;
  if (!rows) return <LinearProgress />;
  return <PaymentsLogTable rows={rows} showApartment={showApartment} />;
}

/** The log as a full-screen window (the app has no page routing yet). */
export function PaymentsLogDialog({
  title,
  load,
  showApartment,
  onClose,
}: {
  title: string;
  load: () => Promise<PaymentLogRow[]>;
  showApartment: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open fullScreen onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1 }}>{title}</Box>
        <IconButton onClick={onClose} aria-label={t('docs.close')}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <PaymentsLog load={load} showApartment={showApartment} />
      </DialogContent>
    </Dialog>
  );
}
