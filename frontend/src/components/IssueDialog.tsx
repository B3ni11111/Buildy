import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import { Thumb } from './IssueThumbs';
import FileViewerDialog from './FileViewerDialog';
import StatusLabel, { type StatusTone } from './StatusLabel';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { FILE_ACCEPT, MAX_UPLOAD_BYTES, fileIcon, formatSize, saveBlob } from '../utils/files';
import {
  CurrentUser,
  IssueAttachment,
  IssueDetail,
  IssueStatus,
} from '../types/building';

export const MAX_ISSUE_FILES = 10;

/** The statuses management can move an issue to (opened → in_process | denied, in_process → resolved). */
type NextStatus = 'in_process' | 'denied' | 'resolved';
type Mode = { kind: 'status'; status: NextStatus } | { kind: 'update' };

export const STATUS_COLOR: Record<IssueStatus, 'info' | 'warning' | 'error' | 'success'> = {
  opened: 'info',
  in_process: 'warning',
  denied: 'error',
  resolved: 'success',
};

/** How each issue status is shown as a StatusLabel (dot + word). */
export const STATUS_TONE: Record<IssueStatus, StatusTone> = {
  opened: 'open',
  in_process: 'progress',
  denied: 'denied',
  resolved: 'done',
};

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Picked files plus a button to add more; used when reporting an issue and when changing its status. */
export function FilePicker({
  files,
  onChange,
  error,
  onError,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);

  const pick = (picked: File[]) => {
    const tooBig = picked.some((file) => file.size > MAX_UPLOAD_BYTES);
    const valid = picked.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const merged = [...files, ...valid].slice(0, MAX_ISSUE_FILES);
    onChange(merged);
    onError(tooBig ? t('docs.tooLarge') : files.length + valid.length > MAX_ISSUE_FILES ? t('issues.tooMany') : null);
  };

  return (
    <Box>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept={FILE_ACCEPT}
        onChange={(e) => {
          pick([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <Button
        startIcon={<AttachFileIcon />}
        onClick={() => input.current?.click()}
        disabled={files.length >= MAX_ISSUE_FILES}
        sx={{ textTransform: 'none' }}
      >
        {t('issues.attach')}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        {t('issues.attachHint')}
      </Typography>
      {files.length > 0 && (
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
          {files.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              size="small"
              label={`${file.name} · ${formatSize(file.size)}`}
              onDelete={() => onChange(files.filter((_, i) => i !== index))}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Stack>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

function Attachments({
  items,
  idToken,
  onOpen,
}: {
  items: IssueAttachment[];
  idToken: string;
  onOpen: (attachment: IssueAttachment) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mt: 1, alignItems: 'center' }}>
      {items.map((attachment) => {
        if (attachment.mimeType.startsWith('image/')) {
          return (
            <Thumb key={attachment.id} idToken={idToken} id={attachment.id} name={attachment.fileName} size={72} onOpen={() => onOpen(attachment)} />
          );
        }
        const Icon = fileIcon(attachment.mimeType);
        return (
          <Chip
            key={attachment.id}
            clickable
            variant="outlined"
            size="small"
            icon={<Icon />}
            label={`${attachment.fileName} · ${formatSize(attachment.sizeBytes)}`}
            onClick={() => onOpen(attachment)}
            sx={{ maxWidth: '100%' }}
          />
        );
      })}
    </Stack>
  );
}

interface IssueDialogProps {
  issueId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  /** Committee head / management company of this building, or an admin. */
  canManage: boolean;
  onClose: () => void;
  /** The issue changed (status, ping, edit) — update its row in the list. */
  onChanged: (issue: IssueDetail) => void;
  onDeleted: (issueId: string) => void;
}

/** One issue: the report, its files, the status history, and the actions each person may take. */
export default function IssueDialog({ issueId, idToken, currentUser, canManage, onClose, onChanged, onDeleted }: IssueDialogProps) {
  const { t, language } = useLanguage();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // What the user is writing: a status change (management) or an update on an issue in process.
  // Nothing shows until they click one of the buttons.
  const [mode, setMode] = useState<Mode | null>(null);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Editing / deleting (author while still "opened", or admin)
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [viewing, setViewing] = useState<{ attachment: IssueAttachment; blob: Blob | null; error: string | null } | null>(null);

  // Undo window: a ticking clock while the viewer's newest update can still be taken back, and
  // whether the form currently holds a note that was taken back.
  const [now, setNow] = useState(() => Date.now());
  const [draftBack, setDraftBack] = useState(false);
  const undoDeadline = issue?.updates.find((update) => update.undoableUntil)?.undoableUntil ?? null;
  useEffect(() => {
    if (!undoDeadline) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [undoDeadline]);

  /** Puts a note that was taken back (and its files) into the form, ready to edit and send again. */
  const restoreDraft = async (detail: IssueDetail) => {
    const draft = detail.draft;
    if (!draft) return;
    const next: Mode | null =
      draft.toStatus === draft.fromStatus
        ? { kind: 'update' }
        : detail.status === 'in_process' && draft.toStatus === 'resolved'
          ? { kind: 'status', status: 'resolved' }
          : null;
    if (!next) return;
    setMode(next);
    setNote(draft.text);
    setFiles([]);
    setFileError(null);
    setDraftBack(true);
    try {
      const restored = await Promise.all(
        draft.attachments.map(async (a) => new File([await api.downloadIssueFile(idToken, a.id)], a.fileName, { type: a.mimeType })),
      );
      setFiles(restored);
    } catch {
      setFileError(t('docs.downloadError'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getIssue(idToken, issueId)
      .then((detail) => {
        if (cancelled) return;
        setIssue(detail);
        void restoreDraft(detail);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, issueId]);

  const dateFormat = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateTimeFormat = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const personName = (person: { name: string | null } | null) => (person ? person.name || t('members.unnamed') : t('common.formerResident'));

  const isAuthor = !!issue?.author && issue.author.id === currentUser?.id;
  const closed = !!issue && issue.status !== 'opened' && issue.status !== 'in_process';
  // The author edits while "opened"; admins until it's closed. Nothing changes once resolved or denied.
  const canEdit = !!issue && ((!!currentUser?.isAdmin && !closed) || (isAuthor && issue.status === 'opened'));
  const canDelete = !!issue && (!!currentUser?.isAdmin || (isAuthor && issue.status === 'opened'));
  // Opened: accept or deny. In process: resolve. Denied and resolved are final.
  const nextStatuses: NextStatus[] = !canManage || !issue ? [] : issue.status === 'opened' ? ['in_process', 'denied'] : issue.status === 'in_process' ? ['resolved'] : [];
  const canUpdate = issue?.status === 'in_process' && (canManage || isAuthor);
  const canPing = !!issue?.canPingAt;
  const pingWait = issue?.canPingAt && new Date(issue.canPingAt).getTime() > Date.now() ? new Date(issue.canPingAt) : null;

  const apply = (detail: IssueDetail) => {
    setIssue(detail);
    onChanged(detail);
  };

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof ApiError && err.status === 429 ? t('issues.pingWait') : fallback);
    } finally {
      setBusy(false);
    }
  };

  const ping = () => run(async () => apply(await api.pingIssue(idToken, issueId)), t('issues.actionError'));

  const undo = (updateId: string) =>
    run(async () => {
      const detail = await api.undoIssueUpdate(idToken, issueId, updateId);
      apply(detail);
      await restoreDraft(detail);
    }, t('issues.actionError'));

  const openMode = (next: Mode) => {
    setDraftBack(false);
    setMode(next);
    setNote('');
    setFiles([]);
    setFileError(null);
    setActionError(null);
  };

  // A status change needs a note; an update needs a message or a file.
  const ready = mode?.kind === 'status' ? !!note.trim() : !!note.trim() || files.length > 0;

  const submit = () =>
    mode &&
    ready &&
    run(async () => {
      apply(
        mode.kind === 'status'
          ? await api.changeIssueStatus(idToken, issueId, mode.status, note.trim(), files)
          : await api.addIssueUpdate(idToken, issueId, note.trim(), files),
      );
      setMode(null);
      setNote('');
      setFiles([]);
      setDraftBack(false);
    }, t('issues.actionError'));

  const saveEdit = () =>
    draftTitle.trim() &&
    run(async () => {
      apply(await api.updateIssue(idToken, issueId, { title: draftTitle.trim(), description: draftDescription.trim() }));
      setEditing(false);
    }, t('issues.actionError'));

  const remove = () =>
    run(async () => {
      await api.deleteIssue(idToken, issueId);
      onDeleted(issueId);
    }, t('issues.actionError'));

  const openFile = async (attachment: IssueAttachment) => {
    setViewing({ attachment, blob: null, error: null });
    try {
      const blob = await api.downloadIssueFile(idToken, attachment.id);
      setViewing((current) => (current?.attachment.id === attachment.id ? { attachment, blob, error: null } : current));
    } catch {
      setViewing((current) =>
        current?.attachment.id === attachment.id ? { attachment, blob: null, error: t('docs.downloadError') } : current,
      );
    }
  };

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pr: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
              {issue?.title ?? ''}
            </Typography>
            {issue && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                <StatusLabel tone={STATUS_TONE[issue.status]} label={t(`issues.status.${issue.status}`)} />
                {issue.pingedRecently && <Chip size="small" variant="outlined" label={t('issues.pinged')} />}
                <Typography variant="caption" color="text.secondary">
                  {t('issues.reportedBy', { name: personName(issue.author), date: dateFormat.format(new Date(issue.createdAt)) })}
                </Typography>
              </Stack>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" aria-label={t('docs.close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loadError && <Alert severity="error">{t('issues.actionError')}</Alert>}

          {issue && (
            <Stack spacing={2.5}>
              {editing ? (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField fullWidth label={t('issues.titleLabel')} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label={t('issues.descriptionLabel')}
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                  />
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Button variant="contained" disabled={!draftTitle.trim() || busy} onClick={saveEdit} sx={{ textTransform: 'none' }}>
                      {t('common.save')}
                    </Button>
                    <Button onClick={() => setEditing(false)} sx={{ textTransform: 'none' }}>
                      {t('common.cancel')}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Box>
                  {issue.description && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{issue.description}</Typography>}
                  <Attachments items={issue.attachments} idToken={idToken} onOpen={openFile} />
                  {(canEdit || canDelete || canPing) && (
                    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 1.5, alignItems: 'center' }}>
                      {canPing && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<NotificationsActiveOutlinedIcon />}
                          disabled={!!pingWait || busy}
                          onClick={ping}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('issues.ping')}
                        </Button>
                      )}
                      {canPing && (
                        <Typography variant="caption" color="text.secondary">
                          {pingWait ? t('issues.pingAvailable', { date: dateFormat.format(pingWait) }) : t('issues.pingHint')}
                        </Typography>
                      )}
                      <Box sx={{ flex: 1 }} />
                      {canEdit && (
                        <IconButton
                          size="small"
                          aria-label={t('issues.editTitle')}
                          onClick={() => {
                            setDraftTitle(issue.title);
                            setDraftDescription(issue.description ?? '');
                            setEditing(true);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" aria-label={t('common.delete')} onClick={() => setConfirmDelete(true)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  )}
                </Box>
              )}

              {issue.updates.length > 0 && (
                <Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 2 }}>
                    {t('issues.history')}
                  </Typography>
                  <Stack spacing={1.5}>
                    {issue.updates.map((update) => (
                      <Box
                        key={update.id}
                        sx={{
                          borderInlineStart: '3px solid',
                          borderColor: update.fromStatus === update.toStatus ? 'divider' : `${STATUS_COLOR[update.toStatus]}.main`,
                          paddingInlineStart: '12px',
                        }}
                      >
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {update.fromStatus === update.toStatus ? (
                            <Chip size="small" variant="outlined" label={t('issues.updateChip')} />
                          ) : (
                            <StatusLabel tone={STATUS_TONE[update.toStatus]} label={t(`issues.status.${update.toStatus}`)} />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {personName(update.author)} · {dateTimeFormat.format(new Date(update.createdAt))}
                          </Typography>
                          {update.undoableUntil && new Date(update.undoableUntil).getTime() > now && (
                            <Button
                              size="small"
                              color="inherit"
                              startIcon={<UndoIcon fontSize="small" />}
                              disabled={busy}
                              onClick={() => undo(update.id)}
                              sx={{ textTransform: 'none', ml: 'auto' }}
                            >
                              {t('issues.undo')} · <span dir="ltr">{formatCountdown(new Date(update.undoableUntil).getTime() - now)}</span>
                            </Button>
                          )}
                        </Stack>
                        {update.text && (
                          <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{update.text}</Typography>
                        )}
                        <Attachments items={update.attachments} idToken={idToken} onOpen={openFile} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {closed ? (
                <Alert severity="info">{t('issues.closed')}</Alert>
              ) : (
                (nextStatuses.length > 0 || canUpdate) && (
                  <Box>
                    <Divider sx={{ mb: 1.5 }} />
                    {!mode ? (
                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                        {nextStatuses.map((next) => (
                          <Button
                            key={next}
                            variant={next === 'denied' ? 'outlined' : 'contained'}
                            disableElevation
                            color={next === 'denied' ? 'error' : next === 'resolved' ? 'success' : 'primary'}
                            onClick={() => openMode({ kind: 'status', status: next })}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            {t(`issues.action.${next}`)}
                          </Button>
                        ))}
                        {canUpdate && (
                          <Button variant="outlined" onClick={() => openMode({ kind: 'update' })} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            {t('issues.addUpdate')}
                          </Button>
                        )}
                      </Stack>
                    ) : (
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {mode.kind === 'status' ? t(`issues.action.${mode.status}`) : t('issues.addUpdate')}
                        </Typography>
                        {draftBack && <Alert severity="info">{t('issues.draftRestored')}</Alert>}
                        <TextField
                          autoFocus
                          fullWidth
                          required={mode.kind === 'status'}
                          multiline
                          minRows={2}
                          label={mode.kind === 'status' ? t('issues.noteLabel') : t('issues.updateLabel')}
                          helperText={mode.kind === 'status' ? t('issues.noteHint') : t('issues.updateHint')}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        <FilePicker files={files} onChange={setFiles} error={fileError} onError={setFileError} />
                        <Stack direction="row" sx={{ gap: 1 }}>
                          <Button variant="contained" disableElevation disabled={!ready || busy} onClick={submit} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            {t('issues.send')}
                          </Button>
                          <Button onClick={() => setMode(null)} sx={{ textTransform: 'none' }}>
                            {t('common.cancel')}
                          </Button>
                        </Stack>
                      </Stack>
                    )}
                  </Box>
                )
              )}

              {actionError && <Alert severity="error">{actionError}</Alert>}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('issues.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('issues.deleteBody')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDelete(false)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" disabled={busy} onClick={remove} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <FileViewerDialog
        open={viewing !== null}
        title={viewing?.attachment.fileName ?? ''}
        mimeType={viewing?.attachment.mimeType ?? ''}
        blob={viewing?.blob ?? null}
        error={viewing?.error}
        onDownload={() => viewing?.blob && saveBlob(viewing.blob, viewing.attachment.fileName)}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
