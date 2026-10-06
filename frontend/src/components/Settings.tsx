import { useEffect, useRef, useState } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useAuth } from '../context/AuthContext';
import { useColorMode, type ColorModePreference } from '../context/ColorModeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { saveOnboardingData } from '../utils/onboarding';
import { LANGUAGE_OPTIONS, USER_TYPE_OPTIONS } from '../onboarding/onboardingData';
import { OnboardingData } from '../types/onboarding';
import { LanguageCode } from '../types/language';

const DELETE_CONFIRM_PHRASE = 'DELETE';
const LEAVE_CONFIRM_PHRASE = 'LEAVE';

const THEME_OPTIONS: { value: ColorModePreference; icon: typeof LightModeOutlinedIcon }[] = [
  { value: 'light', icon: LightModeOutlinedIcon },
  { value: 'dark', icon: DarkModeOutlinedIcon },
  { value: 'system', icon: SettingsBrightnessOutlinedIcon },
];

export type SettingsSection = 'profile' | 'preferences';

interface SettingsProps {
  profile: OnboardingData;
  onUpdateProfile: (data: OnboardingData) => void;
  onBack: () => void;
  onLeaveBuilding: () => void;
  /** Present only for admins. */
  onOpenAdmin?: () => void;
  /** Section to scroll to on open (from the user menu). */
  initialSection?: SettingsSection;
}

const sectionTitleSx = { fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif', fontWeight: 600 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default function Settings({
  profile,
  onUpdateProfile,
  onBack,
  onLeaveBuilding,
  onOpenAdmin,
  initialSection,
}: SettingsProps) {
  const { user } = useAuth();
  const { t, dir, language, setLanguage } = useLanguage();
  const { preference, setPreference } = useColorMode();
  const preferencesRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftUserType, setDraftUserType] = useState(profile.userType);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteStubOpen, setDeleteStubOpen] = useState(false);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveConfirmText, setLeaveConfirmText] = useState('');

  useEffect(() => {
    if (initialSection === 'preferences') preferencesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [initialSection]);

  if (!user) return null;

  const startEditing = () => {
    setDraftName(profile.name);
    setDraftUserType(profile.userType);
    setIsEditing(true);
  };

  const saveProfile = (updated: OnboardingData) => {
    saveOnboardingData(updated);
    onUpdateProfile(updated);
  };

  const handleSave = () => {
    saveProfile({ ...profile, name: draftName.trim() || profile.name, userType: draftUserType });
    setIsEditing(false);
  };

  // Preferences apply immediately — no save button.
  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    saveProfile({ ...profile, language: code });
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

  const closeLeaveDialog = () => {
    setLeaveOpen(false);
    setLeaveConfirmText('');
  };

  const handleConfirmLeave = () => {
    closeLeaveDialog();
    onLeaveBuilding();
  };

  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;
  const selectedUserType = USER_TYPE_OPTIONS.find((opt) => opt.value === profile.userType);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 5, pb: 12 }}>
      <Container maxWidth="sm">
        <Button startIcon={<BackIcon />} onClick={onBack} sx={{ textTransform: 'none', mb: 2 }}>
          {t('settings.backToHome')}
        </Button>
        <Typography variant="h4" sx={{ ...sectionTitleSx, mb: 0.5 }}>
          {t('settings.title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
          {t('settings.subtitle')}
        </Typography>

        <Stack spacing={3}>
          {/* Profile */}
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={sectionTitleSx}>
                    {t('settings.profileTitle')}
                  </Typography>
                  {!isEditing && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      onClick={startEditing}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('settings.editProfile')}
                    </Button>
                  )}
                </Stack>

                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Avatar
                    src={user.picture}
                    alt={profile.name || user.name || 'User'}
                    sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'primary.main' }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {profile.name || user.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email || 'N/A'}
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                {isEditing ? (
                  <Stack spacing={2.5}>
                    <TextField
                      autoFocus
                      label={t('settings.nameLabel')}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      fullWidth
                    />
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
                      <Button onClick={() => setIsEditing(false)} sx={{ textTransform: 'none' }}>
                        {t('common.cancel')}
                      </Button>
                      <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {t('common.save')}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Field label={t('settings.nameLabel')}>
                      <Typography variant="body2">{profile.name}</Typography>
                    </Field>
                    <Field label={t('settings.roleLabel')}>
                      <Typography variant="body2">
                        {selectedUserType ? t(selectedUserType.labelKey) : profile.userType}
                      </Typography>
                    </Field>
                    <Field label={t('settings.email')}>
                      <Typography variant="body2">{user.email || 'N/A'}</Typography>
                    </Field>
                    {user.email_verified !== undefined && (
                      <Field label={t('settings.emailVerified')}>
                        <Typography
                          variant="body2"
                          sx={{ color: user.email_verified ? 'success.main' : 'error.main', fontWeight: 600 }}
                        >
                          {user.email_verified ? `✓ ${t('settings.verified')}` : `✗ ${t('settings.notVerified')}`}
                        </Typography>
                      </Field>
                    )}
                    {user.sub && (
                      <Field label={t('settings.userId')}>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}
                        >
                          {user.sub}
                        </Typography>
                      </Field>
                    )}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* App preferences */}
          <Card ref={preferencesRef} variant="outlined" sx={{ borderRadius: 4, scrollMarginTop: 24 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h6" sx={sectionTitleSx}>
                    {t('settings.preferencesTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.preferencesSubtitle')}
                  </Typography>
                </Box>
                <TextField
                  select
                  label={t('settings.languageLabel')}
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                  fullWidth
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.code} value={opt.code}>
                      {opt.nativeLabel}
                    </MenuItem>
                  ))}
                </TextField>
                <Field label={t('settings.themeLabel')}>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={preference}
                    onChange={(_e, value: ColorModePreference | null) => value && setPreference(value)}
                  >
                    {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                      <ToggleButton key={value} value={value} sx={{ textTransform: 'none', gap: 1 }}>
                        <Icon fontSize="small" />
                        {t(`theme.${value}`)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Field>
              </Stack>
            </CardContent>
          </Card>

          {/* Account */}
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Typography variant="h6" sx={sectionTitleSx}>
                  {t('settings.accountTitle')}
                </Typography>

                {onOpenAdmin && (
                  <>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {t('admin.sectionTitle')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.sectionDescription')}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AdminPanelSettingsOutlinedIcon />}
                        onClick={onOpenAdmin}
                        sx={{ textTransform: 'none', alignSelf: 'flex-start', mt: 1, fontWeight: 600 }}
                      >
                        {t('admin.openPanel')}
                      </Button>
                    </Stack>
                    <Divider />
                  </>
                )}

                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {t('settings.leaveBuildingTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.leaveBuildingDescription')}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setLeaveOpen(true)}
                    sx={{ textTransform: 'none', alignSelf: 'flex-start', mt: 1 }}
                  >
                    {t('settings.leaveBuildingButton')}
                  </Button>
                </Stack>

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
        </Stack>
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

      <Dialog
        open={leaveOpen}
        onClose={closeLeaveDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('settings.leaveDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t('settings.leaveDialogDescription')}</DialogContentText>
          <DialogContentText sx={{ mb: 1.5, fontWeight: 500 }}>
            {t('settings.leaveConfirmInstruction', { phrase: LEAVE_CONFIRM_PHRASE })}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            value={leaveConfirmText}
            onChange={(e) => setLeaveConfirmText(e.target.value)}
            placeholder={t('settings.leaveConfirmPlaceholder', { phrase: LEAVE_CONFIRM_PHRASE })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeLeaveDialog} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={leaveConfirmText !== LEAVE_CONFIRM_PHRASE}
            onClick={handleConfirmLeave}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('settings.leaveBuildingButton')}
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
