import { useEffect, useMemo, useRef, useState } from 'react';
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
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useContainerWidth, type LayoutItem, type ResponsiveLayouts } from 'react-grid-layout';
import HomeGrid, { type GridItem } from './HomeGrid';
import { tileVars } from '../theme';
import DoorCode from './DoorCode';
import { SectionBar, SectionTabs, useSection, type Section } from './SectionNav';
import { DocsSummary, IssuesSummary, MoneySummary, PeopleSummary } from './HomeSummaries';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import FeedbackDialog from './FeedbackDialog';
import WidgetsDrawer from './WidgetsDrawer';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import UserInfo from './UserInfo';
import IssuesCard from './IssuesCard';
import MyApartmentsCard from './MyApartmentsCard';
import MembersCard from './MembersCard';
import DocumentsCard from './DocumentsCard';
import PaymentsCard from './PaymentsCard';
import EditBuildingDialog from './EditBuildingDialog';
import type { SettingsSection } from './Settings';
import type { InfoPageKind } from './InfoPage';
import { OnboardingData } from '../types/onboarding';
import { Building, BuildingRole, City, ContactLink, ContactType, CurrentUser } from '../types/building';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  BREAKPOINTS,
  COLS,
  MARGIN,
  rowHeightFor,
  type TileId,
  getLayoutEditing,
  setLayoutEditing,
  closeEmptyRows,
  fitWithin,
  loadHiddenTiles,
  minShape,
  maxRowsFor,
  rowsUsed,
  loadLayouts,
  resetLayouts,
  saveHiddenTiles,
  saveLayouts,
  TILE_IDS,
  DEFAULT_LAYOUTS,
  mirrorLayouts,
  presetLayout,
  type LayoutPreset,
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

/** Top-bar building picker: every building the user belongs to, plus "Create a building". */
function BuildingSwitcher({
  buildings,
  current,
  onSelect,
  onCreateBuilding,
}: {
  buildings: Building[];
  current: Building;
  onSelect: (id: string) => void;
  onCreateBuilding: () => void;
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
            onCreateBuilding();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('dashboard.createBuilding')} />
        </MenuItem>
      </Menu>
    </>
  );
}

function BuildingTile({ building, onEdit }: { building: Building; onEdit?: () => void }) {
  const { t } = useLanguage();
  return (
    <Card variant="outlined" sx={{ borderRadius: `${TILE_RADIUS_PX}px` }}>
      <CardContent sx={{ p: 3 }}>
        <Stack className="tile-header" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
          {building.entryCode && (
            <Box sx={{ py: 0.5 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.5 }}>
                <VpnKeyOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.entryCode')}
                </Typography>
              </Stack>
              <DoorCode code={building.entryCode} />
            </Box>
          )}
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
                    sx={{ direction: 'ltr', maxWidth: '100%' }}
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

/** Home tile corner radius (px): soft tiles, like a phone home screen. */
const TILE_RADIUS_PX = 24;

type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

function dayPartAt(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/** The part of the day right now, checked every few minutes so a long-open tab moves on with the sun. */
function useDayPart(): DayPart {
  const [part, setPart] = useState(() => dayPartAt(new Date().getHours()));
  useEffect(() => {
    const id = window.setInterval(() => setPart(dayPartAt(new Date().getHours())), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  return part;
}

/** Where the greeting's light sits and its colour, per part of the day and colour mode. */
const DAY_LIGHT: Record<DayPart, { left: string; light: string; dark: string }> = {
  morning: { left: '55%', light: 'rgba(246, 214, 140, 0.45)', dark: 'rgba(240, 206, 134, 0.14)' },
  afternoon: { left: '35%', light: 'rgba(190, 220, 190, 0.40)', dark: 'rgba(157, 203, 159, 0.12)' },
  evening: { left: '15%', light: 'rgba(240, 170, 110, 0.34)', dark: 'rgba(240, 170, 110, 0.14)' },
  night: { left: '0%', light: 'rgba(160, 175, 210, 0.28)', dark: 'rgba(240, 206, 134, 0.10)' },
};

interface DashboardProps {
  profile: OnboardingData;
  /** Every building the user belongs to; `building` is the one shown. */
  buildings: Building[];
  building: Building;
  idToken: string;
  onSelectBuilding: (id: string) => void;
  onCreateBuilding: () => void;
  onOpenSettings: (section: SettingsSection) => void;
  /** The footer's links, for the account menu on phones. */
  footerLinks: { onFeedback: () => void; onOpenPage: (kind: InfoPageKind) => void };
  /** Present only for real admins: drives the "viewing as a resident" banner. */
  adminView?: { viewAs: BuildingRole | null; onExit: () => void };
  onBuildingChange: (building: Building) => void;
  /** Refetch buildings (e.g. member count after management changes membership). */
  onBuildingRefresh: () => void;
  currentUser: CurrentUser | null;
}

export default function Dashboard({
  profile,
  buildings,
  building,
  idToken,
  onSelectBuilding,
  onCreateBuilding,
  onOpenSettings,
  footerLinks,
  adminView,
  onBuildingChange,
  onBuildingRefresh,
  currentUser,
}: DashboardProps) {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const firstName = profile.name.split(' ')[0];
  const dayPart = useDayPart();
  const [section, goTo] = useSection();
  // Coming back home from a section page refreshes the tiles' summaries.
  const [homeVisit, setHomeVisit] = useState(0);
  const lastSection = useRef(section);
  useEffect(() => {
    if (section === 'home' && lastSection.current !== 'home') setHomeVisit((v) => v + 1);
    lastSection.current = section;
  }, [section]);
  // Layouts are per user, on this device — keyed by the Cognito sub.
  const userKey = user?.sub ?? 'anonymous';

  // Dialogs the quick actions open, owned here so the cards stay in charge of their own content.
  const [composeOpen, setComposeOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [paymentsVersion, setPaymentsVersion] = useState(0);
  const [editingDetails, setEditingDetails] = useState(false);
  // Admins (not previewing a role) edit the building's name, city and address too.
  const isAdmin = !!currentUser?.isAdmin;
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (!editingDetails || !isAdmin || cities.length) return;
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
  }, [editingDetails, isAdmin, cities.length, idToken]);

  // Home grid: one layout per user for all buildings; editing is switched on in Settings.
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => loadLayouts(userKey));
  const [editing, setEditing] = useState(getLayoutEditing);
  // Widgets this user removed from their home page, and the menu / dialog for adding them back.
  const [hidden, setHidden] = useState<TileId[]>(() => loadHiddenTiles(userKey));
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The widget being dragged from the drawer (state for rendering, ref for the grid's drop callbacks).
  const [dragging, setDragging] = useState<TileId | null>(null);
  const draggingRef = useRef<TileId | null>(null);
  const [widgetFeedback, setWidgetFeedback] = useState(false);
  // "Reset layout" and a tile's ✕ ask first.
  const [confirm, setConfirm] = useState<
    { kind: 'reset' } | { kind: 'remove'; id: TileId } | { kind: 'preset'; preset: LayoutPreset } | null
  >(null);
  // The Reset / Done bar only shows once the user has actually moved or resized a tile.
  const { width, containerRef, mounted } = useContainerWidth();
  const breakpoint = width >= BREAKPOINTS.lg ? 'lg' : width >= BREAKPOINTS.md ? 'md' : 'sm';
  const canEdit = editing && breakpoint !== 'sm';
  const theme = useTheme();
  // Cells are rectangles: row height follows the column width.
  const rowHeight = rowHeightFor(width);
  const tileRadiusPx = TILE_RADIUS_PX;
  const scrollInset = Math.ceil(tileRadiusPx - Math.sqrt(4 * tileRadiusPx - 4));
  // The background grid only shows while a tile is being dragged or resized (like the AWS console).
  const currentLayout = (layouts[breakpoint] ?? []).filter((item) => !hidden.includes(item.i as TileId));
  // Empty background rows: just the rows in use, plus two spare ones while a tile is being moved (not
  // while resizing) — and never past the page-length limit, so there's no endless grid.
  const usedRows = rowsUsed(currentLayout);
  const rowLimit = maxRowsFor(breakpoint);
  const gridRows = Math.min(usedRows + 2, rowLimit ?? usedRows + 2);
  const cols = COLS[breakpoint as keyof typeof COLS] ?? COLS.lg;

  // The grid is LTR-only: RTL shows a mirrored copy; `layouts` itself always stays LTR.
  const rtl = dir === 'rtl';
  const shownItems = useMemo(() => {
    const visible = (layouts[breakpoint] ?? []).filter((item) => !hidden.includes(item.i as TileId));
    return (rtl ? (mirrorLayouts({ [breakpoint]: visible })[breakpoint] ?? []) : visible) as GridItem[];
  }, [layouts, breakpoint, rtl, hidden]);

  /** The user moved or resized tiles: store the new positions (back in LTR form), page-length rule included. */
  const commitItems = (changed: GridItem[]) => {
    const unmirrored = rtl
      ? ((mirrorLayouts({ [breakpoint]: changed as LayoutItem[] })[breakpoint] ?? []) as GridItem[])
      : changed;
    const stored = layouts[breakpoint] ?? [];
    const merged = stored.map((old) => {
      const next = unmirrored.find((item) => item.i === old.i);
      return next ? { ...old, x: next.x, y: next.y, w: next.w, h: next.h } : old;
    });
    const all: ResponsiveLayouts = { ...layouts, [breakpoint]: merged };
    setLayouts(all);
    if (canEdit) saveLayouts(userKey, all);
  };

  const changeHidden = (next: TileId[]) => {
    setHidden(next);
    saveHiddenTiles(userKey, next);
    // Removing a widget must not leave an empty row behind: close the gap in every screen size.
    setLayouts((current) => {
      const tidy: ResponsiveLayouts = { ...current };
      for (const bp of ['lg', 'md']) {
        const items = current[bp] ?? [];
        const visible = closeEmptyRows(items.filter((item) => !next.includes(item.i as TileId)));
        tidy[bp] = items.map((item) => visible.find((v) => v.i === item.i) ?? item);
      }
      saveLayouts(userKey, tidy);
      return tidy;
    });
  };

  /** Puts a removed widget back — at the drop spot (grid coordinates as shown) when it was dragged in. */
  const addTile = (id: TileId, drop?: { x: number; y: number }) => {
    const base = layouts[breakpoint] ?? [];
    const stored = base.find((item) => item.i === id);
    let moved = base;
    if (drop) {
      const w = Math.min(stored?.w ?? 1, cols);
      const shownX = Math.max(0, Math.min(drop.x, cols - w));
      const x = rtl ? cols - shownX - w : shownX;
      moved = base.map((item) => (item.i === id ? { ...item, x, y: drop.y } : item));
    }
    // Same page-length rule as moving a tile: rearrange the others into free space, or refuse.
    const limit = maxRowsFor(breakpoint);
    if (limit) {
      const shownNow = moved.filter((item) => !hidden.includes(item.i as TileId) || item.i === id);
      const fitted = fitWithin(shownNow, cols, limit, drop ? id : null);
      if (!fitted) return;
      moved = moved.map((item) => fitted.find((f) => f.i === item.i) ?? item);
    }
    // Never leave a fully empty row between widgets (e.g. a widget dropped far below the others).
    const closed = closeEmptyRows(moved.filter((item) => !hidden.includes(item.i as TileId) || item.i === id));
    moved = moved.map((item) => closed.find((c) => c.i === item.i) ?? item);
    if (moved !== base || closed.length) {
      const next: ResponsiveLayouts = { ...layouts, [breakpoint]: moved };
      setLayouts(next);
      saveLayouts(userKey, next);
    }
    changeHidden(hidden.filter((h) => h !== id));
  };

  // Size of the widget being dragged in (its saved size on this screen size, else the default).
  const draggedItem = dragging
    ? (layouts[breakpoint] ?? []).find((item) => item.i === dragging) ?? (DEFAULT_LAYOUTS[breakpoint] ?? []).find((item) => item.i === dragging)
    : undefined;
  const dragSize = { w: Math.min(draggedItem?.w ?? 1, cols), h: draggedItem?.h ?? 2 };

  const resetLayout = () => {
    resetLayouts(userKey);
    changeHidden([]);
    setLayouts(DEFAULT_LAYOUTS);
  };

  /** Swaps in a ready-made layout from the widgets menu: its tiles, positions and hidden widgets. */
  const applyPreset = (preset: LayoutPreset) => {
    const next = presetLayout(preset);
    setLayouts(next.layouts);
    saveLayouts(userKey, next.layouts);
    setHidden(next.hidden);
    saveHiddenTiles(userKey, next.hidden);
  };

  /** Header actions: they open the section's page with its form already up. */
  const reportIssue = () => {
    goTo('issues');
    setComposeOpen(true);
  };
  const uploadDocument = () => {
    goTo('docs');
    setUploadOpen(true);
  };

  const tiles: Record<TileId, React.ReactNode> = useMemo(
    () => ({
      building: (
        <BuildingTile building={building} onEdit={building.canManage ? () => setEditingDetails(true) : undefined} />
      ),
      apartments: (
        <MyApartmentsCard
          buildings={buildings}
          currentBuildingId={building.id}
          idToken={idToken}
          onPaymentsChanged={() => setPaymentsVersion((v) => v + 1)}
        />
      ),
      // The section tiles are summaries; their full cards live on the section pages below.
      members: <PeopleSummary key={`${building.id}-${homeVisit}`} buildingId={building.id} idToken={idToken} onOpen={() => goTo('people')} />,
      issues: (
        <IssuesSummary
          key={`${building.id}-${homeVisit}`}
          buildingId={building.id}
          idToken={idToken}
          onOpen={() => goTo('issues')}
        />
      ),
      docs: (
        <DocsSummary
          key={`${building.id}-${homeVisit}`}
          buildingId={building.id}
          idToken={idToken}
          onOpen={() => goTo('docs')}
        />
      ),
      payments: (
        <MoneySummary key={`${building.id}-${paymentsVersion}-${homeVisit}`} building={building} idToken={idToken} onOpen={() => goTo('money')} />
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [building, buildings, idToken, paymentsVersion, homeVisit, t],
  );

  /** Each section's own page: the full card, in the section's colour. */
  const pages: Record<Exclude<Section, 'home'>, { tile: TileId; content: React.ReactNode }> = {
    issues: {
      tile: 'issues',
      content: (
        <IssuesCard
          key={building.id}
          buildingId={building.id}
          idToken={idToken}
          composeOpen={composeOpen}
          onComposeOpenChange={setComposeOpen}
          currentUser={currentUser}
          canManage={building.canManage}
        />
      ),
    },
    money: {
      tile: 'payments',
      // Remounted (refetched) when payment data changes elsewhere, e.g. an owner picks who pays.
      content: (
        <>
          <PaymentsCard key={`${building.id}-${paymentsVersion}`} building={building} idToken={idToken} />
          {building.myApartments.length > 0 && (
            <MyApartmentsCard
              buildings={buildings}
              currentBuildingId={building.id}
              idToken={idToken}
              onPaymentsChanged={() => setPaymentsVersion((v) => v + 1)}
            />
          )}
        </>
      ),
    },
    docs: {
      tile: 'docs',
      content: (
        <DocumentsCard
          key={building.id}
          buildingId={building.id}
          idToken={idToken}
          currentUser={currentUser}
          uploadOpen={uploadOpen}
          onUploadOpenChange={setUploadOpen}
        />
      ),
    },
    people: {
      tile: 'members',
      content: (
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
    },
  };

  // Each tile with its remove button and drag handle. Built once per change so that idle tiles never
  // re-render while another one is dragged.
  const tileNodes = useMemo(() => {
    const nodes: Record<string, React.ReactNode> = {};
    for (const id of TILE_IDS) {
      if (hidden.includes(id)) continue;
      nodes[id] = (
        <Box sx={{ position: 'relative', height: '100%' }}>
          {editing && (
            <IconButton
              className="tile-remove"
              size="small"
              aria-label={t('widgets.remove')}
              onClick={() => setConfirm({ kind: 'remove', id })}
              sx={(theme) => ({
                position: 'absolute',
                top: 14,
                right: 20,
                zIndex: 3,
                width: 18,
                height: 18,
                p: 0,
                color: alpha(theme.palette.text.secondary, 0.7),
                bgcolor: 'transparent',
                '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.14), color: 'text.primary', transform: 'none' },
              })}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
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
                touchAction: 'none',
                userSelect: 'none',
                px: 1.5,
                py: 0.25,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                display: 'flex',
              })}
            >
              <DragIndicatorIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
            </Box>
          )}
          <Box
            className="tile-body"
            dir={dir}
            sx={{
              // Each section fills its tile with its own colour (see TileSection in theme.ts).
              ...tileVars(theme.palette.mode, id),
              ...(canEdit && {
                borderRadius: `${tileRadiusPx}px`,
                outline: '1px dashed transparent',
                '.home-grid-item:hover > div > &': { outlineColor: alpha(theme.palette.text.primary, 0.25) },
              }),
            }}
          >
            {tiles[id]}
          </Box>
        </Box>
      );
    }
    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, hidden, editing, canEdit, dir, tileRadiusPx, t, theme]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="xl">
          {/* Brand and building on one side, the sections in the middle, the account on the other. */}
          <Box sx={{ py: 1.25, display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' }, alignItems: 'center', gap: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: '"Rubik", system-ui, sans-serif',
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
                onCreateBuilding={onCreateBuilding}
              />
            </Stack>
            <SectionTabs section={section} onChange={goTo} />
            <Box sx={{ justifySelf: 'end' }}>
              <UserInfo
                currentUser={currentUser}
                onEditProfile={() => onOpenSettings('profile')}
                onOpenPreferences={() => onOpenSettings('preferences')}
                footerLinks={footerLinks}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 4, pb: { xs: 16, md: 12 }, px: { xs: 2, sm: 5, md: 10 } }}>
        {adminView?.viewAs && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Button color="inherit" size="small" onClick={adminView.onExit} sx={{ textTransform: 'none' }}>
                {t('dashboard.switchBackToAdmin')}
              </Button>
            }
          >
            {t('dashboard.viewingAs', { role: t(`role.${adminView.viewAs}`) })}
          </Alert>
        )}

        <Box sx={{ display: section === 'home' ? 'block' : 'none' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ position: 'relative', isolation: 'isolate', mb: 3, gap: 2, alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}
        >
          {/* A soft light behind the greeting that follows the sun: warm in the morning, gone at night. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              zIndex: -1,
              top: -120,
              left: DAY_LIGHT[dayPart].left,
              width: 420,
              height: 300,
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              bgcolor: DAY_LIGHT[dayPart][theme.palette.mode],
              transition: 'left 2.4s ease, background-color 2.4s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          />
          <Box>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem' }, letterSpacing: '-0.02em' }}>
              {t(`greeting.${dayPart}`, { name: firstName })}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {building.name} · {building.address}, {building.city.name}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1, flex: 'none' }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={uploadDocument}
              sx={{ textTransform: 'none', fontWeight: 500, borderColor: 'divider', color: 'text.primary', bgcolor: 'background.paper' }}
            >
              {t('docs.upload')}
            </Button>
            <Button variant="contained" disableElevation startIcon={<BuildOutlinedIcon />} onClick={reportIssue} sx={{ textTransform: 'none', fontWeight: 500 }}>
              {t('issues.new')}
            </Button>
          </Stack>
        </Stack>

        <Box
          ref={containerRef}
          dir="ltr"
          sx={(theme) => ({
            position: 'relative',
            // Keep moving tiles cheap for the browser: isolate each tile's layout, and ignore hover/pointer
            // work inside tiles while one is being dragged or resized.
            '& .home-grid-item': { contain: 'layout style' },
            '& [data-interacting="true"] .tile-body': { pointerEvents: 'none' },
            '& .grid-cell': {
              backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.05 : 0.04),
            },
            '& .grid-cell[data-covered="true"]': { backgroundColor: alpha(theme.palette.primary.main, 0.32) },
            // The arc on the bottom-right corner (like the iPhone clock's): grab it to resize.
            '& .home-grid-resize': { zIndex: 3, color: alpha(theme.palette.text.secondary, 0.45), opacity: 0, cursor: 'nwse-resize', touchAction: 'none' },
            '& .home-grid-resize path[data-resize]': { cursor: 'nwse-resize', touchAction: 'none' },
            '& .home-grid-item:hover .home-grid-resize': { opacity: 1 },
            // Flat tiles: no drop shadow under them, and no card animations while they move or resize.
            // Filled tiles: the section colour is the whole surface, so no border either.
            '& .tile-body > .MuiCard-root.MuiCard-root': { borderRadius: `${tileRadiusPx}px`, border: 'none', boxShadow: 'none', transition: 'none', '&:hover': { boxShadow: 'none' } },
            // Each tile's card fills the tile; long content scrolls inside it.
            '& .tile-body': {
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              // Lets the rules below react to the tile's own width, not the screen's.
              containerType: 'inline-size',
              containerName: 'tile',
              overflowWrap: 'anywhere',
            },
            // Headers (title + buttons) wrap instead of squeezing each other.
            '& .tile-header': { flexWrap: 'wrap', rowGap: '4px' },
            // One-column tiles (~150–280px wide): tighter padding, text wraps instead of being cut off,
            // role chips drop under the name, document actions go under the title.
            '@container tile (max-width: 280px)': {
              '& .tile-body > .MuiCard-root > .MuiCardContent-root.MuiCardContent-root': { padding: '12px' },
              // Avatar | name + details, with the role badge on its own line under the name.
              '& .member-row': { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'start', columnGap: '12px', rowGap: '4px' },
              '& .member-row > .MuiChip-root': { gridColumn: 2, justifySelf: 'start' },
              '& .member-name': { whiteSpace: 'normal' },
              '& .doc-row': { display: 'block', '--doc-actions': '4px' },
              '& .doc-row .MuiListItemSecondaryAction-root': {
                position: 'static',
                transform: 'none',
                display: 'flex',
                justifyContent: 'flex-end',
                paddingInlineEnd: 0,
              },
              '& .doc-row .MuiListItemIcon-root': { minWidth: 28 },
            },
            '& .tile-body > .MuiCard-root': {
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            },
            // Scrollbars inside tiles start/end exactly where the rounded corner stops covering them: the thumb's
            // outer edge is 2px from the tile edge, and a circle of radius r is that close to the edge from
            // r - sqrt(2*r*2 - 4) below the top. Invisible buttons at both ends of the track hold the thumb there.
            // Scrollbars inside tiles keep clear of the rounded corners (and the resize arc): invisible buttons at
            // both ends of the track push the thumb inward, so it is never cut off. Colours stay the app's own.
            '& .tile-body .MuiCardContent-root::-webkit-scrollbar-button:vertical:start:decrement': {
              display: 'block',
              height: `${scrollInset}px`,
              background: 'transparent',
            },
            '& .tile-body .MuiCardContent-root::-webkit-scrollbar-button:vertical:end:increment': {
              display: 'block',
              height: `${scrollInset}px`,
              background: 'transparent',
            },
            '& .tile-body > .MuiCard-root > .MuiCardContent-root': {
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
            },
            '& .tile-drag-handle, & .tile-remove': {
              opacity: 0,
            },
            '& .home-grid-item:hover .tile-drag-handle, & .home-grid-item:hover .tile-remove, & .tile-remove:focus-visible': { opacity: 1 },
            // No hover on touch screens: keep the remove button visible there.
            '@media (hover: none)': { '& .tile-remove': { opacity: 1 } },
          })}
        >
          {mounted && (
            <HomeGrid
              items={shownItems}
              cols={cols}
              width={width}
              rowHeight={rowHeight}
              margin={MARGIN}
              maxRows={rowLimit}
              backgroundRows={gridRows}
              cellRadius={Math.min(tileRadiusPx, Math.round(rowHeight * 0.28))}
              tileRadius={tileRadiusPx}
              editable={canEdit}
              external={dragging && breakpoint !== 'sm' ? { id: dragging, ...dragSize } : null}
              onCommit={commitItems}
              onExternalDrop={(id, at) => {
                draggingRef.current = null;
                setDragging(null);
                addTile(id as TileId, at);
              }}
            >
              {tileNodes}
            </HomeGrid>
          )}
        </Box>

        {hidden.length === TILE_IDS.length && (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
            {t('widgets.empty')}
          </Typography>
        )}

        {/* Same sides in every language (button left, text right); each part keeps its own text direction. */}
        <Stack direction="row" dir="ltr" sx={{ mt: 4, gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stack direction="row" dir={dir} sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              data-widgets-toggle
              startIcon={<WidgetsOutlinedIcon />}
              onClick={() => setDrawerOpen((open) => !open)}
              sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 3, borderColor: 'divider', color: 'text.primary' }}
            >
              {t('widgets.add')}
            </Button>
            {canEdit && (
              <Button variant="text" startIcon={<RestartAltIcon />} onClick={() => setConfirm({ kind: 'reset' })} sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 3, color: 'text.secondary' }}>
                {t('layout.reset')}
              </Button>
            )}
          </Stack>
          <Typography dir={dir} variant="body2" color="text.secondary">
            {t('widgets.wantMore')}{' '}
            <Link component="button" type="button" onClick={() => setWidgetFeedback(true)} sx={{ verticalAlign: 'baseline' }}>
              {t('widgets.tellUs')}
            </Link>
          </Typography>
        </Stack>
        </Box>

        {section !== 'home' && (
          <Box>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem' }, letterSpacing: '-0.02em', mb: 3 }}>
              {t(`nav.${section}`)}
            </Typography>
            <Stack
              spacing={2}
              sx={{
                // The page is one big tile in its section's colour.
                ...tileVars(theme.palette.mode, pages[section].tile),
                bgcolor: 'transparent',
                '& > .MuiCard-root': { borderRadius: `${TILE_RADIUS_PX}px`, border: 'none', boxShadow: 'none', bgcolor: 'background.paper' },
                '& > .MuiCard-root > .MuiCardContent-root': { p: { xs: 2.5, md: 4 } },
              }}
            >
              {pages[section].content}
            </Stack>
          </Box>
        )}
      </Container>

      <SectionBar section={section} onChange={goTo} />

      <WidgetsDrawer
        editing={editing}
        onEditingChange={(on) => {
          setEditing(on);
          setLayoutEditing(on);
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        available={TILE_IDS.filter((id) => hidden.includes(id))}
        onAdd={(id) => addTile(id)}
        onDragStart={(id) => {
          draggingRef.current = id;
          setDragging(id);
        }}
        onDragEnd={() => {
          draggingRef.current = null;
          setDragging(null);
        }}
        onPreset={(preset) => setConfirm({ kind: 'preset', preset })}
      />
      {widgetFeedback && <FeedbackDialog about="widgets" onClose={() => setWidgetFeedback(false)} />}

      {confirm && (
        <Dialog open onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>
            {confirm.kind === 'reset'
              ? t('layout.resetConfirmTitle')
              : confirm.kind === 'preset'
                ? t('layout.presetConfirmTitle', { name: t(`layout.preset.${confirm.preset}`) })
                : t('widgets.removeConfirmTitle', { name: t(`widgets.tile.${confirm.id}`) })}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirm.kind === 'reset'
                ? t('layout.resetConfirmText')
                : confirm.kind === 'preset'
                  ? t('layout.presetConfirmText')
                  : t('widgets.removeConfirmText')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirm(null)} sx={{ textTransform: 'none' }}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (confirm.kind === 'reset') resetLayout();
                else if (confirm.kind === 'preset') applyPreset(confirm.preset);
                else changeHidden([...hidden, confirm.id]);
                setConfirm(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              {confirm.kind === 'reset'
                ? t('layout.reset')
                : confirm.kind === 'preset'
                  ? t('layout.presetApply')
                  : t('widgets.removeConfirmAction')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {editingDetails && (
        <EditBuildingDialog
          building={building}
          canEditIdentity={isAdmin}
          cities={cities}
          onClose={() => setEditingDetails(false)}
          onSave={async (fields) => {
            if (isAdmin) {
              await api.admin.updateBuilding(idToken, building.id, {
                name: fields.name!,
                cityId: fields.cityId!,
                address: fields.address!,
                description: fields.description,
                entryCode: fields.entryCode,
              });
              onBuildingRefresh();
            } else {
              onBuildingChange(await api.manage.updateDetails(idToken, building.id, fields));
            }
            setEditingDetails(false);
          }}
          onAddLink={(input) =>
            isAdmin
              ? api.admin.addContactLink(idToken, building.id, input)
              : api.manage.addContactLink(idToken, building.id, input)
          }
          onRemoveLink={async (link) => {
            if (isAdmin) await api.admin.removeContactLink(idToken, link.id);
            else await api.manage.removeContactLink(idToken, building.id, link.id);
          }}
          onContactLinksChange={(contactLinks) => onBuildingChange({ ...building, contactLinks })}
        />
      )}
    </Box>
  );
}
