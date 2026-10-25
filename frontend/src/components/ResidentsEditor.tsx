import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UserAvatar from './UserAvatar';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { PAYMENT_METHODS, type PaymentMethod, type Picture, type RelationType, type ResidentInput } from '../types/building';

const RELATION_TYPES: RelationType[] = ['owner', 'tenant'];
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** One person on the list, with the apartment details being filled in (kept as text while typing). */
export interface ResidentDraft {
  userId: string;
  name: string | null;
  picture: Picture;
  /** Why this person can't be added (shown on the row); null = ready. */
  problem: 'alreadyMember' | 'blocked' | 'isMe' | null;
  number: string;
  relationType: RelationType;
  floor: string;
  paymentMethod: PaymentMethod | '';
}

const apartmentNumber = (draft: ResidentDraft) => Number.parseInt(draft.number, 10);
const validNumber = (draft: ResidentDraft) => apartmentNumber(draft) >= 1 && apartmentNumber(draft) <= 32767;

/** Rows that can be added: no problem and a valid apartment number. */
export const addableResidents = (drafts: ResidentDraft[]) => drafts.filter((d) => !d.problem);
export const residentsReady = (drafts: ResidentDraft[]) => addableResidents(drafts).every(validNumber);

export function toResidentInputs(drafts: ResidentDraft[]): ResidentInput[] {
  return addableResidents(drafts).map((d) => ({
    userId: d.userId,
    apartments: [
      {
        number: apartmentNumber(d),
        relationType: d.relationType,
        floor: d.floor.trim() === '' ? undefined : Number.parseInt(d.floor, 10),
        paymentMethod: d.paymentMethod || undefined,
      },
    ],
  }));
}

interface ResidentsEditorProps {
  idToken: string;
  /** Known after the building exists; lets the server flag people who are already in or blocked. */
  buildingId?: string;
  drafts: ResidentDraft[];
  onChange: (drafts: ResidentDraft[]) => void;
  /** The creating wizard adds you as management itself, so your own ID can't be a resident there. */
  blockSelf?: boolean;
}

/**
 * Bulk "add residents": paste one text with everyone's user IDs, then set apartment number,
 * owner/renter, floor and payment for all of them in one table. "Set for everyone" fills a column
 * in one go; each row can still be adjusted.
 */
export default function ResidentsEditor({ idToken, buildingId, drafts, onChange, blockSelf }: ResidentsEditorProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [looking, setLooking] = useState(false);
  const [message, setMessage] = useState<{ severity: 'error' | 'warning' | 'info'; text: string } | null>(null);
  // "Set for everyone": empty fields are left alone when applying.
  const [bulk, setBulk] = useState<{ relationType: RelationType | ''; floor: string; paymentMethod: PaymentMethod | '' }>({
    relationType: '',
    floor: '',
    paymentMethod: '',
  });

  const update = (userId: string, patch: Partial<ResidentDraft>) =>
    onChange(drafts.map((d) => (d.userId === userId ? { ...d, ...patch } : d)));

  const addFromText = async () => {
    const known = new Set(drafts.map((d) => d.userId));
    const ids = [...new Set((text.match(UUID) ?? []).map((id) => id.toLowerCase()))].filter((id) => !known.has(id));
    if (ids.length === 0) {
      setMessage({ severity: 'info', text: t('residents.noneFound') });
      return;
    }
    setLooking(true);
    setMessage(null);
    try {
      const found = await api.previewUsers(idToken, ids, buildingId);
      const missing = ids.filter((id) => !found.some((u) => u.userId === id));
      onChange([
        ...drafts,
        ...found.map(
          (u): ResidentDraft => ({
            userId: u.userId,
            name: u.name,
            picture: u.picture,
            problem: u.isMe && blockSelf ? 'isMe' : u.blocked ? 'blocked' : u.alreadyMember ? 'alreadyMember' : null,
            number: '',
            relationType: 'owner',
            floor: '',
            paymentMethod: '',
          }),
        ),
      ]);
      setText('');
      if (missing.length) setMessage({ severity: 'warning', text: t('residents.notFound', { count: missing.length, ids: missing.join(', ') }) });
    } catch {
      setMessage({ severity: 'error', text: t('residents.lookupError') });
    } finally {
      setLooking(false);
    }
  };

  const applyToAll = () =>
    onChange(
      drafts.map((d) =>
        d.problem
          ? d
          : {
              ...d,
              ...(bulk.relationType ? { relationType: bulk.relationType } : {}),
              ...(bulk.floor.trim() ? { floor: bulk.floor } : {}),
              ...(bulk.paymentMethod ? { paymentMethod: bulk.paymentMethod } : {}),
            },
      ),
    );

  const ready = addableResidents(drafts);

  return (
    <Stack spacing={2.5}>
      <Box>
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          label={t('residents.pasteLabel')}
          helperText={t('residents.pasteHint')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          slotProps={{ htmlInput: { dir: 'ltr', style: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
        />
        <Button
          variant="outlined"
          disabled={!text.trim() || looking}
          onClick={addFromText}
          sx={{ textTransform: 'none', mt: 1 }}
        >
          {looking ? t('residents.lookingUp') : t('residents.addToList')}
        </Button>
      </Box>

      {message && <Alert severity={message.severity}>{message.text}</Alert>}

      {drafts.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('residents.empty')}
        </Typography>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('residents.setForAll')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('residents.setForAllHint')}
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.5, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label={t('residents.relation')}
                value={bulk.relationType}
                onChange={(e) => setBulk({ ...bulk, relationType: e.target.value as RelationType | '' })}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">—</MenuItem>
                {RELATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`relationType.${type}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label={t('myUnit.floor')}
                value={bulk.floor}
                onChange={(e) => setBulk({ ...bulk, floor: e.target.value.replace(/[^\d-]/g, '').slice(0, 3) })}
                sx={{ width: 90 }}
                slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
              />
              <TextField
                select
                size="small"
                label={t('myUnit.paymentMethod')}
                value={bulk.paymentMethod}
                onChange={(e) => setBulk({ ...bulk, paymentMethod: e.target.value as PaymentMethod | '' })}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">—</MenuItem>
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {t(`paymentMethod.${method}`)}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                disableElevation
                disabled={!bulk.relationType && !bulk.floor.trim() && !bulk.paymentMethod}
                onClick={applyToAll}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('residents.applyAll')}
              </Button>
            </Stack>
          </Paper>

          <Typography variant="caption" color="text.secondary">
            {t('residents.toAdd', { count: ready.length })}
          </Typography>
          <Stack spacing={1}>
            {drafts.map((draft) => (
              <Paper key={draft.userId} variant="outlined" sx={{ p: 1.25, borderRadius: 3, opacity: draft.problem ? 0.6 : 1 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
                  <UserAvatar userId={draft.userId} name={draft.name} picture={draft.picture} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 500 }} noWrap>
                      {draft.name || t('members.unnamed')}
                    </Typography>
                    {draft.problem && (
                      <Chip size="small" color="warning" variant="outlined" sx={{ height: 20 }} label={t(`residents.${draft.problem}`)} />
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    aria-label={t('residents.removeRow')}
                    onClick={() => onChange(drafts.filter((d) => d.userId !== draft.userId))}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
                {!draft.problem && (
                  <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
                    <TextField
                      required
                      size="small"
                      label={t('myUnit.apartment')}
                      value={draft.number}
                      error={draft.number !== '' && !validNumber(draft)}
                      onChange={(e) => update(draft.userId, { number: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                      sx={{ width: 110 }}
                      slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
                    />
                    <TextField
                      select
                      size="small"
                      label={t('residents.relation')}
                      value={draft.relationType}
                      onChange={(e) => update(draft.userId, { relationType: e.target.value as RelationType })}
                      sx={{ minWidth: 110 }}
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
                      value={draft.floor}
                      onChange={(e) => update(draft.userId, { floor: e.target.value.replace(/[^\d-]/g, '').slice(0, 3) })}
                      sx={{ width: 80 }}
                      slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
                    />
                    <TextField
                      select
                      size="small"
                      label={t('myUnit.paymentMethod')}
                      value={draft.paymentMethod}
                      onChange={(e) => update(draft.userId, { paymentMethod: e.target.value as PaymentMethod | '' })}
                      sx={{ minWidth: 130 }}
                    >
                      <MenuItem value="">—</MenuItem>
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>
                          {t(`paymentMethod.${method}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                )}
              </Paper>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
