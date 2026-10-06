import { useState } from 'react';
import { Box, Fab, ListItemIcon, Menu, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useLanguage } from '../i18n/LanguageContext';

interface AdminFabProps {
  viewAsResident: boolean;
  onToggleViewAsResident: () => void;
  onOpenConsole: () => void;
  /** Disables "Open admin console" while it's already open. */
  consoleOpen: boolean;
}

/** Floating wrench, shown only to real admins (also while previewing as a resident). */
export default function AdminFab({ viewAsResident, onToggleViewAsResident, onOpenConsole, consoleOpen }: AdminFabProps) {
  const { t, dir } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const edge = dir === 'rtl' ? 'left' : 'right';

  return (
    <Box sx={{ position: 'fixed', bottom: 24, insetInlineEnd: 24, zIndex: 1100 }}>
      <Tooltip title={t('adminFab.tooltip')} placement={dir === 'rtl' ? 'right' : 'left'}>
        <Fab
          color={viewAsResident ? 'default' : 'primary'}
          aria-label={t('adminFab.tooltip')}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <BuildIcon />
        </Fab>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: edge }}
        transformOrigin={{ vertical: 'bottom', horizontal: edge }}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 280, mb: 1 } } }}
      >
        {/* Stays open on toggle so the switch visibly flips. */}
        <MenuItem onClick={onToggleViewAsResident}>
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">{t('userMenu.viewAsResident')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('userMenu.viewAsResidentHint')}
            </Typography>
          </Box>
          <Switch edge="end" size="small" checked={viewAsResident} tabIndex={-1} />
        </MenuItem>
        <MenuItem
          disabled={consoleOpen}
          onClick={() => {
            setAnchorEl(null);
            onOpenConsole();
          }}
        >
          <ListItemIcon>
            <AdminPanelSettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{t('adminFab.openConsole')}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
