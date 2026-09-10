import { useEffect, useState } from 'react';
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
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserInfo from './UserInfo';
import { OnboardingData } from '../types/onboarding';
import { Building, Issue } from '../types/building';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { api } from '../utils/api';

// Mock data — stands in until the documents/finance backends exist.
// Labels are UI chrome (translated); names/addresses below are sample
// content and stay as-is until real data is wired in.
const QUICK_ACTIONS: { labelKey: TranslationKey; icon: typeof BuildOutlinedIcon }[] = [
  { labelKey: 'dashboard.reportIssue', icon: BuildOutlinedIcon },
  { labelKey: 'dashboard.contactManagement', icon: ForumOutlinedIcon },
  { labelKey: 'dashboard.buildingRules', icon: MenuBookOutlinedIcon },
  { labelKey: 'dashboard.committeeMembers', icon: GroupsOutlinedIcon },
];

const DOCUMENTS: { name: string; meta: string; type: 'pdf' | 'doc' }[] = [
  { name: '2026 Annual Budget', meta: 'Finance · Updated Jul 12', type: 'pdf' },
  { name: 'Fire Safety Protocol', meta: 'Safety · Updated Jun 28', type: 'pdf' },
  { name: 'Board Meeting Minutes — July', meta: 'Governance · Updated Jul 30', type: 'doc' },
  { name: 'Elevator Maintenance Contract', meta: 'Maintenance · Updated May 14', type: 'pdf' },
];

interface DashboardProps {
  profile: OnboardingData;
  building: Building;
  idToken: string;
  onViewUserInfo: () => void;
}

export default function Dashboard({ profile, building, idToken, onViewUserInfo }: DashboardProps) {
  const { t, dir } = useLanguage();
  const firstName = profile.name.split(' ')[0];
  const ViewAllIcon = dir === 'rtl' ? ArrowBackIcon : ArrowForwardIcon;

  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listIssues(idToken, building.id)
      .then((list) => {
        if (!cancelled) setIssues(list);
      })
      .catch(() => {
        if (!cancelled) setIssues([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, building.id]);

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setIssueTitle('');
    setIssueDescription('');
    setCreateError(null);
  };

  const handleCreateIssue = async () => {
    if (!issueTitle.trim() || !issueDescription.trim() || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const created = await api.createIssue(idToken, building.id, {
        title: issueTitle.trim(),
        description: issueDescription.trim(),
      });
      setIssues((prev) => [created, ...(prev ?? [])]);
      closeCreateDialog();
    } catch {
      setCreateError(t('dashboard.postIssueError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <Box sx={{ py: 2 }}>
            <Typography
              sx={{
                fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                fontWeight: 600,
                fontSize: '1.25rem',
                color: 'primary.main',
              }}
            >
              buildy
            </Typography>
          </Box>
        </Container>
      </Box>

      <UserInfo onViewUserInfo={onViewUserInfo} />

      <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack spacing={0.5} sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif', fontWeight: 600 }}
          >
            {t('dashboard.welcome', { name: firstName })}
          </Typography>
          <Typography color="text.secondary">
            {building.name} · {building.address}
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('dashboard.quickActions')}
                </Typography>
                <Stack spacing={0.5}>
                  {QUICK_ACTIONS.map(({ labelKey, icon: Icon }) => (
                    <Button
                      key={labelKey}
                      fullWidth
                      startIcon={<Icon />}
                      onClick={labelKey === 'dashboard.reportIssue' ? () => setCreateOpen(true) : undefined}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: 'text.primary',
                        fontWeight: 500,
                        py: 1.1,
                        px: 1.5,
                        borderRadius: 3,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('dashboard.building')}
                </Typography>
                <Stack spacing={0.25}>
                  <Typography variant="body2" color="text.secondary">
                    {building.address}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t('dashboard.documents')}
                  </Typography>
                  <Button endIcon={<ViewAllIcon />} sx={{ textTransform: 'none', fontWeight: 500 }}>
                    {t('dashboard.viewAll')}
                  </Button>
                </Stack>
                <List disablePadding>
                  {DOCUMENTS.map((doc, idx) => (
                    <ListItem
                      key={doc.name}
                      disableGutters
                      sx={{
                        py: 1.25,
                        borderTop: idx === 0 ? 'none' : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                        {doc.type === 'pdf' ? <PictureAsPdfOutlinedIcon /> : <DescriptionOutlinedIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={doc.meta}
                        slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t('dashboard.issues')}
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {t('dashboard.submitIssue')}
                  </Button>
                </Stack>
                {issues && issues.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    {t('dashboard.noIssues')}
                  </Typography>
                )}
                <List disablePadding>
                  {(issues ?? []).map((issue, idx) => (
                    <ListItem
                      key={issue.id}
                      disableGutters
                      sx={{
                        py: 1.25,
                        borderTop: idx === 0 ? 'none' : '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                        <ReportProblemOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.title}
                        secondary={issue.description}
                        slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={createOpen}
        onClose={closeCreateDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('dashboard.reportIssueDialogTitle')}
          </Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label={t('dashboard.issueTitleLabel')}
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('dashboard.issueDescriptionLabel')}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeCreateDialog} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!issueTitle.trim() || !issueDescription.trim() || submitting}
            onClick={handleCreateIssue}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('dashboard.submitIssue')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
