import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { Building, FeeScope, MyPayments, PaymentMethod, PaymentSettings, PaymentsOverview } from '../types/building';
import { MethodSelect, PaymentSettingsForm, PaymentsLogDialog, StatusChip } from './PaymentsShared';
import SlideToPay from './SlideToPay';
import PaidCheck from './PaidCheck';
import { DEFAULT_PAYMENT_SETTINGS, paymentSettingsValid, useMonthLabel } from '../utils/payments';

interface PaymentsCardProps {
  building: Building;
  idToken: string;
}

type OverviewApartment = PaymentsOverview['apartments'][number];

/** Test mode only (5-minute "months"): refetch every 20s so a new period shows up without a reload. */
function useTestModeRefresh(month: string | undefined, refresh: () => void) {
  const testMode = !!month?.includes('T');
  useEffect(() => {
    if (!testMode) return;
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode]);
}

/**
 * Monthly fees. Building management sees the month's budget (collected / goal), every apartment,
 * the setup and the building's payments log; every resident sees only their own part and their
 * apartments' logs. Demo: nothing here moves real money.
 */
export default function PaymentsCard({ building, idToken }: PaymentsCardProps) {
  const { t } = useLanguage();
  const showMine = building.myApartments.length > 0;

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('widgets.tile.payments')}
        </Typography>
        {building.canManage && <ManagerBudget buildingId={building.id} idToken={idToken} />}
        {building.canManage && showMine && <Divider sx={{ my: 2.5 }} />}
        {showMine && <MyPart buildingId={building.id} idToken={idToken} />}
        {!building.canManage && !showMine && (
          <Typography variant="body2" color="text.secondary">
            {t('payments.noApartments')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function ManagerBudget({ buildingId, idToken }: { buildingId: string; idToken: string }) {
  const { t } = useLanguage();
  const monthLabel = useMonthLabel();
  const [data, setData] = useState<PaymentsOverview | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  // What the confirm dialog is about: one apartment (with the method to record), or everyone.
  const [confirm, setConfirm] = useState<{ apartment: OverviewApartment; method: PaymentMethod } | 'all' | null>(null);
  const [feeFor, setFeeFor] = useState<OverviewApartment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const percent = data && data.goal > 0 ? Math.min(100, (data.collected / data.goal) * 100) : 0;
  // The bar starts empty and fills to `percent` over 1s (and moves smoothly on every change).
  const [shownPercent, setShownPercent] = useState(0);
  useEffect(() => {
    // Two frames: the empty bar is painted first, so the browser has something to animate from.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setShownPercent(percent));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [percent]);

  useEffect(() => {
    let cancelled = false;
    api.manage.payments
      .overview(idToken, buildingId)
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  useTestModeRefresh(data?.month, () => {
    api.manage.payments.overview(idToken, buildingId).then(setData).catch(() => {});
  });

  /** Runs a change; every endpoint answers with the fresh overview. */
  const run = async (action: () => Promise<PaymentsOverview>) => {
    setBusy(true);
    setError(false);
    try {
      setData(await action());
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return error ? <Alert severity="error">{t('payments.error')}</Alert> : <LinearProgress />;
  }

  // Not set up yet (e.g. a building created before the setup step): set it up first.
  if (!data.settings) {
    return (
      <SetupPanel
        busy={busy}
        error={error}
        onSave={(settings) => run(() => api.manage.payments.saveSettings(idToken, buildingId, settings))}
      />
    );
  }

  const unpaidCount = data.apartments.filter((a) => a.payment?.status === 'unpaid').length;

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('payments.budget')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {monthLabel(data.month)}
        </Typography>
        <Button size="small" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => setLogOpen(true)} sx={{ textTransform: 'none' }}>
          {t('payments.log')}
        </Button>
        <IconButton size="small" aria-label={t('payments.settings')} onClick={() => setSettingsOpen(true)}>
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {t('payments.error')}
        </Alert>
      )}

      {!data.opened ? (
        <Stack spacing={1.5} sx={{ mt: 1.5, alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary">
            {data.settings.openMode === 'auto' ? t('payments.autoOpensOn', { day: data.settings.openDay }) : t('payments.notOpened')}
          </Typography>
          <Button variant="contained" disabled={busy} onClick={() => run(() => api.manage.payments.openMonth(idToken, buildingId))} sx={{ textTransform: 'none' }}>
            {t('payments.openMonth')}
          </Button>
        </Stack>
      ) : (
        <>
          <Box sx={{ mt: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontWeight: 600 }}>
                {t('payments.collected', { collected: data.collected, goal: data.goal })}
              </Typography>
              {data.complete && <CheckCircleOutlinedIcon color="success" fontSize="small" aria-label={t('payments.complete')} />}
            </Stack>
            <LinearProgress
              variant="determinate"
              value={shownPercent}
              color={data.complete ? 'success' : 'primary'}
              sx={{ mt: 1, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { transition: 'transform 1s ease-out' } }}
            />
          </Box>

          <Stack direction="row" sx={{ mt: 1.5, gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" disabled={busy || unpaidCount === 0} onClick={() => setConfirm('all')} sx={{ textTransform: 'none' }}>
              {t('payments.markAll')}
            </Button>
            {data.missing > 0 && (
              <Button size="small" variant="text" disabled={busy} onClick={() => run(() => api.manage.payments.openMonth(idToken, buildingId))} sx={{ textTransform: 'none' }}>
                {t('payments.addNew', { count: data.missing })}
              </Button>
            )}
          </Stack>

          <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
            {data.apartments.map((apartment) => (
              <Stack key={apartment.apartmentId} direction="row" sx={{ py: 1, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('members.apartment', { apartment: apartment.number })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {apartment.payer
                      ? t('payments.payer', { name: apartment.payer.name || t('members.unnamed') })
                      : t('payments.noResidents')}
                  </Typography>
                </Box>
                <Typography variant="body2" dir="ltr">
                  {t('payments.fee', { amount: apartment.payment?.amount ?? apartment.fee })}
                </Typography>
                <IconButton size="small" aria-label={t('payments.editFee')} onClick={() => setFeeFor(apartment)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <StatusChip charge={apartment.payment} />
                {apartment.payment?.status === 'unpaid' && (
                  <Button size="small" disabled={busy} onClick={() => setConfirm({ apartment, method: apartment.method })} sx={{ textTransform: 'none' }}>
                    {t('payments.markPaid')}
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </>
      )}

      {confirm && (
        <Dialog open onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('payments.confirmTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirm === 'all' ? t('payments.confirmAll') : t('payments.confirmOne', { apartment: confirm.apartment.number })}
            </DialogContentText>
            {confirm !== 'all' && (
              <Box sx={{ mt: 2 }}>
                <MethodSelect value={confirm.method} onChange={(method) => setConfirm({ ...confirm, method })} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirm(null)} sx={{ textTransform: 'none' }}>
              {t('payments.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                const target = confirm;
                setConfirm(null);
                await run(() =>
                  target === 'all'
                    ? api.manage.payments.markAllPaid(idToken, buildingId)
                    : api.manage.payments.markPaid(idToken, buildingId, target.apartment.apartmentId, target.method),
                );
              }}
              sx={{ textTransform: 'none' }}
            >
              {t('payments.markPaid')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {feeFor && (
        <FeeDialog
          apartment={feeFor}
          onClose={() => setFeeFor(null)}
          onSave={async (amount, scope) => {
            const ok = await run(() => api.manage.payments.changeFee(idToken, buildingId, feeFor.apartmentId, amount, scope));
            if (ok) setFeeFor(null);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          initial={data.settings}
          onClose={() => setSettingsOpen(false)}
          onSave={async (settings) => {
            if (await run(() => api.manage.payments.saveSettings(idToken, buildingId, settings))) setSettingsOpen(false);
          }}
        />
      )}

      {logOpen && (
        <PaymentsLogDialog
          title={t('payments.log')}
          showApartment
          load={() => api.manage.payments.log(idToken, buildingId)}
          onClose={() => setLogOpen(false)}
        />
      )}
    </Box>
  );
}

/** First-time setup inside the tile (buildings created before the wizard had a payments step). */
function SetupPanel({ busy, error, onSave }: { busy: boolean; error: boolean; onSave: (s: PaymentSettings) => Promise<boolean> }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t('payments.setupTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        {t('payments.setupHint')}
      </Typography>
      <PaymentSettingsForm value={settings} onChange={setSettings} />
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {t('payments.error')}
        </Alert>
      )}
      <Button variant="contained" disabled={busy || !paymentSettingsValid(settings)} onClick={() => onSave(settings)} sx={{ mt: 2, textTransform: 'none' }}>
        {t('payments.saveSetup')}
      </Button>
    </Box>
  );
}

function SettingsDialog({ initial, onClose, onSave }: { initial: PaymentSettings; onClose: () => void; onSave: (s: PaymentSettings) => Promise<void> }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PaymentSettings>(initial);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('payments.settings')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <PaymentSettingsForm value={settings} onChange={setSettings} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {t('payments.settingsNextMonth')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('payments.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={saving || !paymentSettingsValid(settings)}
          onClick={async () => {
            setSaving(true);
            await onSave(settings);
            setSaving(false);
          }}
          sx={{ textTransform: 'none' }}
        >
          {t('payments.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Change an apartment's fee: this month only, or from now on (the standing fee future months copy). */
function FeeDialog({
  apartment,
  onClose,
  onSave,
}: {
  apartment: OverviewApartment;
  onClose: () => void;
  onSave: (amount: number, scope: FeeScope) => Promise<void>;
}) {
  const { t } = useLanguage();
  // "This month only" needs an unpaid charge this month; otherwise only the standing fee can change.
  const canChangeMonth = apartment.payment?.status === 'unpaid';
  const [amount, setAmount] = useState(String(apartment.payment?.amount ?? apartment.fee));
  const [scope, setScope] = useState<FeeScope>(canChangeMonth ? 'once' : 'permanent');
  const [saving, setSaving] = useState(false);
  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isInteger(value) && value >= 0 && value <= 1_000_000;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('payments.feeTitle', { apartment: apartment.number })}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t('payments.feeAmount')}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
        />
        <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as FeeScope)} sx={{ mt: 1 }}>
          <FormControlLabel value="once" disabled={!canChangeMonth} control={<Radio />} label={t('payments.scopeOnce')} />
          <FormControlLabel value="permanent" control={<Radio />} label={t('payments.scopePermanent')} />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('payments.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!valid || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(value, scope);
            setSaving(false);
          }}
          sx={{ textTransform: 'none' }}
        >
          {t('payments.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** The signed-in resident's own apartments: this month's amount, who pays, the demo Pay, past months and each apartment's log. */
function MyPart({ buildingId, idToken }: { buildingId: string; idToken: string }) {
  const { t } = useLanguage();
  const monthLabel = useMonthLabel();
  const [data, setData] = useState<MyPayments | null>(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [logFor, setLogFor] = useState<{ apartmentId: number; number: number } | null>(null);
  const [justPaid, setJustPaid] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.payments
      .mine(idToken, buildingId)
      .then((mine) => {
        if (!cancelled) setData(mine);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  useTestModeRefresh(data?.month, () => {
    api.payments.mine(idToken, buildingId).then(setData).catch(() => {});
  });

  if (!data) {
    return error ? <Alert severity="error">{t('payments.error')}</Alert> : <LinearProgress />;
  }

  const pay = async (apartmentId: number) => {
    setBusyId(apartmentId);
    setError(false);
    try {
      setData(await api.payments.pay(idToken, buildingId, apartmentId));
      // Let the paid moment play, then show the plain "Paid" status again.
      setJustPaid(apartmentId);
      window.setTimeout(() => setJustPaid((current) => (current === apartmentId ? null : current)), 3500);
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('payments.myPart')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {monthLabel(data.month)}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {t('payments.error')}
        </Alert>
      )}

      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {data.apartments.map((apartment) => (
          <Box key={apartment.apartmentId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('members.apartment', { apartment: apartment.number })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {apartment.payment ? t('payments.fee', { amount: apartment.payment.amount }) : t('payments.notOpenedResident')}
                </Typography>
              </Box>
              {apartment.payment && justPaid !== apartment.apartmentId && <StatusChip charge={apartment.payment} />}
              {apartment.isPayer && apartment.payment?.status === 'unpaid' && (
                <Box sx={{ flexBasis: '100%', mt: 1 }}>
                  <SlideToPay
                    label={t('payments.slideToPay', { amount: apartment.payment.amount })}
                    disabled={busyId !== null && busyId !== apartment.apartmentId}
                    onConfirm={() => pay(apartment.apartmentId)}
                  />
                </Box>
              )}
              {justPaid === apartment.apartmentId && (
                <Box sx={{ flexBasis: '100%', mt: 1 }}>
                  <PaidCheck label={t('payments.paidThanks')} />
                </Box>
              )}
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {apartment.isPayer
                  ? t('payments.payerYou')
                  : t('payments.payerOther', { name: apartment.payer?.name || t('members.unnamed') })}
              </Typography>
              <Button
                size="small"
                startIcon={<ReceiptLongOutlinedIcon fontSize="small" />}
                onClick={() => setLogFor({ apartmentId: apartment.apartmentId, number: apartment.number })}
                sx={{ textTransform: 'none' }}
              >
                {t('payments.apartmentLog')}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {t('payments.demoNote')}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
        {t('payments.history')}
      </Typography>
      {data.history.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('payments.noHistory')}
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />} sx={{ mt: 0.5 }}>
          {data.history.map((row) => (
            <Stack key={`${row.period}-${row.apartmentNumber}`} direction="row" sx={{ py: 0.75, alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {monthLabel(row.period)} · {t('members.apartment', { apartment: row.apartmentNumber })}
              </Typography>
              <Typography variant="body2" dir="ltr">
                {t('payments.fee', { amount: row.amount })}
              </Typography>
              <StatusChip charge={row} />
            </Stack>
          ))}
        </Stack>
      )}

      {logFor && (
        <PaymentsLogDialog
          title={t('payments.logTitleApartment', { apartment: logFor.number })}
          showApartment={false}
          load={() => api.payments.apartmentLog(idToken, buildingId, logFor.apartmentId)}
          onClose={() => setLogFor(null)}
        />
      )}
    </Box>
  );
}
