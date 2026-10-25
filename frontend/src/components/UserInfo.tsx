import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  ListItemIcon,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import UserAvatar from './UserAvatar';
import type { CurrentUser, Picture } from '../types/building';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import type { InfoPageKind } from './InfoPage';

interface UserInfoProps {
  /** For the uploaded profile picture; falls back to the Google photo from the login token. */
  currentUser?: CurrentUser | null;
  onEditProfile?: () => void;
  onOpenPreferences?: () => void;
  /** The footer's links, shown in the menu on phones only (the section bar takes the footer's place there). */
  footerLinks?: { onFeedback: () => void; onOpenPage: (kind: InfoPageKind) => void };
}

export default function UserInfo({ currentUser, onEditProfile, onOpenPreferences, footerLinks }: UserInfoProps) {
  const { user, logout } = useAuth();
  const { t, dir } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  if (!user) return null;

  const close = () => setAnchorEl(null);
  const displayName = currentUser?.name || user.name || user.email || t('members.unnamed');
  const picture: Picture = currentUser?.picture ?? { google: user.picture ?? null, version: null };
  const closeThen = (action?: () => void) => () => {
    action?.();
    close();
  };

  const edgeSide = dir === 'rtl' ? 'left' : 'right';

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ p: 0, '&:hover': { transform: 'scale(1.05)' } }}
      >
        <UserAvatar userId={currentUser?.id ?? user.sub} name={displayName} picture={picture} size={36} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: edgeSide }}
        transformOrigin={{ vertical: 'top', horizontal: edgeSide }}
        slotProps={{ paper: { sx: { minWidth: 280, mt: 1, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <UserAvatar userId={currentUser?.id ?? user.sub} name={displayName} picture={picture} size={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
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

        {onEditProfile && (
          <MenuItem onClick={closeThen(onEditProfile)}>
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">{t('userMenu.profile')}</Typography>
          </MenuItem>
        )}

        {onOpenPreferences && (
          <MenuItem onClick={closeThen(onOpenPreferences)}>
            <ListItemIcon>
              <TuneOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">{t('userMenu.preferences')}</Typography>
          </MenuItem>
        )}

        {footerLinks && [
          <Divider key="divider" sx={{ my: 1, display: { md: 'none' } }} />,
          ...(
            [
              ['feedback', ChatBubbleOutlineIcon, t('footer.feedback'), footerLinks.onFeedback],
              ['info', InfoOutlinedIcon, t('footer.infoTitle'), () => footerLinks.onOpenPage('info')],
              ['privacy', ShieldOutlinedIcon, t('footer.privacy'), () => footerLinks.onOpenPage('privacy')],
              ['terms', GavelOutlinedIcon, t('footer.terms'), () => footerLinks.onOpenPage('terms')],
            ] as const
          ).map(([key, Icon, label, action]) => (
            <MenuItem key={key} onClick={closeThen(action)} sx={{ display: { md: 'none' } }}>
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">{label}</Typography>
            </MenuItem>
          )),
        ]}

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={closeThen(logout)} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{t('userMenu.signOut')}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
