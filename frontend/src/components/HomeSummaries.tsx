import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Box, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { useMonthLabel } from '../utils/payments';
import { Building, Doc, Issue, Member, MyPayments, PaymentsOverview } from '../types/building';
import StatusLabel from './StatusLabel';
import { STATUS_TONE } from './IssueDialog';
import SlideToPay from './SlideToPay';
import PaidCheck from './PaidCheck';
import UserAvatar from './UserAvatar';

/*
 * The home page's tiles: a glance at each section (one big number, a few rows, one or two actions).
 * The full lists and tools live on the section pages the tiles open.
 */

/** Loads data for a tile once; null while loading, 'error' when it failed. */
function useTileData<T>(load: () => Promise<T>, deps: unknown[]): T | null | 'error' {
  const [data, setData] = useState<T | null | 'error'>(null);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((value) => !cancelled && setData(value))
      .catch(() => !cancelled && setData('error'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}

function SummaryTile({
  title,
  onOpen,
  actions,
  children,
}: {
  title: string;
  onOpen: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Stack className="tile-header" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Button size="small" onClick={onOpen} sx={{ textTransform: 'none', fontWeight: 500, minWidth: 0, px: 1 }}>
            {t('summary.seeAll')}
          </Button>
        </Stack>
        {children}
        {actions && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 'auto', pt: 0.5 }}>
            {actions}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/** The tile's headline figure. */
function BigNumber({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
      >
        {children}
      </Typography>
      {caption && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function Row({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider', minWidth: 0 }}
    >
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </Typography>
      {end}
    </Stack>
  );
}

function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width="40%" sx={{ fontSize: '2.5rem' }} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="70%" />
    </Box>
  );
}

function Failed() {
  const { t } = useLanguage();
  return (
    <Typography variant="body2" color="text.secondary">
      {t('payments.error')}
    </Typography>
  );
}

const actionSx = { textTransform: 'none', fontWeight: 500 } as const;

export function IssuesSummary({
  buildingId,
  idToken,
  onOpen,
}: {
  buildingId: string;
  idToken: string;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const issues = useTileData(() => api.listIssues(idToken, buildingId), [idToken, buildingId]);
  const open = Array.isArray(issues) ? issues.filter((i) => i.status === 'opened' || i.status === 'in_process') : [];
  // Open ones first, newest first; then the latest closed ones fill the rows.
  const rows: Issue[] = Array.isArray(issues)
    ? [...open, ...issues.filter((i) => !open.includes(i))].slice(0, 3)
    : [];
  return (
    <SummaryTile
      title={t('nav.issues')}
      onOpen={onOpen}
    >
      {issues === null ? (
        <Loading />
      ) : issues === 'error' ? (
        <Failed />
      ) : (
        <>
          <BigNumber>{open.length ? t('summary.open', { count: open.length }) : t('summary.nothingOpen')}</BigNumber>
          <Box>
            {rows.map((issue) => (
              <Row
                key={issue.id}
                end={<StatusLabel tone={STATUS_TONE[issue.status]} label={t(`issues.status.${issue.status}`)} />}
              >
                {issue.title}
              </Row>
            ))}
          </Box>
        </>
      )}
    </SummaryTile>
  );
}

export function MoneySummary({ building, idToken, onOpen }: { building: Building; idToken: string; onOpen: () => void }) {
  const { t } = useLanguage();
  return (
    <SummaryTile
      title={t('nav.money')}
      onOpen={onOpen}
      actions={
        <Button variant="outlined" onClick={onOpen} sx={{ ...actionSx, borderColor: 'divider', color: 'text.primary' }}>
          {t('summary.details')}
        </Button>
      }
    >
      {building.canManage ? (
        <Budget buildingId={building.id} idToken={idToken} />
      ) : building.myApartments.length ? (
        <MyShare buildingId={building.id} idToken={idToken} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('payments.noApartments')}
        </Typography>
      )}
    </SummaryTile>
  );
}

/** Management: collected of goal this month, as a big figure and a bar. */
function Budget({ buildingId, idToken }: { buildingId: string; idToken: string }) {
  const { t } = useLanguage();
  const monthLabel = useMonthLabel();
  const data = useTileData<PaymentsOverview>(() => api.manage.payments.overview(idToken, buildingId), [idToken, buildingId]);
  const percent = data && data !== 'error' && data.goal > 0 ? Math.min(100, (data.collected / data.goal) * 100) : 0;
  // The bar grows from empty once the numbers are in.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);
  if (data === null) return <Loading />;
  if (data === 'error') return <Failed />;
  if (!data.opened) {
    return (
      <BigNumber caption={monthLabel(data.month)}>
        <Box component="span" sx={{ fontSize: '1.5rem' }}>
          {t('summary.notOpened')}
        </Box>
      </BigNumber>
    );
  }
  return (
    <Box>
      <BigNumber caption={t('summary.ofGoal', { goal: data.goal.toLocaleString(), month: monthLabel(data.month) })}>
        ₪{data.collected.toLocaleString()}
      </BigNumber>
      <Box
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={(theme) => ({ mt: 1.5, height: 8, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.1), overflow: 'hidden' })}
      >
        <Box
          sx={{
            height: '100%',
            width: `${shown}%`,
            borderRadius: 999,
            bgcolor: 'primary.main',
            transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        />
      </Box>
    </Box>
  );
}

/** A resident: this month's own part, payable right from the tile. */
function MyShare({ buildingId, idToken }: { buildingId: string; idToken: string }) {
  const { t } = useLanguage();
  const monthLabel = useMonthLabel();
  const loaded = useTileData<MyPayments>(() => api.payments.mine(idToken, buildingId), [idToken, buildingId]);
  const [data, setData] = useState<MyPayments | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const mine = data ?? (loaded === 'error' ? null : loaded);
  if (loaded === null) return <Loading />;
  if (!mine) return <Failed />;
  const charged = mine.apartments.filter((a) => a.payment);
  const due = charged.filter((a) => a.payment?.status === 'unpaid');
  const total = (due.length ? due : charged).reduce((sum, a) => sum + (a.payment?.amount ?? 0), 0);
  const payable = due.find((a) => a.isPayer);

  const pay = async (apartmentId: number) => {
    setData(await api.payments.pay(idToken, buildingId, apartmentId));
    setJustPaid(true);
    window.setTimeout(() => setJustPaid(false), 3500);
  };

  if (!charged.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('payments.notOpenedResident')}
      </Typography>
    );
  }
  return (
    <Box>
      <BigNumber caption={t('summary.yourPart', { month: monthLabel(mine.month) })}>₪{total.toLocaleString()}</BigNumber>
      <Box sx={{ mt: 1.5 }}>
        {justPaid ? (
          <PaidCheck label={t('payments.paidThanks')} />
        ) : payable?.payment ? (
          <SlideToPay
            label={t('payments.slideToPay', { amount: payable.payment.amount })}
            onConfirm={() => pay(payable.apartmentId)}
          />
        ) : !due.length ? (
          <StatusLabel tone="done" label={t('summary.allPaid')} />
        ) : null}
      </Box>
    </Box>
  );
}

export function DocsSummary({
  buildingId,
  idToken,
  onOpen,
}: {
  buildingId: string;
  idToken: string;
  onOpen: () => void;
}) {
  const { t, language } = useLanguage();
  const docs = useTileData<Doc[]>(() => api.listDocs(idToken, buildingId), [idToken, buildingId]);
  const recent = Array.isArray(docs) ? [...docs].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 3) : [];
  return (
    <SummaryTile
      title={t('nav.docs')}
      onOpen={onOpen}
    >
      {docs === null ? (
        <Loading />
      ) : docs === 'error' ? (
        <Failed />
      ) : !docs.length ? (
        <Typography variant="body2" color="text.secondary">
          {t('docs.empty')}
        </Typography>
      ) : (
        <Box>
          {recent.map((doc) => (
            <Row
              key={doc.id}
              end={
                <Typography variant="caption" color="text.secondary" sx={{ flex: 'none' }}>
                  {new Date(doc.uploadDate).toLocaleDateString(language, { day: 'numeric', month: 'short' })}
                </Typography>
              }
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, verticalAlign: '-3px', me: 1, color: 'text.secondary' }} />
              {doc.title}
            </Row>
          ))}
        </Box>
      )}
    </SummaryTile>
  );
}

export function PeopleSummary({ buildingId, idToken, onOpen }: { buildingId: string; idToken: string; onOpen: () => void }) {
  const { t } = useLanguage();
  const members = useTileData<Member[]>(() => api.listMembers(idToken, buildingId), [idToken, buildingId]);
  const list = Array.isArray(members) ? members : [];
  const managers = list.filter((m) => m.role !== 'resident');
  const shown = list.slice(0, 5);
  return (
    <SummaryTile title={t('nav.people')} onOpen={onOpen}>
      {members === null ? (
        <Loading />
      ) : members === 'error' ? (
        <Failed />
      ) : (
        <>
          <BigNumber
            caption={
              managers[0] ? t('summary.managedBy', { name: managers[0].name || t('members.unnamed') }) : undefined
            }
          >
            {t('summary.people', { count: list.length })}
          </BigNumber>
          <Stack direction="row" sx={{ alignItems: 'center' }}>
            {shown.map((member, index) => (
              <Box
                key={member.userId}
                sx={{ ms: index ? -1 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--mui-palette-background-paper)', lineHeight: 0 }}
              >
                <UserAvatar userId={member.userId} name={member.name} picture={member.picture} size={36} />
              </Box>
            ))}
            {list.length > shown.length && (
              <Avatar
                sx={{
                  ms: -1,
                  width: 36,
                  height: 36,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)',
                }}
              >
                +{list.length - shown.length}
              </Avatar>
            )}
          </Stack>
        </>
      )}
    </SummaryTile>
  );
}
