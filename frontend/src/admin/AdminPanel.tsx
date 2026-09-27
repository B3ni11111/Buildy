import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  createFilterOptions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { MembersList } from '../components/MembersCard';
import { useMembers } from '../hooks/useMembers';
import ContactLinksEditor from './ContactLinksEditor';
import MessagesCard from '../components/MessagesCard';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { AdminBuilding, City, ContactLink, CurrentUser, MessageType } from '../types/building';

const filterCities = createFilterOptions<City>({ limit: 50 });

interface AdminPanelProps {
  idToken: string;
  currentUser: CurrentUser;
  onCreateBuilding: () => void;
  onBack: () => void;
  /** Called after any building change so the rest of the app can refresh (e.g. the user's own building was edited or deleted). */
  onBuildingsChanged: () => void;
}

export default function AdminPanel({ idToken, currentUser, onCreateBuilding, onBack, onBuildingsChanged }: AdminPanelProps) {
  const { t, dir } = useLanguage();
  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;
  const [buildings, setBuildings] = useState<AdminBuilding[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [cities, setCities] = useState<City[]>([]);

  const [editing, setEditing] = useState<AdminBuilding | null>(null);
  const [deleting, setDeleting] = useState<AdminBuilding | null>(null);
  const [viewingMessages, setViewingMessages] = useState<AdminBuilding | null>(null);
  const [viewingMembers, setViewingMembers] = useState<AdminBuilding | null>(null);
  const [composeType, setComposeType] = useState<MessageType | null>(null);
  // Bumped to refetch the list (e.g. message counts after the messages dialog closes).
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

  const replaceBuilding = (updated: AdminBuilding) =>
    setBuildings((prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 5 }}>
      <Container maxWidth="md">
        <Button startIcon={<BackIcon />} onClick={onBack} sx={{ textTransform: 'none', mb: 2 }}>
          {t('admin.backToSettings')}
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
              {t('admin.title')}
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

        <Stack spacing={2}>
          {(buildings ?? []).map((building) => (
            <Card key={building.id} variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{building.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {building.address}, {building.city.name}
                    </Typography>
                    {building.contactLinks.length === 0 && (
                      <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                        {t('dashboard.noContacts')}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {t('admin.stats', {
                        members: building._count.members,
                        messages: building._count.messages,
                        docs: building._count.docs,
                      })}
                    </Typography>
                  </Box>
                  <Stack direction="row">
                    <Tooltip title={t('admin.members')}>
                      <IconButton onClick={() => setViewingMembers(building)}>
                        <GroupsOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.viewMessages')}>
                      <IconButton onClick={() => setViewingMessages(building)}>
                        <ForumOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('admin.editBuilding')}>
                      <IconButton onClick={() => setEditing(building)}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton onClick={() => setDeleting(building)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
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

      {viewingMembers && (
        <MembersDialog
          key={viewingMembers.id}
          building={viewingMembers}
          idToken={idToken}
          currentUser={currentUser}
          onClose={() => {
            setViewingMembers(null);
            setReloadKey((k) => k + 1);
            onBuildingsChanged();
          }}
        />
      )}

      <Dialog
        open={viewingMessages !== null}
        onClose={() => {
          setViewingMessages(null);
          setComposeType(null);
          setReloadKey((k) => k + 1);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, bgcolor: 'background.default' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {viewingMessages && t('admin.messagesDialogTitle', { name: viewingMessages.name })}
        </DialogTitle>
        <DialogContent>
          {viewingMessages && (
            <MessagesCard
              buildingId={viewingMessages.id}
              idToken={idToken}
              composeType={composeType}
              onComposeTypeChange={setComposeType}
              currentUser={currentUser}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function MembersDialog({
  building,
  idToken,
  currentUser,
  onClose,
}: {
  building: AdminBuilding;
  idToken: string;
  currentUser: CurrentUser;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { members, reload } = useMembers(idToken, building.id);
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t('admin.members')} · {building.name}
      </DialogTitle>
      <DialogContent>
        {members ? (
          <MembersList
            buildingId={building.id}
            idToken={idToken}
            currentUser={currentUser}
            members={members}
            onChanged={reload}
          />
        ) : (
          <CircularProgress size={24} />
        )}
      </DialogContent>
    </Dialog>
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
