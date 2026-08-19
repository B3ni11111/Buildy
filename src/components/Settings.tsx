import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { saveOnboardingData } from '../utils/onboarding';
import { LANGUAGE_OPTIONS, USER_TYPE_OPTIONS } from '../onboarding/onboardingData';
import { OnboardingData } from '../types/onboarding';
import { LanguageCode } from '../types/language';

const DELETE_CONFIRM_PHRASE = 'DELETE';

interface SettingsProps {
  profile: OnboardingData;
  onUpdateProfile: (data: OnboardingData) => void;
  onBack: () => void;
}

export default function Settings({ profile, onUpdateProfile, onBack }: SettingsProps) {
  const { user } = useAuth();
  const { t, dir, setLanguage } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftLanguage, setDraftLanguage] = useState<LanguageCode>(profile.language as LanguageCode);
  const [draftUserType, setDraftUserType] = useState(profile.userType);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteStubOpen, setDeleteStubOpen] = useState(false);

  if (!user) return null;

  const startEditing = () => {
    setDraftName(profile.name);
    setDraftLanguage(profile.language as LanguageCode);
    setDraftUserType(profile.userType);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    // Revert any language preview back to the saved value.
    if (draftLanguage !== profile.language) {
      setLanguage(profile.language as LanguageCode);
    }
    setIsEditing(false);
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setDraftLanguage(code);
    setLanguage(code); // live preview, same as onboarding
  };

  const handleSave = () => {
    const updated: OnboardingData = {
      name: draftName.trim() || profile.name,
      language: draftLanguage,
      userType: draftUserType,
    };
    saveOnboardingData(updated);
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = () => {
    // NOT wired up yet — deletion itself is intentionally a stub until
    // the real account-deletion endpoint exists. This only confirms the
    // UI flow (type-to-confirm) works.
    closeDeleteDialog();
    setDeleteStubOpen(true);
  };

  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;
  const selectedUserType = USER_TYPE_OPTIONS.find((opt) => opt.value === draftUserType);
  const currentLanguageOption = LANGUAGE_OPTIONS.find((opt) => opt.code === profile.language);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent sx={{ pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {t('settings.title')}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {t('settings.subtitle')}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar
                  src={user.picture}
                  alt={user.name || 'User'}
                  sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'primary.main' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {profile.name || user.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email || 'N/A'}
                  </Typography>
                </Box>
                {!isEditing && (
                  <Button size="small" onClick={startEditing} sx={{ textTransform: 'none' }}>
                    {t('common.edit')}
                  </Button>
                )}
              </Stack>

              <Divider />

              {isEditing ? (
                <Stack spacing={2.5}>
                  <TextField
                    label={t('settings.nameLabel')}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    select
                    label={t('settings.languageLabel')}
                    value={draftLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                    fullWidth
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.code} value={opt.code}>
                        {opt.nativeLabel}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={t('settings.roleLabel')}
                    value={draftUserType}
                    onChange={(e) => setDraftUserType(e.target.value)}
                    fullWidth
                  >
                    {USER_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                    <Button onClick={cancelEditing} sx={{ textTransform: 'none' }}>
                      {t('common.cancel')}
                    </Button>
                    <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 600 }}>
                      {t('common.save')}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {t('settings.nameLabel')}
                    </Typography>
                    <Typography variant="body2">{profile.name}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {t('settings.languageLabel')}
                    </Typography>
                    <Typography variant="body2">{currentLanguageOption?.nativeLabel ?? profile.language}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {t('settings.roleLabel')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedUserType ? t(selectedUserType.labelKey) : profile.userType}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {t('settings.email')}
                    </Typography>
                    <Typography variant="body2">{user.email || 'N/A'}</Typography>
                  </Box>

                  {user.email_verified !== undefined && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('settings.emailVerified')}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: user.email_verified ? 'success.main' : 'error.main', fontWeight: 600 }}
                      >
                        {user.email_verified ? `✓ ${t('settings.verified')}` : `✗ ${t('settings.notVerified')}`}
                      </Typography>
                    </Box>
                  )}

                  {user.sub && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('settings.userId')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {user.sub}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              <Divider />

              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={onBack}
                sx={{ textTransform: 'none' }}
              >
                {t('settings.backToHome')}
              </Button>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {t('settings.dangerZoneTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.dangerZoneDescription')}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteOpen(true)}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start', mt: 1 }}
                >
                  {t('settings.deleteAccountButton')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('settings.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t('settings.deleteDialogDescription')}</DialogContentText>
          <DialogContentText sx={{ mb: 1.5, fontWeight: 500 }}>
            {t('settings.deleteConfirmInstruction', { phrase: DELETE_CONFIRM_PHRASE })}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={t('settings.deleteConfirmPlaceholder', { phrase: DELETE_CONFIRM_PHRASE })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteDialog} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== DELETE_CONFIRM_PHRASE}
            onClick={handleConfirmDelete}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('settings.deleteAccountButton')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={deleteStubOpen} autoHideDuration={4000} onClose={() => setDeleteStubOpen(false)}>
        <Alert severity="info" variant="filled" onClose={() => setDeleteStubOpen(false)} sx={{ borderRadius: 3 }}>
          Account deletion isn't connected yet — this is a placeholder.
        </Alert>
      </Snackbar>
    </Box>
  );
}
