import { Box, ButtonBase, ClickAwayListener, Divider, Drawer, FormControlLabel, IconButton, Stack, Switch, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useLanguage } from '../i18n/LanguageContext';
import { LAYOUT_PRESETS, presetLayout, type LayoutPreset, type TileId } from '../utils/homeLayout';
import { tileColors } from '../theme';

const TILE_ICON: Record<TileId, typeof BuildOutlinedIcon> = {
  building: ApartmentOutlinedIcon,
  apartments: HomeWorkOutlinedIcon,
  members: GroupsOutlinedIcon,
  issues: BuildOutlinedIcon,
  docs: FolderOutlinedIcon,
  payments: AccountBalanceWalletOutlinedIcon,
};

/** Header height (px) the drawer leaves free, and the footer's. */
const TOP = 60;
const BOTTOM = 36;

interface WidgetsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Widgets that aren't on the home page right now. */
  available: TileId[];
  /** Click-to-add (dragging onto the grid is handled by the grid's drop target). */
  onAdd: (id: TileId) => void;
  onDragStart: (id: TileId) => void;
  onDragEnd: () => void;
  /** "Edit home layout": whether tiles can be moved, resized and removed. */
  editing: boolean;
  onEditingChange: (on: boolean) => void;
  /** Replace the home layout with a ready-made one (the caller confirms first). */
  onPreset: (preset: LayoutPreset) => void;
}

/**
 * Side panel with the widgets that aren't on the home page. It sits beside the grid without a
 * backdrop, so a widget card can be dragged straight onto the grid (or clicked to add it).
 */
export default function WidgetsDrawer({ open, onClose, available, onAdd, onDragStart, onDragEnd, editing, onEditingChange, onPreset }: WidgetsDrawerProps) {
  const { t, dir } = useLanguage();

  /** A click outside the panel closes it, except on the "Add widgets" buttons (they toggle it) and in dialogs/menus. */
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
    if (!open) return;
    const target = event.target as Element | null;
    if (target?.closest?.('[data-widgets-toggle], .MuiDialog-root, .MuiPopover-root, .MuiMenu-root')) return;
    onClose();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway} mouseEvent="onPointerDown" touchEvent={false}>
      <Drawer
        variant="persistent"
        // Right side in LTR languages, left side in RTL ones.
        anchor={dir === 'rtl' ? 'left' : 'right'}
        open={open}
        slotProps={{
          paper: {
            dir,
            sx: {
              top: TOP,
              height: `calc(100% - ${TOP + BOTTOM}px)`,
              width: 300,
              maxWidth: '90vw',
              borderRadius: 0,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              overflowY: 'auto',
            },
          },
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
            {t('widgets.menuTitle')}
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label={t('docs.close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ px: 2, pb: 1 }}>
          <FormControlLabel
            control={<Switch checked={editing} onChange={(e) => onEditingChange(e.target.checked)} />}
            label={t('layout.editToggle')}
            slotProps={{ typography: { variant: 'body2', sx: { fontWeight: 500 } } }}
            sx={{ mx: 0, gap: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('layout.editToggleHint')}
          </Typography>
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 2, pb: 1 }}>
          {t('layout.presetsTitle')}
        </Typography>
        <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
          {LAYOUT_PRESETS.map((preset) => {
            const { layouts, hidden } = presetLayout(preset);
            const shown = (layouts.lg ?? []).filter((item) => !hidden.includes(item.i as TileId));
            return (
              <ButtonBase
                key={preset}
                onClick={() => onPreset(preset)}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  textAlign: 'start',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                })}
              >
                {/* A miniature of the layout, each tile in its section colour. */}
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    width: 56,
                    height: 44,
                    flex: 'none',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridAutoRows: '1fr',
                    gridTemplateRows: `repeat(${shown.reduce((max, i) => Math.max(max, i.y + i.h), 0)}, 1fr)`,
                    gap: '2px',
                    p: '3px',
                    borderRadius: 1,
                    bgcolor: theme.palette.background.default,
                  })}
                >
                  {shown.map((item) => (
                    <Box
                      key={item.i}
                      sx={(theme) => ({
                        gridColumn: `${item.x + 1} / span ${item.w}`,
                        gridRow: `${item.y + 1} / span ${item.h}`,
                        borderRadius: '3px',
                        bgcolor: tileColors(theme.palette.mode, item.i as TileId).bg,
                        border: '1px solid',
                        borderColor: 'divider',
                      })}
                    />
                  ))}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t(`layout.preset.${preset}`)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(`layout.presetDesc.${preset}`)}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1.5 }}>
          {available.length ? t('widgets.dragHint') : t('widgets.allAdded')}
        </Typography>
        <Stack spacing={1.5} sx={{ px: 2, pb: 2, overflowY: 'auto' }}>
          {available.map((id) => {
            const Icon = TILE_ICON[id];
            return (
              <Box
                key={id}
                draggable
                data-rgl-draggable
                onDragStart={(e) => {
                  // Firefox only starts a drag if some data is set.
                  e.dataTransfer.setData('text/plain', id);
                  e.dataTransfer.effectAllowed = 'move';
                  onDragStart(id);
                }}
                onDragEnd={onDragEnd}
                onClick={() => onAdd(id)}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
                  '&:active': { cursor: 'grabbing' },
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    flexShrink: 0,
                  })}
                >
                  <Icon />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t(`widgets.tile.${id}`)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(`widgets.desc.${id}`)}
                  </Typography>
                </Box>
                <DragIndicatorIcon fontSize="small" color="disabled" />
              </Box>
            );
          })}
        </Stack>
      </Drawer>
    </ClickAwayListener>
  );
}
