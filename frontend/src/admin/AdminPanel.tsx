import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import { MembersList } from '../components/MembersCard';
import IssuesCard from '../components/IssuesCard';
import DocumentsCard from '../components/DocumentsCard';
import { useMembers } from '../hooks/useMembers';
import EditBuildingDialog from '../components/EditBuildingDialog';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { AdminBuilding, BUILDING_ROLES, BuildingRole, City, ContactType, CurrentUser, PaymentsOverview } from '../types/building';
import { ManagerBudget } from '../components/PaymentsCard';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

const SELECTED_KEY = 'buildy_admin_building';
const TABS = ['overview', 'apartments', 'payments', 'members', 'issues', 'docs'] as const;
type ConsoleTab = (typeof TABS)[number];

const CONTACT_ICON: Record<ContactType, typeof WhatsAppIcon> = {
  whatsapp: WhatsAppIcon,
  phone: PhoneOutlinedIcon,
  email: MailOutlinedIcon,
};

function readSelected(): string | null {
  try {
    return localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

function matches(building: AdminBuilding, query: string) {
  const q = query.trim().toLowerCase();
  return !q || [building.name, building.address, building.city.name].some((s) => s.toLowerCase().includes(q));
}

interface AdminPanelProps {
  idToken: string;
  currentUser: CurrentUser;
  onCreateBuilding: () => void;
  onBack: () => void;
  /** Called after any building change so the rest of the app can refresh (e.g. the user's own building was edited or deleted). */
  onBuildingsChanged: () => void;
  /** Show this building in the app (the admin must be a member: the console joins first when needed). */
  onOpenBuilding: (id: string) => void;
}

/**
 * Admin console: pick a building on the side (search to jump), then manage it
 * in tabs — overview, members, messages, documents.
 */
export default function AdminPanel({ idToken, currentUser, onCreateBuilding, onBack, onBuildingsChanged, onOpenBuilding }: AdminPanelProps) {
  const { t, dir } = useLanguage();
  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;
  const [buildings, setBuildings] = useState<AdminBuilding[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(readSelected);
  const [tab, setTab] = useState<ConsoleTab>('overview');

  const [editing, setEditing] = useState<AdminBuilding | null>(null);
  const [deleting, setDeleting] = useState<AdminBuilding | null>(null);
  // Bumped to refetch the list, e.g. so counts stay current after work in a tab.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.admin
      .listBuildings(idToken)
      .then((list) => {
        if (!cancelled) setBuildings(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, reloadKey]);

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

  // Fall back to the first building when nothing (or a deleted one) is selected.
  const selected = useMemo(
    () => buildings?.find((b) => b.id === selectedId) ?? buildings?.[0] ?? null,
    [buildings, selectedId],
  );
  const filtered = (buildings ?? []).filter((b) => matches(b, query));

  const select = (id: string) => {
    setSelectedId(id);
    setReloadKey((k) => k + 1);
    try {
      localStorage.setItem(SELECTED_KEY, id);
    } catch {
      // not remembered — fine
    }
  };

  const changeTab = (next: ConsoleTab) => {
    setTab(next);
    setReloadKey((k) => k + 1);
  };

  const replaceBuilding = (updated: AdminBuilding) =>
    setBuildings((prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)));

  const buildingList = (
    <Card variant="outlined" sx={{ borderRadius: 4, position: { md: 'sticky' }, top: { md: 24 } }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('admin.searchBuildings')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) select(filtered[0].id);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <List dense disablePadding sx={{ maxHeight: { md: 'calc(100vh - 220px)' }, overflow: 'auto' }}>
        {filtered.map((building) => (
          <ListItemButton
            key={building.id}
            selected={building.id === selected?.id}
            onClick={() => select(building.id)}
            sx={{ py: 1.25 }}
          >
            <ListItemText
              primary={building.name}
              secondary={
                <Stack component="span" direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {building.city.name}
                  </Box>
                  {[
                    { Icon: PeopleOutlinedIcon, value: building._count.members },
                    { Icon: ForumOutlinedIcon, value: building._count.issues },
                    { Icon: DescriptionOutlinedIcon, value: building._count.docs },
                  ].map(({ Icon, value }, i) => (
                    <Stack key={i} component="span" direction="row" sx={{ alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 14 }} />
                      {value}
                    </Stack>
                  ))}
                </Stack>
              }
              slotProps={{ primary: { sx: { fontWeight: 500 }, noWrap: true } }}
            />
          </ListItemButton>
        ))}
        {buildings && filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            {t('admin.noMatches')}
          </Typography>
        )}
      </List>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, pb: 12 }}>
      <Container maxWidth="lg">
        <Button startIcon={<BackIcon />} onClick={onBack} sx={{ textTransform: 'none', mb: 2 }}>
          {t('admin.backToApp')}
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 2, mb: 3 }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontFamily: '"Rubik", system-ui, sans-serif', fontWeight: 600 }}
            >
              {t('admin.consoleTitle')}
            </Typography>
            <Typography color="text.secondary">{t('admin.subtitle')}</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateBuilding}
            sx={{ textTransform: 'none', fontWeight: 600, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
          >
            {t('admin.newBuilding')}
          </Button>
        </Stack>

        {loadError && <Alert severity="error">{t('admin.saveError')}</Alert>}
        {!buildings && !loadError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {buildings && buildings.length === 0 && <Typography color="text.secondary">{t('admin.noBuildings')}</Typography>}

        {buildings && selected && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
            {/* Phones: a search-as-you-type picker. Desktop: the sticky list. */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, width: '100%' }}>
              <Autocomplete
                options={buildings}
                value={selected}
                onChange={(_e, value) => value && select(value.id)}
                getOptionLabel={(b) => `${b.name} — ${b.city.name}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                disableClearable
                renderInput={(params) => <TextField {...params} label={t('admin.selectBuilding')} />}
              />
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, flexShrink: 0 }}>{buildingList}</Box>

            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              <Card variant="outlined" sx={{ borderRadius: 4, mb: 2 }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 1 } }}>
                  <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
                        {selected.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selected.address}, {selected.city.name}
                      </Typography>
                    </Box>
                    <OpenBuildingButton
                      joined={!!selected.joined}
                      onOpen={() => onOpenBuilding(selected.id)}
                      onJoinAndOpen={async (role) => {
                        await api.admin.joinBuilding(idToken, selected.id, role);
                        onOpenBuilding(selected.id);
                      }}
                    />
                    <Button
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => setEditing(selected)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('admin.editBuilding')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => setDeleting(selected)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('common.delete')}
                    </Button>
                  </Stack>
                  <Tabs
                    value={tab}
                    onChange={(_e, value: ConsoleTab) => changeTab(value)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ mt: 1 }}
                  >
                    <Tab value="overview" label={t('admin.tabOverview')} sx={{ textTransform: 'none' }} />
                    <Tab value="apartments" label={t('admin.tabApartments')} sx={{ textTransform: 'none' }} />
                    <Tab value="payments" label={t('widgets.tile.payments')} sx={{ textTransform: 'none' }} />
                    <Tab
                      value="members"
                      label={`${t('admin.tabMembers')} (${selected._count.members})`}
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      value="issues"
                      label={`${t('admin.tabIssues')} (${selected._count.issues})`}
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      value="docs"
                      label={`${t('admin.tabDocuments')} (${selected._count.docs})`}
                      sx={{ textTransform: 'none' }}
                    />
                  </Tabs>
                </CardContent>
              </Card>

              {/* key= remounts tab content per building, so each fetches its own data. */}
              <Box key={`${selected.id}-${tab}`}>
                {tab === 'overview' && (
                  <OverviewTab
                    building={selected}
                    onEdit={() => setEditing(selected)}
                    onJoin={async (role) => {
                      await api.admin.joinBuilding(idToken, selected.id, role);
                      setReloadKey((k) => k + 1);
                      onBuildingsChanged();
                    }}
                  />
                )}
                {tab === 'apartments' && <ApartmentsTab buildingId={selected.id} idToken={idToken} />}
                {tab === 'payments' && (
                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <ManagerBudget buildingId={selected.id} idToken={idToken} />
                    </CardContent>
                  </Card>
                )}
                {tab === 'members' && (
                  <MembersTab building={selected} idToken={idToken} currentUser={currentUser} onChanged={onBuildingsChanged} />
                )}
                {tab === 'issues' && (
                  <IssuesTab buildingId={selected.id} idToken={idToken} currentUser={currentUser} />
                )}
                {tab === 'docs' && <DocsTab buildingId={selected.id} idToken={idToken} currentUser={currentUser} />}
              </Box>
            </Box>
          </Stack>
        )}
      </Container>

      {editing && (
        <EditBuildingDialog
          key={editing.id}
          building={editing}
          canEditIdentity
          cities={cities}
          onClose={() => setEditing(null)}
          onSave={async (fields) => {
            const updated = await api.admin.updateBuilding(idToken, editing.id, {
              name: fields.name!,
              cityId: fields.cityId!,
              address: fields.address!,
              description: fields.description,
              entryCode: fields.entryCode,
            });
            replaceBuilding(updated);
            setEditing(null);
            onBuildingsChanged();
          }}
          onAddLink={(input) => api.admin.addContactLink(idToken, editing.id, input)}
          onRemoveLink={async (link) => {
            await api.admin.removeContactLink(idToken, link.id);
          }}
          onContactLinksChange={(contactLinks) => {
            replaceBuilding({ ...editing, contactLinks });
            onBuildingsChanged();
          }}
        />
      )}

      {deleting && (
        <DeleteBuildingDialog
          key={deleting.id}
          building={deleting}
          idToken={idToken}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setBuildings((prev) => (prev ?? []).filter((b) => b.id !== deleting.id));
            setDeleting(null);
            onBuildingsChanged();
          }}
        />
      )}
    </Box>
  );
}

/** "Open building": switch the app to it. Not a member yet: pick a role, join, then open. */
function OpenBuildingButton({
  joined,
  onOpen,
  onJoinAndOpen,
}: {
  joined: boolean;
  onOpen: () => void;
  onJoinAndOpen: (role: BuildingRole) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        size="small"
        variant="contained"
        startIcon={<OpenInNewIcon />}
        disabled={busy}
        onClick={(e) => (joined ? onOpen() : setAnchor(e.currentTarget))}
        sx={{ textTransform: 'none' }}
      >
        {t('admin.openBuilding')}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 0.5, maxWidth: 260 }}>
          {t('admin.openJoinFirst')}
        </Typography>
        {BUILDING_ROLES.map((role) => (
          <MenuItem
            key={role}
            onClick={async () => {
              setAnchor(null);
              setBusy(true);
              try {
                await onJoinAndOpen(role);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('admin.joinAs', { role: t(`role.${role}`) })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Every apartment at a glance: floor, size, residents (owner/renter), who pays, fee, method and this month's state. */
function ApartmentsTab({ buildingId, idToken }: { buildingId: string; idToken: string }) {
  const { t } = useLanguage();
  const [data, setData] = useState<PaymentsOverview | null>(null);
  const [error, setError] = useState(false);
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

  if (error) return <Alert severity="error">{t('admin.saveError')}</Alert>;
  if (!data) return <CircularProgress size={24} />;
  if (data.apartments.length === 0) return <Typography color="text.secondary">{t('admin.apartmentsEmpty')}</Typography>;

  return (
    <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 4 }}>
      <Table size="small" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t('payments.filterApartment')}</TableCell>
            <TableCell>{t('myUnit.floor')}</TableCell>
            <TableCell>{t('myUnit.sqrm')}</TableCell>
            <TableCell>{t('members.residents')}</TableCell>
            <TableCell>{t('payments.whoPays')}</TableCell>
            <TableCell>{t('payments.colAmount')}</TableCell>
            <TableCell>{t('payments.method')}</TableCell>
            <TableCell>{t('payments.colStatus')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.apartments.map((a) => (
            <TableRow key={a.apartmentId}>
              <TableCell sx={{ fontWeight: 600 }}>{a.number}</TableCell>
              <TableCell>{a.floor ?? '—'}</TableCell>
              <TableCell>{a.sqrm ?? '—'}</TableCell>
              <TableCell>
                {a.residents.length
                  ? a.residents.map((r) => `${r.name || t('members.unnamed')} (${t(`relationType.${r.relationType}`)})`).join(', ')
                  : t('payments.noResidents')}
              </TableCell>
              <TableCell>{a.payer ? a.payer.name || t('members.unnamed') : '—'}</TableCell>
              <TableCell dir="ltr" sx={{ textAlign: 'start' }}>
                ₪{a.payment?.amount ?? a.fee}
              </TableCell>
              <TableCell>{t(`paymentMethod.${a.method}`)}</TableCell>
              <TableCell>{a.payment ? (a.payment.status === 'paid' ? t('payments.paid') : t('payments.unpaid')) : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Join the building as a member (with a chosen role), so it shows in the admin's own building switcher. */
function JoinBuilding({ joined, onJoin }: { joined: boolean; onJoin: (role: BuildingRole) => Promise<void> }) {
  const { t } = useLanguage();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (joined) {
    return <Chip icon={<CheckCircleOutlinedIcon />} label={t('admin.joined')} color="success" variant="outlined" sx={{ alignSelf: 'flex-start' }} />;
  }
  return (
    <Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LoginOutlinedIcon />}
        disabled={busy}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ textTransform: 'none' }}
      >
        {t('admin.join')}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {t('admin.joinHint')}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {t('admin.saveError')}
        </Alert>
      )}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {BUILDING_ROLES.map((role) => (
          <MenuItem
            key={role}
            onClick={async () => {
              setAnchor(null);
              setBusy(true);
              setError(false);
              try {
                await onJoin(role);
              } catch {
                setError(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('admin.joinAs', { role: t(`role.${role}`) })}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

function OverviewTab({
  building,
  onEdit,
  onJoin,
}: {
  building: AdminBuilding;
  onEdit: () => void;
  onJoin: (role: BuildingRole) => Promise<void>;
}) {
  const { t } = useLanguage();
  const stats = [
    { label: t('admin.tabMembers'), value: building._count.members },
    { label: t('admin.tabIssues'), value: building._count.issues },
    { label: t('admin.tabDocuments'), value: building._count.docs },
  ];
  return (
    <Stack spacing={2}>
      <JoinBuilding joined={!!building.joined} onJoin={onJoin} />
      <Stack direction="row" spacing={2}>
        {stats.map(({ label, value }) => (
          <Card key={label} variant="outlined" sx={{ borderRadius: 4, flex: 1 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            {building.description && <Typography variant="body2">{building.description}</Typography>}
            {building.entryCode && (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <VpnKeyOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {t('dashboard.entryCode')}: <strong dir="ltr">{building.entryCode}</strong>
                </Typography>
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary">
              {t('admin.contactsTitle')}
            </Typography>
            {building.contactLinks.length > 0 ? (
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                {building.contactLinks.map((contact) => {
                  const Icon = CONTACT_ICON[contact.type];
                  return (
                    <Chip key={contact.id} icon={<Icon />} label={contact.link} variant="outlined" sx={{ direction: 'ltr' }} />
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="warning.main">
                {t('dashboard.noContacts')}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={onEdit}
              sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
            >
              {t('admin.editBuilding')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function MembersTab({
  building,
  idToken,
  currentUser,
  onChanged,
}: {
  building: AdminBuilding;
  idToken: string;
  currentUser: CurrentUser;
  onChanged: () => void;
}) {
  const { members, reload } = useMembers(idToken, building.id);
  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: 2.5 }}>
        {members ? (
          <MembersList
            buildingId={building.id}
            idToken={idToken}
            currentUser={currentUser}
            // The console is admin-only, so admins always manage here.
            canManage
            members={members}
            onChanged={() => {
              reload();
              onChanged();
            }}
          />
        ) : (
          <CircularProgress size={24} />
        )}
      </CardContent>
    </Card>
  );
}

function IssuesTab({ buildingId, idToken, currentUser }: { buildingId: string; idToken: string; currentUser: CurrentUser }) {
  const [composeOpen, setComposeOpen] = useState(false);
  return (
    <IssuesCard
      buildingId={buildingId}
      idToken={idToken}
      composeOpen={composeOpen}
      onComposeOpenChange={setComposeOpen}
      currentUser={currentUser}
      // Admins can change statuses everywhere.
      canManage
    />
  );
}

function DocsTab({ buildingId, idToken, currentUser }: { buildingId: string; idToken: string; currentUser: CurrentUser }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  return (
    <DocumentsCard
      buildingId={buildingId}
      idToken={idToken}
      currentUser={currentUser}
      uploadOpen={uploadOpen}
      onUploadOpenChange={setUploadOpen}
    />
  );
}

function DeleteBuildingDialog({
  building,
  idToken,
  onClose,
  onDeleted,
}: {
  building: AdminBuilding;
  idToken: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.admin.deleteBuilding(idToken, building.id);
      onDeleted();
    } catch {
      setError(t('admin.saveError'));
      setDeleting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('admin.deleteTitle', { name: building.name })}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{t('admin.deleteBody')}</DialogContentText>
        <DialogContentText sx={{ mb: 1.5, fontWeight: 500 }}>{t('admin.deleteConfirmInstruction')}</DialogContentText>
        <TextField
          autoFocus
          fullWidth
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={building.name}
        />
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
        <Button
          variant="contained"
          color="error"
          disabled={confirmText.trim() !== building.name || deleting}
          onClick={handleDelete}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
