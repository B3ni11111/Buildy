import { useState } from 'react';
import { IconButton, Menu, MenuItem, Box, Avatar, Stack, Typography, Divider, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGE_OPTIONS } from '../onboarding/onboardingData';
import { LanguageCode } from '../types/language';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckIcon from '@mui/icons-material/Check';

export default function UserInfo({ onViewUserInfo }: { onViewUserInfo?: () => void }) {
  const { user, logout } = useAuth();
  const { t, dir, language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  const isLangOpen = Boolean(langAnchorEl);

  if (!user) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleViewUserInfo = () => {
    onViewUserInfo?.();
    handleClose();
  };

  const handleLanguagePick = (code: LanguageCode) => {
    setLanguage(code);
    setLangAnchorEl(null);
  };

  const edgeSide = dir === 'rtl' ? 'left' : 'right';

  return (
    <Box sx={{ position: 'fixed', top: 16, insetInlineEnd: 16, zIndex: 1000 }}>
      <IconButton
        onClick={handleOpen}
        sx={{
          p: 0,
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <Avatar
          src={user.picture}
          alt={user.name || 'User'}
          sx={{
            width: 40,
            height: 40,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: edgeSide }}
        transformOrigin={{ vertical: 'top', horizontal: edgeSide }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 280,
              mt: 1,
              borderRadius: 3,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Avatar
              src={user.picture}
              alt={user.name || 'User'}
              sx={{ width: 40, height: 40 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
              >
                {user.email}
              </Typography>
            </Box>
          </Stack>
          {user.email_verified && (
            <Box sx={{ mt: 1 }}>
              <Chip label={t('userMenu.emailVerified')} color="success" size="small" variant="filled" />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        <MenuItem
          onClick={(e) => {
            setLangAnchorEl(e.currentTarget);
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">{t('userMenu.language')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {LANGUAGE_OPTIONS.find((opt) => opt.code === language)?.nativeLabel}
            </Typography>
          </Stack>
        </MenuItem>

        {onViewUserInfo && (
          <MenuItem onClick={handleViewUserInfo}>
            <Typography variant="body2">{t('userMenu.settings')}</Typography>
          </MenuItem>
        )}

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
          <Typography variant="body2">{t('userMenu.signOut')}</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={langAnchorEl}
        open={isLangOpen}
        onClose={() => setLangAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: edgeSide }}
        transformOrigin={{ vertical: 'top', horizontal: dir === 'rtl' ? 'right' : 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 160 } } }}
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <MenuItem key={opt.code} onClick={() => handleLanguagePick(opt.code)}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 2 }}>
              <Typography variant="body2">{opt.nativeLabel}</Typography>
              {opt.code === language && <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
