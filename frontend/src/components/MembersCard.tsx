import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { useMembers } from '../hooks/useMembers';
import { BUILDING_ROLES, BuildingRole, CurrentUser, Member } from '../types/building';

// Building management — committee head and management company, on the same level above residents.
const MANAGEMENT_ROLES: BuildingRole[] = ['committee_head', 'management_company'];
const RESIDENT_PREVIEW = 5;

const ROLE_CHIP: Record<BuildingRole, { color: 'primary' | 'secondary' | 'default'; variant: 'filled' | 'outlined' }> = {
  committee_head: { color: 'primary', variant: 'filled' },
  management_company: { color: 'secondary', variant: 'filled' },
  resident: { color: 'default', variant: 'outlined' },
};

const initials = (name: string | null) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function MemberRow({
  member,
  currentUser,
  adminControls,
}: {
  member: Member;
  currentUser: CurrentUser | null;
  adminControls?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const chip = ROLE_CHIP[member.role];
  const details = [
    member.apartment != null ? t('members.apartment', { apartment: member.apartment }) : null,
    member.floor != null ? t('members.floor', { floor: member.floor }) : null,
    member.relationType ? t(`relationType.${member.relationType}`) : null,
  ].filter(Boolean);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, py: 1 }}>
      <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: chip.color === 'primary' ? 'primary.main' : 'grey.400' }}>
        {initials(member.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 500 }} noWrap>
            {member.name || t('members.unnamed')}
          </Typography>
          {member.userId === currentUser?.id && <Chip label={t('members.you')} size="small" sx={{ height: 20 }} />}
        </Stack>
        {details.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {details.join(' · ')}
          </Typography>
        )}
      </Box>
      {adminControls ?? (
        <Chip label={t(`role.${member.role}`)} color={chip.color} variant={chip.variant} size="small" />
      )}
    </Stack>
  );
}

/** Full member list, building management first. Admins get a role picker and a remove button per member. */
export function MembersList({
  buildingId,
  idToken,
  currentUser,
  members,
  onChanged,
}: {
  buildingId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  members: Member[];
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const isAdmin = !!currentUser?.isAdmin;
  const [removing, setRemoving] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  const management = members.filter((m) => MANAGEMENT_ROLES.includes(m.role));
  const residents = members.filter((m) => !MANAGEMENT_ROLES.includes(m.role));

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onChanged();
    } catch {
      setError(t('members.actionError'));
    }
  };

  const controls = (member: Member) =>
    isAdmin ? (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <TextField
          select
          size="small"
          value={member.role}
          onChange={(e) =>
            run(() => api.admin.setMemberRole(idToken, buildingId, member.userId, e.target.value as BuildingRole))
          }
          slotProps={{ htmlInput: { 'aria-label': t('members.roleLabel') } }}
          sx={{ minWidth: 150 }}
        >
          {BUILDING_ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {t(`role.${role}`)}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title={t('members.remove')}>
          <IconButton size="small" onClick={() => setRemoving(member)} sx={{ color: 'error.main' }}>
            <PersonRemoveOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    ) : undefined;

  const section = (label: string, list: Member[]) =>
    list.length > 0 && (
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 2 }}>
          {label}
        </Typography>
        {list.map((member) => (
          <MemberRow key={member.userId} member={member} currentUser={currentUser} adminControls={controls(member)} />
        ))}
      </Box>
    );

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error">{error}</Alert>}
      {members.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t('members.empty')}
        </Typography>
      )}
      {section(t('members.management'), management)}
      {section(t('members.residents'), residents)}

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('members.removeConfirm', { name: removing?.name || t('members.unnamed') })}
        </DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRemoving(null)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              const member = removing!;
              setRemoving(null);
              run(() => api.admin.removeMember(idToken, buildingId, member.userId));
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('members.remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

interface MembersCardProps {
  buildingId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  /** Controlled so the "Building members" quick action can open the full list. */
  listOpen: boolean;
  onListOpenChange: (open: boolean) => void;
  /** Called after an admin changes membership, so counts elsewhere can refresh. */
  onMembershipChanged: () => void;
}

/** Dashboard summary: building management (committee head, management company), then the first few residents. */
export default function MembersCard({
  buildingId,
  idToken,
  currentUser,
  listOpen,
  onListOpenChange,
  onMembershipChanged,
}: MembersCardProps) {
  const { t } = useLanguage();
  const { members, reload } = useMembers(idToken, buildingId);

  const management = (members ?? []).filter((m) => MANAGEMENT_ROLES.includes(m.role));
  const residents = (members ?? []).filter((m) => !MANAGEMENT_ROLES.includes(m.role));

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('members.title')}
            </Typography>
            {members && (
              <Typography variant="caption" color="text.secondary">
                {t('members.count', { count: members.length })}
              </Typography>
            )}
          </Box>
          <Button onClick={() => onListOpenChange(true)} sx={{ textTransform: 'none', fontWeight: 500 }}>
            {t('members.viewAll')}
          </Button>
        </Stack>

        {management.length > 0 && (
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 3, px: 1.5, py: 0.5, mb: 1.5 }}>
            <Typography variant="overline" color="primary" sx={{ display: 'block', lineHeight: 2, fontWeight: 600 }}>
              {t('members.management')}
            </Typography>
            {management.map((member) => (
              <MemberRow key={member.userId} member={member} currentUser={currentUser} />
            ))}
          </Box>
        )}

        {residents.slice(0, RESIDENT_PREVIEW).map((member) => (
          <MemberRow key={member.userId} member={member} currentUser={currentUser} />
        ))}
        {residents.length > RESIDENT_PREVIEW && (
          <Button size="small" onClick={() => onListOpenChange(true)} sx={{ textTransform: 'none', mt: 0.5 }}>
            +{residents.length - RESIDENT_PREVIEW}
          </Button>
        )}
      </CardContent>

      <Dialog
        open={listOpen}
        onClose={() => onListOpenChange(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('members.title')}
          <IconButton onClick={() => onListOpenChange(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <MembersList
            buildingId={buildingId}
            idToken={idToken}
            currentUser={currentUser}
            members={members ?? []}
            onChanged={() => {
              reload();
              onMembershipChanged();
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
