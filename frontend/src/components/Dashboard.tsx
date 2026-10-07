import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Responsive, useContainerWidth, type Layout, type ResponsiveLayouts } from 'react-grid-layout';
import { gridBounds, minMaxSize } from 'react-grid-layout/core';
import { GridBackground } from 'react-grid-layout/extras';
import 'react-grid-layout/css/styles.css';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import UserInfo from './UserInfo';
import MessagesCard from './MessagesCard';
import MyApartmentsCard from './MyApartmentsCard';
import MembersCard from './MembersCard';
import DocumentsCard from './DocumentsCard';
import AccountSetup from './AccountSetup';
import type { SettingsSection } from './Settings';
import { OnboardingData } from '../types/onboarding';
import { Building, ContactLink, ContactType, CurrentUser, MessageType } from '../types/building';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  BREAKPOINTS,
  COLS,
  MARGIN,
  noStrips,
  rowHeightFor,
  type TileId,
  getLayoutEditing,
  loadLayouts,
  resetLayouts,
  saveLayouts,
  setLayoutEditing,
  DEFAULT_LAYOUTS,
} from '../utils/homeLayout';

const CONTACT_ICON: Record<ContactType, typeof WhatsAppIcon> = {
  whatsapp: WhatsAppIcon,
  phone: PhoneOutlinedIcon,
  email: MailOutlinedIcon,
};

function contactHref({ type, link }: ContactLink) {
  if (type === 'phone') return `tel:${link.replace(/[^+\d]/g, '')}`;
  if (type === 'email') return link.startsWith('mailto:') ? link : `mailto:${link}`;
  return link;
}

/** Top-bar building picker: every building the user belongs to, plus "Join another building". */
function BuildingSwitcher({
  buildings,
  current,
  onSelect,
  onJoinAnother,
}: {
  buildings: Building[];
  current: Building;
  onSelect: (id: string) => void;
  onJoinAnother: () => void;
}) {
  const { t } = useLanguage();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        startIcon={<ApartmentOutlinedIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: 'text.primary',
          maxWidth: { xs: 180, sm: 320 },
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {current.name}
        </Box>
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 260 } } }}
      >
        {buildings.map((building) => (
          <MenuItem
            key={building.id}
            selected={building.id === current.id}
            onClick={() => {
              setAnchor(null);
              onSelect(building.id);
            }}
          >
            <ListItemIcon>{building.id === current.id ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
            <ListItemText primary={building.name} secondary={`${building.address}, ${building.city.name}`} />
            {building.myRole !== 'resident' && (
              <Chip size="small" label={t(`role.${building.myRole}`)} sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onJoinAnother();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('dashboard.joinAnother')} />
        </MenuItem>
      </Menu>
    </>
  );
}

/** Building management edits description, door code and join password (name/address stay admin-only). */
function BuildingDetailsDialog({
  building,
  idToken,
  onClose,
  onSaved,
}: {
  building: Building;
  idToken: string;
  onClose: () => void;
  onSaved: (building: Building) => void;
}) {
  const { t } = useLanguage();
  const [description, setDescription] = useState(building.description ?? '');
  const [entryCode, setEntryCode] = useState(building.entryCode ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = password === '' || password.length >= 4;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.manage.updateDetails(idToken, building.id, {
        description: description.trim() || null,
        entryCode: entryCode.trim() || null,
        ...(password ? { password } : {}),
      });
      onSaved(updated);
    } catch {
      setError(t('admin.saveError'));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('dashboard.editDetails')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
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
            error={!valid}
            helperText={!valid ? t('wizard.password.placeholder') : undefined}
          />
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
          onClick={save}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BuildingTile({ building, onEdit }: { building: Building; onEdit?: () => void }) {
  const { t } = useLanguage();
  return (
    <Card variant="outlined" sx={{ borderRadius: TILE_RADIUS }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('dashboard.building')}
          </Typography>
          {onEdit && (
            <Button size="small" startIcon={<EditOutlinedIcon />} onClick={onEdit} sx={{ textTransform: 'none' }}>
              {t('dashboard.editDetails')}
            </Button>
          )}
        </Stack>
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary">
            {building.address}, {building.city.name}
          </Typography>
          {building.description && <Typography variant="body2">{building.description}</Typography>}
          <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
            {building.entryCode && (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <VpnKeyOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {t('dashboard.entryCode')}: <strong dir="ltr">{building.entryCode}</strong>
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <PeopleOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2">{t('dashboard.memberCount', { count: building.memberCount })}</Typography>
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
            {t('dashboard.contacts')}
          </Typography>
          {building.contactLinks.length > 0 ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {building.contactLinks.map((contact) => {
                const Icon = CONTACT_ICON[contact.type];
                return (
                  <Chip
                    key={contact.id}
                    icon={<Icon />}
                    label={contact.type === 'whatsapp' ? t('contactType.whatsapp') : contact.link}
                    component="a"
                    href={contactHref(contact)}
                    target={contact.type === 'whatsapp' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    clickable
                    color="primary"
                    variant="outlined"
                    sx={{ direction: 'ltr' }}
                  />
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.noContacts')}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Tile corner radius in theme units — 25% smaller than the app's other cards (4). */
const TILE_RADIUS = 3;

interface DashboardProps {
  profile: OnboardingData;
  /** Every building the user belongs to; `building` is the one shown. */
  buildings: Building[];
  building: Building;
  idToken: string;
  onSelectBuilding: (id: string) => void;
  onJoinAnother: () => void;
  onOpenSettings: (section: SettingsSection) => void;
  /** Present only for real admins: drives the "viewing as a resident" banner. */
  adminView?: { viewAsResident: boolean; onToggle: () => void };
  onBuildingChange: (building: Building) => void;
  /** Refetch buildings (e.g. member count after management changes membership). */
  onBuildingRefresh: () => void;
  currentUser: CurrentUser | null;
  onCurrentUserChange: (user: CurrentUser) => void;
}

export default function Dashboard({
  profile,
  buildings,
  building,
  idToken,
  onSelectBuilding,
  onJoinAnother,
  onOpenSettings,
  adminView,
  onBuildingChange,
  onBuildingRefresh,
  currentUser,
  onCurrentUserChange,
}: DashboardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const firstName = profile.name.split(' ')[0];
  // Layouts are per user, on this device — keyed by the Cognito sub.
  const userKey = user?.sub ?? 'anonymous';

  // Dialogs the quick actions open, owned here so the cards stay in charge of their own content.
  const [composeType, setComposeType] = useState<MessageType | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);

  // Home grid: one layout per user for all buildings; editing is switched on in Settings.
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => loadLayouts(userKey));
  const [editing, setEditing] = useState(getLayoutEditing);
  const [breakpoint, setBreakpoint] = useState<string>('lg');
  const { width, containerRef, mounted } = useContainerWidth();
  const canEdit = editing && breakpoint !== 'sm';
  const theme = useTheme();
  // Cells are rectangles: row height follows the column width.
  const rowHeight = rowHeightFor(width);
  const tileRadiusPx = Number(theme.shape.borderRadius) * TILE_RADIUS;
  // The background grid only shows while a tile is being dragged or resized (like the AWS console).
  const [interacting, setInteracting] = useState(false);
  const currentLayout = layouts[breakpoint] ?? [];
  const gridRows = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0) + (interacting ? 2 : 0);
  const cols = COLS[breakpoint as keyof typeof COLS] ?? COLS.lg;

  const onLayoutChange = (_layout: Layout, all: ResponsiveLayouts) => {
    setLayouts(all);
    // Only remember changes the user made while editing (not breakpoint re-flows).
    if (canEdit) saveLayouts(userKey, all);
  };

  const stopEditing = () => {
    setLayoutEditing(false);
    setEditing(false);
  };

  const resetLayout = () => {
    resetLayouts(userKey);
    setLayouts(DEFAULT_LAYOUTS);
  };

  const quickActions = [
    {
      label: t('dashboard.reportIssue'),
      icon: BuildOutlinedIcon,
      onClick: () => setComposeType('maintenance'),
    },
    {
      label: t('dashboard.newMessage'),
      icon: CampaignOutlinedIcon,
      onClick: () => setComposeType('general'),
    },
    {
      label: t('dashboard.uploadDocument'),
      icon: FileUploadOutlinedIcon,
      onClick: () => setUploadOpen(true),
    },
    {
      label: t('dashboard.viewMembers'),
      icon: GroupsOutlinedIcon,
      onClick: () => setMembersOpen(true),
    },
  ];

  const tiles: Record<TileId, React.ReactNode> = useMemo(
    () => ({
      actions: (
        <Card variant="outlined" sx={{ borderRadius: TILE_RADIUS }}>
          <CardContent
            sx={{
              p: 2,
              '&:last-child': { pb: 2 },
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
              {quickActions.map(({ label, icon: Icon, onClick }) => (
                <Button
                  key={label}
                  variant="outlined"
                  startIcon={<Icon />}
                  onClick={onClick}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                    color: 'text.primary',
                    py: 1,
                    px: 2,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ),
      building: (
        <BuildingTile building={building} onEdit={building.canManage ? () => setEditingDetails(true) : undefined} />
      ),
      apartments: <MyApartmentsCard building={building} />,
      members: (
        <MembersCard
          key={building.id}
          buildingId={building.id}
          idToken={idToken}
          currentUser={currentUser}
          canManage={building.canManage}
          listOpen={membersOpen}
          onListOpenChange={setMembersOpen}
          onMembershipChanged={onBuildingRefresh}
        />
      ),
      messages: (
        <MessagesCard
          key={building.id}
          buildingId={building.id}
          idToken={idToken}
          composeType={composeType}
          onComposeTypeChange={setComposeType}
          currentUser={currentUser}
        />
      ),
      docs: (
        <DocumentsCard
          key={building.id}
          buildingId={building.id}
          idToken={idToken}
          currentUser={currentUser}
          uploadOpen={uploadOpen}
          onUploadOpenChange={setUploadOpen}
        />
      ),
    }),
    // quickActions only closes over stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [building, idToken, currentUser, membersOpen, composeType, uploadOpen, onBuildingRefresh, t],
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" sx={{ py: 1.25, alignItems: 'center', gap: 2, pr: 7 }}>
            <Typography
              sx={{
                fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                fontWeight: 600,
                fontSize: '1.25rem',
                color: 'primary.main',
              }}
            >
              buildy
            </Typography>
            <BuildingSwitcher
              buildings={buildings}
              current={building}
              onSelect={onSelectBuilding}
              onJoinAnother={onJoinAnother}
            />
          </Stack>
        </Container>
      </Box>

      <UserInfo
        currentUser={currentUser}
        onEditProfile={() => onOpenSettings('profile')}
        onOpenPreferences={() => onOpenSettings('preferences')}
      />

      <Container maxWidth="xl" sx={{ pt: 4, pb: 12 }}>
        {adminView?.viewAsResident && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Button color="inherit" size="small" onClick={adminView.onToggle} sx={{ textTransform: 'none' }}>
                {t('dashboard.switchBackToAdmin')}
              </Button>
            }
          >
            {t('dashboard.viewingAsResident')}
          </Alert>
        )}
        <AccountSetup
          key={building.id}
          building={building}
          currentUser={currentUser}
          idToken={idToken}
          onBuildingChange={onBuildingChange}
          onCurrentUserChange={onCurrentUserChange}
        />
        {canEdit && (
          <Alert
            severity="info"
            icon={<DragIndicatorIcon />}
            sx={{ mb: 2, borderRadius: 3 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={resetLayout} sx={{ textTransform: 'none' }}>
                  {t('layout.reset')}
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={stopEditing}
                  sx={{ textTransform: 'none' }}
                >
                  {t('layout.done')}
                </Button>
              </Stack>
            }
          >
            {t('layout.editingHint')}
          </Alert>
        )}

        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
              fontWeight: 600,
            }}
          >
            {t('dashboard.welcome', { name: firstName })}
          </Typography>
          <Typography color="text.secondary">
            {building.name} · {building.address}, {building.city.name}
          </Typography>
        </Stack>

        <Box
          ref={containerRef}
          sx={(theme) => ({
            position: 'relative',
            // Where the tile will land: filled cells with the same corners as the tiles.
            // Tiles glide to their new spot (RGL animates CSS transforms).
            '& .react-grid-item.react-grid-placeholder': {
              bgcolor: alpha(theme.palette.primary.main, 0.18),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.45)}`,
              borderRadius: `${tileRadiusPx}px`,
              opacity: 1,
              transition: 'transform 150ms ease, width 150ms ease, height 150ms ease',
            },
            '& .tile-body > .MuiCard-root.MuiCard-root': { borderRadius: `${tileRadiusPx}px` },
            '& .react-grid-item > .react-resizable-handle::after': {
              borderColor: theme.palette.text.secondary,
            },
            // Each tile's card fills the tile; long content scrolls inside it.
            '& .tile-body': {
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
            '& .tile-body > .MuiCard-root': {
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            },
            '& .tile-body > .MuiCard-root > .MuiCardContent-root': {
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
            },
            '& .tile-drag-handle': {
              opacity: 0,
              transition: 'opacity 0.15s ease',
            },
            '& .react-grid-item:hover .tile-drag-handle': { opacity: 1 },
          })}
        >
          {mounted && (
            <GridBackground
              width={width}
              cols={cols}
              rowHeight={rowHeight}
              margin={MARGIN}
              containerPadding={[0, 0]}
              rows={Math.max(gridRows, 1)}
              color={alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.05)}
              borderRadius={tileRadiusPx}
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                opacity: interacting ? 1 : 0,
                transition: 'opacity 200ms ease',
              }}
            />
          )}
          {mounted && (
            <Responsive
              width={width}
              layouts={layouts}
              breakpoints={BREAKPOINTS}
              cols={COLS}
              rowHeight={rowHeight}
              margin={MARGIN}
              containerPadding={[0, 0]}
              constraints={[gridBounds, minMaxSize, noStrips]}
              onDragStart={() => setInteracting(true)}
              onDragStop={() => setInteracting(false)}
              onResizeStart={() => setInteracting(true)}
              onResizeStop={() => setInteracting(false)}
              dragConfig={{
                enabled: canEdit,
                bounded: true,
                handle: '.tile-drag-handle',
              }}
              resizeConfig={{ enabled: canEdit, handles: ['se'] }}
              onBreakpointChange={(bp) => setBreakpoint(bp)}
              onLayoutChange={onLayoutChange}
            >
              {(Object.keys(tiles) as TileId[]).map((id) => (
                <Box key={id} sx={{ position: 'relative' }}>
                  {canEdit && (
                    <Box
                      className="tile-drag-handle"
                      aria-label={t('layout.dragHandle')}
                      sx={(theme) => ({
                        position: 'absolute',
                        top: 6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2,
                        cursor: 'grab',
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        display: 'flex',
                        '&:active': { cursor: 'grabbing' },
                      })}
                    >
                      <DragIndicatorIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
                    </Box>
                  )}
                  <Box
                    className="tile-body"
                    sx={
                      canEdit
                        ? {
                            outline: '1px dashed',
                            outlineColor: 'divider',
                            borderRadius: `${tileRadiusPx}px`,
                          }
                        : undefined
                    }
                  >
                    {tiles[id]}
                  </Box>
                </Box>
              ))}
            </Responsive>
          )}
        </Box>
      </Container>

      {editingDetails && (
        <BuildingDetailsDialog
          building={building}
          idToken={idToken}
          onClose={() => setEditingDetails(false)}
          onSaved={(updated) => {
            setEditingDetails(false);
            onBuildingChange(updated);
          }}
        />
      )}
    </Box>
  );
}
