import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import UserInfo from './UserInfo';
import MessagesCard from './MessagesCard';
import MyUnitCard from './MyUnitCard';
import MembersCard from './MembersCard';
import DocumentsCard from './DocumentsCard';
import type { SettingsSection } from './Settings';
import { OnboardingData } from '../types/onboarding';
import { Building, ContactLink, ContactType, CurrentUser, MessageType } from '../types/building';
import { useLanguage } from '../i18n/LanguageContext';

const CONTACT_ICON: Record<ContactType, typeof WhatsAppIcon> = {
  whatsapp: WhatsAppIcon,
  phone: PhoneOutlinedIcon,
  email: MailOutlinedIcon,
};

function contactHref({ type, link }: ContactLink) {
  if (type === 'phone') return `tel:${link.replace(/[^+\d]/g, '')}`;
  if (type === 'email') return link.startsWith('mailto:') ? link : `mailto:${link}`;
  return link;
}

interface DashboardProps {
  profile: OnboardingData;
  building: Building;
  idToken: string;
  onOpenSettings: (section: SettingsSection) => void;
  /** Present only for real admins (see UserInfo). */
  adminView?: { viewAsResident: boolean; onToggle: () => void };
  onBuildingChange: (building: Building) => void;
  /** Refetch the building (e.g. member count after an admin changes membership). */
  onBuildingRefresh: () => void;
  currentUser: CurrentUser | null;
}

export default function Dashboard({
  profile,
  building,
  idToken,
  onOpenSettings,
  adminView,
  onBuildingChange,
  onBuildingRefresh,
  currentUser,
}: DashboardProps) {
  const { t } = useLanguage();
  const firstName = profile.name.split(' ')[0];

  // Dialogs the quick actions open, owned here so the cards stay in charge of their own content.
  const [composeType, setComposeType] = useState<MessageType | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const quickActions = [
    { label: t('dashboard.reportIssue'), icon: BuildOutlinedIcon, onClick: () => setComposeType('maintenance') },
    { label: t('dashboard.newMessage'), icon: CampaignOutlinedIcon, onClick: () => setComposeType('general') },
    { label: t('dashboard.uploadDocument'), icon: FileUploadOutlinedIcon, onClick: () => setUploadOpen(true) },
    { label: t('dashboard.viewMembers'), icon: GroupsOutlinedIcon, onClick: () => setMembersOpen(true) },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
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

      <UserInfo
        onEditProfile={() => onOpenSettings('profile')}
        onOpenPreferences={() => onOpenSettings('preferences')}
        adminView={adminView}
      />

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {adminView?.viewAsResident && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Button color="inherit" size="small" onClick={adminView.onToggle} sx={{ textTransform: 'none' }}>
                {t('dashboard.switchBackToAdmin')}
              </Button>
            }
          >
            {t('dashboard.viewingAsResident')}
          </Alert>
        )}
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif', fontWeight: 600 }}
          >
            {t('dashboard.welcome', { name: firstName })}
          </Typography>
          <Typography color="text.secondary">
            {building.name} · {building.address}, {building.city.name}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <Button
              key={label}
              variant="outlined"
              startIcon={<Icon />}
              onClick={onClick}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 3,
                bgcolor: 'background.paper',
                borderColor: 'divider',
                color: 'text.primary',
                py: 1,
                px: 2,
                '&:hover': { borderColor: 'primary.main', bgcolor: 'background.paper' },
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('dashboard.building')}
                  </Typography>
                  <Stack spacing={1.25}>
                    <Typography variant="body2" color="text.secondary">
                      {building.address}, {building.city.name}
                    </Typography>
                    {building.description && <Typography variant="body2">{building.description}</Typography>}
                    <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
                      {building.entryCode && (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <VpnKeyOutlinedIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {t('dashboard.entryCode')}: <strong dir="ltr">{building.entryCode}</strong>
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <PeopleOutlinedIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {t('dashboard.memberCount', { count: building.memberCount })}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                      {t('dashboard.contacts')}
                    </Typography>
                    {building.contactLinks.length > 0 ? (
                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {building.contactLinks.map((contact) => {
                          const Icon = CONTACT_ICON[contact.type];
                          return (
                            <Chip
                              key={contact.id}
                              icon={<Icon />}
                              label={contact.type === 'whatsapp' ? t('contactType.whatsapp') : contact.link}
                              component="a"
                              href={contactHref(contact)}
                              target={contact.type === 'whatsapp' ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              clickable
                              color="primary"
                              variant="outlined"
                              sx={{ direction: 'ltr' }}
                            />
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.noContacts')}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <MyUnitCard building={building} idToken={idToken} onBuildingChange={onBuildingChange} />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <MembersCard
              buildingId={building.id}
              idToken={idToken}
              currentUser={currentUser}
              listOpen={membersOpen}
              onListOpenChange={setMembersOpen}
              onMembershipChanged={onBuildingRefresh}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <MessagesCard
              buildingId={building.id}
              idToken={idToken}
              composeType={composeType}
              onComposeTypeChange={setComposeType}
              currentUser={currentUser}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <DocumentsCard
              buildingId={building.id}
              idToken={idToken}
              currentUser={currentUser}
              uploadOpen={uploadOpen}
              onUploadOpenChange={setUploadOpen}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
