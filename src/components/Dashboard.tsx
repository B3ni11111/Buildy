import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserInfo from './UserInfo';
import { OnboardingData } from '../types/onboarding';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

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

const BUILDING = {
  name: 'Maple Court',
  address: '14 Ben Yehuda St, Tel Aviv',
  units: 24,
};

interface DashboardProps {
  profile: OnboardingData;
  onViewUserInfo: () => void;
}

export default function Dashboard({ profile, onViewUserInfo }: DashboardProps) {
  const { t, dir } = useLanguage();
  const firstName = profile.name.split(' ')[0];
  const ViewAllIcon = dir === 'rtl' ? ArrowBackIcon : ArrowForwardIcon;

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
            {BUILDING.name} · {BUILDING.address}
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
                    {BUILDING.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.units', { count: BUILDING.units })}
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
        </Grid>
      </Container>
    </Box>
  );
}
