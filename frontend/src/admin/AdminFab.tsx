import { useState } from 'react';
import { Box, Divider, Fab, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CheckIcon from '@mui/icons-material/Check';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { BUILDING_ROLES, type BuildingRole } from '../types/building';

interface AdminFabProps {
  /** The building role being previewed; null = full admin. */
  viewAs: BuildingRole | null;
  onViewAsChange: (role: BuildingRole | null) => void;
  onOpenConsole: () => void;
  /** Disables "Open admin console" while it's already open. */
  consoleOpen: boolean;
}

/** Floating wrench, shown only to real admins (also while previewing another role). */
export default function AdminFab({ viewAs, onViewAsChange, onOpenConsole, consoleOpen }: AdminFabProps) {
  const { t, dir } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const edge = dir === 'rtl' ? 'left' : 'right';
  const options: { role: BuildingRole | null; label: string }[] = [
    { role: null, label: t('adminFab.roleAdmin') },
    ...BUILDING_ROLES.map((role) => ({ role, label: t(`role.${role}`) })),
  ];

  return (
    <Box sx={{ position: 'fixed', bottom: 56, insetInlineEnd: 24, zIndex: 1100 }}>
      <Tooltip title={t('adminFab.tooltip')} placement={dir === 'rtl' ? 'right' : 'left'}>
        <Fab
          color={viewAs ? 'default' : 'primary'}
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
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('adminFab.viewAs')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('adminFab.viewAsHint')}
          </Typography>
        </Box>
        {/* Stays open on pick so the check visibly moves. */}
        {options.map(({ role, label }) => (
          <MenuItem key={role ?? 'admin'} selected={viewAs === role} onClick={() => onViewAsChange(role)}>
            <ListItemIcon>{viewAs === role ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
        <Divider />
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
