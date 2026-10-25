import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import UserAvatar from './UserAvatar';
import AddResidentsDialog from './AddResidentsDialog';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { useMembers } from '../hooks/useMembers';
import {
  ApartmentInput,
  BUILDING_ROLES,
  BlockedUser,
  BuildingRole,
  CurrentUser,
  Member,
  PAYMENT_METHODS,
  PaymentMethod,
  RelationType,
} from '../types/building';

// Building management — committee head and management company, on the same level above residents.
const MANAGEMENT_ROLES: BuildingRole[] = ['committee_head', 'management_company'];
const RELATION_TYPES: RelationType[] = ['owner', 'tenant'];

const ROLE_CHIP: Record<BuildingRole, { color: 'primary' | 'secondary' | 'default'; variant: 'filled' | 'outlined' }> = {
  committee_head: { color: 'primary', variant: 'filled' },
  management_company: { color: 'secondary', variant: 'filled' },
  resident: { color: 'default', variant: 'outlined' },
};

function MemberRow({
  member,
  currentUser,
  trailing,
}: {
  member: Member;
  currentUser: CurrentUser | null;
  trailing?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const chip = ROLE_CHIP[member.role];
  const apartments = member.apartments.map((a) =>
    [
      t('members.apartment', { apartment: a.number }),
      a.floor != null ? t('members.floor', { floor: a.floor }) : null,
      t(`relationType.${a.relationType}`),
    ]
      .filter(Boolean)
      .join(' · '),
  );

  return (
    <Stack className="member-row" direction="row" sx={{ alignItems: 'center', gap: 1.5, py: 1 }}>
      <UserAvatar userId={member.userId} name={member.name} picture={member.picture} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography className="member-name" sx={{ fontWeight: 500 }} noWrap>
            {member.name || t('members.unnamed')}
          </Typography>
          {member.userId === currentUser?.id && <Chip label={t('members.you')} size="small" sx={{ height: 20 }} />}
        </Stack>
        {apartments.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {apartments.join(', ')}
          </Typography>
        )}
        {member.phone && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <PhoneOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography
              component="a"
              href={`tel:${member.phone.replace(/[^+\d]/g, '')}`}
              variant="caption"
              color="text.secondary"
              dir="ltr"
            >
              {member.phone}
            </Typography>
          </Stack>
        )}
      </Box>
      {trailing ?? <Chip label={t(`role.${member.role}`)} color={chip.color} variant={chip.variant} size="small" />}
    </Stack>
  );
}

interface ApartmentDraft {
  number: string;
  relationType: RelationType;
  floor: string;
  sqrm: string;
  paymentMethod: PaymentMethod | '';
}

const toInt = (value: string) => (value.trim() === '' ? null : Number.parseInt(value, 10));

/** Building management edits a member's technical info: apartments, owner/renter, floor, size, payment. */
function ManageMemberDialog({
  member,
  buildingId,
  idToken,
  canRemove,
  onClose,
  onChanged,
}: {
  member: Member;
  buildingId: string;
  idToken: string;
  /** False for yourself, other building management and admins (only an admin can remove those). */
  canRemove: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ApartmentDraft[]>(() => {
    if (member.apartments.length) {
      return member.apartments.map((a) => ({
        number: String(a.number),
        relationType: a.relationType,
        floor: a.floor?.toString() ?? '',
        sqrm: a.sqrm?.toString() ?? '',
        paymentMethod: a.paymentMethod ?? '',
      }));
    }
    return [];
  });
  const [confirming, setConfirming] = useState<'remove' | 'block' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (index: number, patch: Partial<ApartmentDraft>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const numbers = rows.map((r) => r.number.trim());
  const valid =
    numbers.every((n) => /^\d{1,5}$/.test(n) && Number(n) >= 1) && new Set(numbers).size === numbers.length;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const apartments: ApartmentInput[] = rows.map((r) => ({
        number: Number(r.number),
        relationType: r.relationType,
        floor: toInt(r.floor),
        sqrm: toInt(r.sqrm),
        paymentMethod: r.paymentMethod || null,
      }));
      await api.manage.setApartments(idToken, buildingId, member.userId, apartments);
      onChanged();
      onClose();
    } catch {
      setError(t('members.actionError'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (block: boolean) => {
    setError(null);
    try {
      await api.manage.removeMember(idToken, buildingId, member.userId, block);
      onChanged();
      onClose();
    } catch {
      setError(t('members.actionError'));
      setConfirming(null);
    }
  };

  const name = member.name || t('members.unnamed');

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <UserAvatar userId={member.userId} name={member.name} picture={member.picture} />
        {t('members.manageTitle', { name })}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {t('members.apartmentsTitle')}
        </Typography>
        <Stack spacing={1.5}>
          {rows.map((row, index) => (
            <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                size="small"
                label={t('myUnit.apartment')}
                value={row.number}
                onChange={(e) => setRow(index, { number: e.target.value })}
                slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
                sx={{ width: { sm: 100 } }}
              />
              <TextField
                select
                size="small"
                label={t('myUnit.relation')}
                value={row.relationType}
                onChange={(e) => setRow(index, { relationType: e.target.value as RelationType })}
                sx={{ minWidth: 120 }}
              >
                {RELATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`relationType.${type}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label={t('myUnit.floor')}
                value={row.floor}
                onChange={(e) => setRow(index, { floor: e.target.value })}
                slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
                sx={{ width: { sm: 80 } }}
              />
              <TextField
                size="small"
                label={t('myUnit.sqrm')}
                value={row.sqrm}
                onChange={(e) => setRow(index, { sqrm: e.target.value })}
                slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
                sx={{ width: { sm: 90 } }}
              />
              <TextField
                select
                size="small"
                label={t('myUnit.paymentMethod')}
                value={row.paymentMethod}
                onChange={(e) => setRow(index, { paymentMethod: e.target.value as PaymentMethod | '' })}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="">—</MenuItem>
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {t(`paymentMethod.${method}`)}
                  </MenuItem>
                ))}
              </TextField>
              <IconButton
                size="small"
                aria-label={t('common.delete')}
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setRows((current) => [...current, { number: '', relationType: 'owner', floor: '', sqrm: '', paymentMethod: '' }])
            }
            sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
          >
            {t('members.addApartment')}
          </Button>
        </Stack>

        {canRemove && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <Stack direction="row" spacing={1}>
              <Button color="error" variant="outlined" onClick={() => setConfirming('remove')} sx={{ textTransform: 'none' }}>
                {t('members.remove')}
              </Button>
              <Button color="error" variant="contained" onClick={() => setConfirming('block')} sx={{ textTransform: 'none' }}>
                {t('members.block')}
              </Button>
            </Stack>
          </>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" disabled={!valid || saving} onClick={save} sx={{ textTransform: 'none', fontWeight: 600 }}>
          {t('common.save')}
        </Button>
      </DialogActions>

      <Dialog open={confirming !== null} onClose={() => setConfirming(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t(confirming === 'block' ? 'members.blockConfirm' : 'members.removeConfirm', { name })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(confirming === 'block' ? 'members.blockHint' : 'members.removeHint')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirming(null)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => remove(confirming === 'block')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t(confirming === 'block' ? 'members.block' : 'members.remove')}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

/** Blocked users of a building, with Unblock (building management / admin). */
function BlockedList({ buildingId, idToken, reloadKey }: { buildingId: string; idToken: string; reloadKey: number }) {
  const { t } = useLanguage();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [localReload, setLocalReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.manage
      .listBlocks(idToken, buildingId)
      .then((list) => {
        if (!cancelled) setBlocked(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId, reloadKey, localReload]);

  if (blocked.length === 0) return null;
  return (
    <Box>
      <Typography variant="overline" color="error" sx={{ display: 'block', lineHeight: 2 }}>
        {t('members.blockedTitle')}
      </Typography>
      {blocked.map((user) => (
        <Stack key={user.userId} direction="row" sx={{ alignItems: 'center', gap: 1, py: 0.75 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {user.name || user.email || t('members.unnamed')}
            </Typography>
            {user.blockedBy && (
              <Typography variant="caption" color="text.secondary">
                {t('members.blockedBy', { name: user.blockedBy })}
              </Typography>
            )}
          </Box>
          <Button
            size="small"
            onClick={() => api.manage.unblock(idToken, buildingId, user.userId).then(() => setLocalReload((n) => n + 1))}
            sx={{ textTransform: 'none' }}
          >
            {t('members.unblock')}
          </Button>
        </Stack>
      ))}
    </Box>
  );
}

/**
 * Full member list, building management first. Building management (and admins) get a
 * Manage dialog per member and the blocked list; admins also get the role picker.
 */
export function MembersList({
  buildingId,
  idToken,
  currentUser,
  canManage,
  members,
  onChanged,
}: {
  buildingId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  /** Committee head / management company of this building, or an admin. */
  canManage: boolean;
  members: Member[];
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const isAdmin = !!currentUser?.isAdmin;
  const [managing, setManaging] = useState<Member | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);

  const management = members.filter((m) => MANAGEMENT_ROLES.includes(m.role));
  const residents = members.filter((m) => !MANAGEMENT_ROLES.includes(m.role));

  const changed = () => {
    setChangeCount((n) => n + 1);
    onChanged();
  };

  const setRole = async (member: Member, role: BuildingRole) => {
    setError(null);
    try {
      await api.admin.setMemberRole(idToken, buildingId, member.userId, role);
      changed();
    } catch {
      setError(t('members.actionError'));
    }
  };

  // Only admins may remove themselves-as-manager, peers or admins; the backend enforces the same.
  const canRemove = (member: Member) =>
    isAdmin || (member.userId !== currentUser?.id && !member.isAdmin && !MANAGEMENT_ROLES.includes(member.role));

  const trailing = (member: Member) =>
    canManage ? (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        {isAdmin ? (
          <TextField
            select
            size="small"
            value={member.role}
            onChange={(e) => setRole(member, e.target.value as BuildingRole)}
            slotProps={{ htmlInput: { 'aria-label': t('members.roleLabel') } }}
            sx={{ minWidth: 150 }}
          >
            {BUILDING_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {t(`role.${role}`)}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Chip label={t(`role.${member.role}`)} color={ROLE_CHIP[member.role].color} variant={ROLE_CHIP[member.role].variant} size="small" />
        )}
        <Tooltip title={t('members.manage')}>
          <IconButton size="small" onClick={() => setManaging(member)}>
            <ManageAccountsOutlinedIcon fontSize="small" />
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
          <MemberRow key={member.userId} member={member} currentUser={currentUser} trailing={trailing(member)} />
        ))}
      </Box>
    );

  return (
    <Stack spacing={1.5}>
      {canManage && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 500, alignSelf: 'flex-start' }}
        >
          {t('residents.addButton')}
        </Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {members.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t('members.empty')}
        </Typography>
      )}
      {section(t('members.management'), management)}
      {section(t('members.residents'), residents)}
      {canManage && <BlockedList buildingId={buildingId} idToken={idToken} reloadKey={changeCount} />}

      {addOpen && (
        <AddResidentsDialog
          buildingId={buildingId}
          idToken={idToken}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            changed();
          }}
        />
      )}

      {managing && (
        <ManageMemberDialog
          key={managing.userId}
          member={managing}
          buildingId={buildingId}
          idToken={idToken}
          canRemove={canRemove(managing)}
          onClose={() => setManaging(null)}
          onChanged={changed}
        />
      )}
    </Stack>
  );
}

interface MembersCardProps {
  buildingId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  canManage: boolean;
  /** Controlled so the "Building members" quick action can open the full list. */
  listOpen: boolean;
  onListOpenChange: (open: boolean) => void;
  /** Called after management changes membership, so counts elsewhere can refresh. */
  onMembershipChanged: () => void;
}

/** Dashboard summary: building management (committee head, management company), then the residents (as many as fit; the rest scroll). */
export default function MembersCard({
  buildingId,
  idToken,
  currentUser,
  canManage,
  listOpen,
  onListOpenChange,
  onMembershipChanged,
}: MembersCardProps) {
  const { t } = useLanguage();
  const { members, reload } = useMembers(idToken, buildingId);

  const management = (members ?? []).filter((m) => MANAGEMENT_ROLES.includes(m.role));
  const residents = (members ?? []).filter((m) => !MANAGEMENT_ROLES.includes(m.role));
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Stack className="tile-header" direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {canManage && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => setAddOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                {t('residents.addButton')}
              </Button>
            )}
            <Button onClick={() => onListOpenChange(true)} sx={{ textTransform: 'none', fontWeight: 500 }}>
              {canManage ? t('members.manage') : t('members.viewAll')}
            </Button>
          </Stack>
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

        {/* All residents: the card scrolls when small, and shows more the taller the tile is stretched. */}
        {residents.map((member) => (
          <MemberRow key={member.userId} member={member} currentUser={currentUser} />
        ))}
      </CardContent>

      {addOpen && (
        <AddResidentsDialog
          buildingId={buildingId}
          idToken={idToken}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            reload();
            onMembershipChanged();
          }}
        />
      )}

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
            canManage={canManage}
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
