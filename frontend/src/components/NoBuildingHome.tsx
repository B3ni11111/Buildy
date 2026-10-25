import { useState } from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddHomeWorkOutlinedIcon from '@mui/icons-material/AddHomeWorkOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import type { CurrentUser } from '../types/building';

const serif = { fontFamily: '"Rubik", system-ui, sans-serif', fontWeight: 600 };

interface NoBuildingHomeProps {
  firstName: string;
  currentUser: CurrentUser | null;
  onOpenSettings: () => void;
  onCreateBuilding: () => void;
  /** Re-checks whether building management has added the user yet. */
  onRefresh: () => void;
  /** Extra actions for admins (the console button). */
  children?: React.ReactNode;
}

/**
 * Home for a user who isn't in any building yet: their ID, with what to do with it. Building
 * management adds residents by ID, so this is where a new resident spends their first minutes.
 */
export default function NoBuildingHome({ firstName, currentUser, onOpenSettings, onCreateBuilding, onRefresh, children }: NoBuildingHomeProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const id = currentUser?.id ?? '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the ID is selectable on screen
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, sm: 6 }, px: 2 }}>
      <Container maxWidth="sm" disableGutters>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
          <Button startIcon={<SettingsOutlinedIcon />} onClick={onOpenSettings} sx={{ textTransform: 'none' }}>
            {t('settings.title')}
          </Button>
        </Stack>

        <Typography variant="h4" sx={{ ...serif, mb: 1 }}>
          {t('noBuilding.title', { name: firstName })}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('noBuilding.explain')}
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="overline" color="text.secondary">
            {t('noBuilding.idLabel')}
          </Typography>
          <Typography
            dir="ltr"
            sx={{ fontFamily: 'monospace', fontSize: { xs: '0.95rem', sm: '1.1rem' }, wordBreak: 'break-all', userSelect: 'all', my: 1 }}
          >
            {id || '…'}
          </Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              disabled={!id}
              startIcon={copied ? <CheckIcon /> : <ContentCopyOutlinedIcon />}
              onClick={copy}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {copied ? t('noBuilding.copied') : t('noBuilding.copy')}
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={onRefresh} sx={{ textTransform: 'none' }}>
              {t('noBuilding.refresh')}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('noBuilding.aboutTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('noBuilding.aboutBody')}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, mt: 3 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <AddHomeWorkOutlinedIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>{t('noBuilding.createTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('noBuilding.createHint')}
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" onClick={onCreateBuilding} sx={{ textTransform: 'none', mt: 2 }}>
            {t('noBuilding.create')}
          </Button>
        </Paper>

        {children && <Stack sx={{ mt: 3, alignItems: 'center' }}>{children}</Stack>}
      </Container>
    </Box>
  );
}
