import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { useAuth } from '../context/AuthContext';
import { useColorMode, type ColorModePreference } from '../context/ColorModeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { saveOnboardingData } from '../utils/onboarding';
import { LANGUAGE_OPTIONS } from '../onboarding/onboardingData';
import AvatarEditor, { type StagedPicture } from './AvatarEditor';
import { ApiError, api } from '../utils/api';
import type { CurrentUser } from '../types/building';
import { OnboardingData } from '../types/onboarding';
import { LanguageCode } from '../types/language';
import { getLayoutEditing, resetLayouts, setLayoutEditing } from '../utils/homeLayout';

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
  /** Backend view of the user (phone, picture). */
  currentUser: CurrentUser | null;
  onCurrentUserChange: (user: CurrentUser) => void;
  onBack: () => void;
  /** The building "Leave building" applies to (the one on the home screen). */
  buildingName?: string;
  /** Absent while the user isn't in any building. */
  onLeaveBuilding?: () => void;
  /** Present only for admins. */
  onOpenAdmin?: () => void;
  /** Section to scroll to on open (from the user menu). */
  initialSection?: SettingsSection;
}

const sectionTitleSx = { fontFamily: '"Rubik", system-ui, sans-serif', fontWeight: 600 };

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
  currentUser,
  onCurrentUserChange,
  onBack,
  buildingName,
  onLeaveBuilding,
  onOpenAdmin,
  initialSection,
}: SettingsProps) {
  const { user, tokens, logout } = useAuth();
  const idToken = tokens?.id_token ?? '';
  const { t, dir, language, setLanguage } = useLanguage();
  const { preference, setPreference } = useColorMode();
  const preferencesRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhone, setDraftPhone] = useState(currentUser?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  // A picture change waits here until the profile is saved; Cancel drops it.
  const [stagedPicture, setStagedPicture] = useState<StagedPicture>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  // Home-grid editing is a device preference; the Dashboard reads it when it opens.
  const [layoutEditing, setLayoutEditingState] = useState(getLayoutEditing);
  const [layoutReset, setLayoutReset] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveConfirmText, setLeaveConfirmText] = useState('');

  useEffect(() => {
    if (initialSection === 'preferences') preferencesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [initialSection]);

  if (!user) return null;

  const startEditing = () => {
    setDraftName(profile.name);
    setDraftPhone(currentUser?.phone ?? '');
    setProfileError(null);
    setIsEditing(true);
  };

  /** Replaces the staged picture, releasing the previous preview's temporary URL. */
  const stagePicture = (next: StagedPicture) => {
    if (stagedPicture?.kind === 'upload') URL.revokeObjectURL(stagedPicture.previewUrl);
    setStagedPicture(next);
    setPictureError(null);
    if (next && !isEditing) startEditing();
  };

  const cancelEditing = () => {
    stagePicture(null);
    setIsEditing(false);
  };

  const saveProfile = (updated: OnboardingData) => {
    saveOnboardingData(updated);
    onUpdateProfile(updated);
  };

  const handleSave = async () => {
    const name = draftName.trim() || profile.name;
    setSavingProfile(true);
    setProfileError(null);
    try {
      // The picture is only uploaded/removed now, when the whole profile is saved.
      if (stagedPicture?.kind === 'upload') {
        try {
          await api.setAvatar(idToken, stagedPicture.file);
        } catch {
          setProfileError(t('settings.pictureError'));
          return;
        }
      } else if (stagedPicture?.kind === 'remove') {
        await api.removeAvatar(idToken);
      }
      // Name lives in the device profile and the account; phone only in the account.
      const updated = await api.updateMe(idToken, { name, phone: draftPhone.trim() });
      onCurrentUserChange(updated);
      saveProfile({ ...profile, name });
      stagePicture(null);
      setIsEditing(false);
    } catch (err) {
      setProfileError(t(err instanceof ApiError && err.status === 400 ? 'settings.phoneInvalid' : 'settings.saveError'));
    } finally {
      setSavingProfile(false);
    }
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

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Erases the account (messages/docs stay as "Former resident"), then signs out.
      await api.deleteAccount(idToken);
      logout();
    } catch {
      setDeleteError(t('settings.saveError'));
      setDeleting(false);
    }
  };

  const closeLeaveDialog = () => {
    setLeaveOpen(false);
    setLeaveConfirmText('');
  };

  const handleConfirmLeave = () => {
    closeLeaveDialog();
    onLeaveBuilding?.();
  };

  const BackIcon = dir === 'rtl' ? ArrowForwardIcon : ArrowBackIcon;
  const picture = currentUser?.picture ?? { google: user.picture ?? null, version: null };

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
                  <AvatarEditor
                    userId={currentUser?.id ?? user.sub}
                    name={profile.name || user.name}
                    picture={picture}
                    staged={stagedPicture}
                    onStage={stagePicture}
                    onError={setPictureError}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {profile.name || user.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email || 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
                {pictureError && <Alert severity="error">{pictureError}</Alert>}

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
                      label={t('settings.phoneLabel')}
                      value={draftPhone}
                      onChange={(e) => setDraftPhone(e.target.value)}
                      helperText={t('settings.phoneHint')}
                      slotProps={{ htmlInput: { inputMode: 'tel', dir: 'ltr' } }}
                      fullWidth
                    />
                    {stagedPicture && (
                      <Alert severity="info">
                        {t(stagedPicture.kind === 'upload' ? 'picture.pendingUpload' : 'picture.pendingRemove')}
                      </Alert>
                    )}
                    {profileError && <Alert severity="error">{profileError}</Alert>}
                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                      <Button onClick={cancelEditing} sx={{ textTransform: 'none' }}>
                        {t('common.cancel')}
                      </Button>
                      <Button
                        variant="contained"
                        disabled={savingProfile}
                        onClick={handleSave}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {t('common.save')}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Field label={t('settings.nameLabel')}>
                      <Typography variant="body2">{profile.name}</Typography>
                    </Field>
                    <Field label={t('settings.phoneLabel')}>
                      <Typography variant="body2" dir="ltr" sx={{ textAlign: 'start' }}>
                        {currentUser?.phone || '—'}
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
                    {currentUser && (
                      <Field label={t('settings.userId')}>
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            dir="ltr"
                            sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', userSelect: 'all' }}
                          >
                            {currentUser.id}
                          </Typography>
                          <Tooltip title={t('noBuilding.copy')}>
                            <IconButton
                              size="small"
                              aria-label={t('noBuilding.copy')}
                              onClick={() => navigator.clipboard?.writeText(currentUser.id).catch(() => {})}
                            >
                              <ContentCopyOutlinedIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.userIdHint')}
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
                      {opt.partial && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ marginInlineStart: 1 }}>
                          · {t('language.partial')}
                        </Typography>
                      )}
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
                <Field label={t('layout.sectionTitle')}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                      <Typography variant="body2">{t('layout.editToggle')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('layout.editToggleHint')}
                      </Typography>
                    </Box>
                    <Switch
                      checked={layoutEditing}
                      onChange={(e) => {
                        setLayoutEditing(e.target.checked);
                        setLayoutEditingState(e.target.checked);
                      }}
                    />
                  </Stack>
                  <Button
                    size="small"
                    disabled={layoutReset}
                    onClick={() => {
                      resetLayouts(user.sub);
                      setLayoutReset(true);
                    }}
                    sx={{ textTransform: 'none', mt: 1, px: 0 }}
                  >
                    {layoutReset ? t('layout.resetDone') : t('layout.reset')}
                  </Button>
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

                {onLeaveBuilding && (
                  <>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {t('settings.leaveBuildingTitle')} · {buildingName}
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
                  </>
                )}

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
          <DialogContentText sx={{ mb: 1 }}>{t('settings.deleteDialogDescription')}</DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>{t('settings.deleteKeepsContent')}</DialogContentText>
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
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteDialog} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== DELETE_CONFIRM_PHRASE || deleting}
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

    </Box>
  );
}
