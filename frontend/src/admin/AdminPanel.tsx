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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  createFilterOptions,
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
import MessagesCard from '../components/MessagesCard';
import DocumentsCard from '../components/DocumentsCard';
import { useMembers } from '../hooks/useMembers';
import ContactLinksEditor from './ContactLinksEditor';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { AdminBuilding, City, ContactLink, ContactType, CurrentUser, MessageType } from '../types/building';

const filterCities = createFilterOptions<City>({ limit: 50 });
const SELECTED_KEY = 'buildy_admin_building';
const TABS = ['overview', 'members', 'messages', 'docs'] as const;
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
}

/**
 * Admin console: pick a building on the side (search to jump), then manage it
 * in tabs — overview, members, messages, documents.
 */
export default function AdminPanel({ idToken, currentUser, onCreateBuilding, onBack, onBuildingsChanged }: AdminPanelProps) {
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
                    { Icon: ForumOutlinedIcon, value: building._count.messages },
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
              sx={{ fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif', fontWeight: 600 }}
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
                    <Tab
                      value="members"
                      label={`${t('admin.tabMembers')} (${selected._count.members})`}
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      value="messages"
                      label={`${t('admin.tabMessages')} (${selected._count.messages})`}
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
                {tab === 'overview' && <OverviewTab building={selected} onEdit={() => setEditing(selected)} />}
                {tab === 'members' && (
                  <MembersTab building={selected} idToken={idToken} currentUser={currentUser} onChanged={onBuildingsChanged} />
                )}
                {tab === 'messages' && (
                  <MessagesTab buildingId={selected.id} idToken={idToken} currentUser={currentUser} />
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
          cities={cities}
          idToken={idToken}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            replaceBuilding(updated);
            setEditing(null);
            onBuildingsChanged();
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

function OverviewTab({ building, onEdit }: { building: AdminBuilding; onEdit: () => void }) {
  const { t } = useLanguage();
  const stats = [
    { label: t('admin.tabMembers'), value: building._count.members },
    { label: t('admin.tabMessages'), value: building._count.messages },
    { label: t('admin.tabDocuments'), value: building._count.docs },
  ];
  return (
    <Stack spacing={2}>
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

function MessagesTab({ buildingId, idToken, currentUser }: { buildingId: string; idToken: string; currentUser: CurrentUser }) {
  const [composeType, setComposeType] = useState<MessageType | null>(null);
  return (
    <MessagesCard
      buildingId={buildingId}
      idToken={idToken}
      composeType={composeType}
      onComposeTypeChange={setComposeType}
      currentUser={currentUser}
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

function EditBuildingDialog({
  building,
  cities,
  idToken,
  onClose,
  onSaved,
  onContactLinksChange,
}: {
  building: AdminBuilding;
  cities: City[];
  idToken: string;
  onClose: () => void;
  onSaved: (updated: AdminBuilding) => void;
  /** Contact links save immediately (not on "Save"), so the list is reported separately. */
  onContactLinksChange: (links: ContactLink[]) => void;
}) {
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
      const updated = await api.admin.updateBuilding(idToken, building.id, {
        name: name.trim(),
        cityId: city.id,
        address: address.trim(),
        description: description.trim() || null,
        entryCode: entryCode.trim() || null,
        ...(password ? { password } : {}),
      });
      onSaved(updated);
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
          <TextField fullWidth label={t('admin.fieldName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Autocomplete
            options={cities.length ? cities : [building.city]}
            value={city}
            onChange={(_e, value) => setCity(value)}
            getOptionLabel={(c) => c.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={filterCities}
            renderInput={(params) => <TextField {...params} label={t('admin.fieldCity')} />}
          />
          <TextField
            fullWidth
            label={t('admin.fieldAddress')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
                const created = await api.admin.addContactLink(idToken, building.id, input);
                const next = [...contactLinks, created];
                setContactLinks(next);
                onContactLinksChange(next);
              }}
              onRemove={async (link) => {
                try {
                  await api.admin.removeContactLink(idToken, link.id);
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
