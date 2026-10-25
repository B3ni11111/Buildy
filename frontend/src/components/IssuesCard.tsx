import { Thumb } from './IssueThumbs';
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
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import IssueDialog, { FilePicker, STATUS_TONE } from './IssueDialog';
import StatusLabel from './StatusLabel';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { CurrentUser, ISSUE_STATUSES, Issue, IssueDetail, IssueStatus } from '../types/building';

interface IssuesCardProps {
  buildingId: string;
  idToken: string;
  /** Controlled so the "Report an issue" quick action can open the dialog. */
  composeOpen: boolean;
  onComposeOpenChange: (open: boolean) => void;
  currentUser: CurrentUser | null;
  /** Committee head / management company of this building, or an admin: may change statuses. */
  canManage: boolean;
}

/** The building's issues: still-open ones first (a ping brings one back to the top), with a status filter. */
export default function IssuesCard({ buildingId, idToken, composeOpen, onComposeOpenChange, currentUser, canManage }: IssuesCardProps) {
  const { t, language } = useLanguage();
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listIssues(idToken, buildingId)
      .then((list) => {
        if (!cancelled) setIssues(list);
      })
      .catch(() => {
        if (!cancelled) setIssues([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  const closeCompose = () => {
    onComposeOpenChange(false);
    setTitle('');
    setDescription('');
    setFiles([]);
    setFileError(null);
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const created = await api.createIssue(idToken, buildingId, { title: title.trim(), description: description.trim() || undefined }, files);
      setIssues((prev) => [created, ...(prev ?? [])]);
      closeCompose();
    } catch {
      setCreateError(t('issues.postError'));
    } finally {
      setSubmitting(false);
    }
  };

  /** Keeps the list in step with a changed issue; a ping or status change reorders it, so the list is refetched. */
  const handleChanged = (detail: IssueDetail) => {
    setIssues((prev) => (prev ?? []).map((i) => (i.id === detail.id ? detail : i)));
    api
      .listIssues(idToken, buildingId)
      .then(setIssues)
      .catch(() => {});
  };

  const visible = (issues ?? []).filter((i) => filter === 'all' || i.status === filter);
  const dateFormat = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack className="tile-header" direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('issues.title')}
            </Typography>
            <Button startIcon={<AddIcon />} onClick={() => onComposeOpenChange(true)} sx={{ textTransform: 'none', fontWeight: 500 }}>
              {t('issues.new')}
            </Button>
          </Stack>

          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {(['all', ...ISSUE_STATUSES] as const).map((status) => (
              <Chip
                key={status}
                label={status === 'all' ? t('dashboard.filterAll') : t(`issues.status.${status}`)}
                color={filter === status ? 'primary' : 'default'}
                variant={filter === status ? 'filled' : 'outlined'}
                onClick={() => setFilter(status)}
                size="small"
              />
            ))}
          </Stack>

          {issues && visible.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {filter === 'all' ? t('issues.empty') : t('issues.emptyFiltered')}
            </Typography>
          )}
          <List disablePadding>
            {visible.map((issue, idx) => (
              <ListItemButton
                key={issue.id}
                disableGutters
                onClick={() => setOpenId(issue.id)}
                sx={{ py: 1.25, borderTop: idx === 0 ? 'none' : '1px solid', borderColor: 'divider', alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography component="span" sx={{ fontWeight: 500, overflowWrap: 'anywhere' }}>
                        {issue.title}
                      </Typography>
                      <StatusLabel tone={STATUS_TONE[issue.status]} label={t(`issues.status.${issue.status}`)} />
                      {issue.pingedRecently && <Chip label={t('issues.pinged')} size="small" variant="outlined" />}
                    </Stack>
                  }
                  secondary={
                    <>
                      {issue.description && (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {issue.description}
                        </Typography>
                      )}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {[issue.author ? issue.author.name : t('common.formerResident'), dateFormat.format(new Date(issue.createdAt))]
                          .filter(Boolean)
                          .join(' · ')}
                        {issue._count.attachments > 0 && (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            · <AttachFileIcon sx={{ fontSize: 14 }} />
                            {issue._count.attachments}
                          </Box>
                        )}
                      </Typography>
                      {!!issue.attachments?.length && (
                        <Box component="span" sx={{ display: 'flex', gap: 0.75, mt: 0.75 }}>
                          {issue.attachments.map((file) => (
                            <Thumb key={file.id} idToken={idToken} id={file.id} name={file.fileName} size={44} />
                          ))}
                        </Box>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={composeOpen} onClose={closeCompose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('issues.new')}
          </Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField autoFocus fullWidth label={t('issues.titleLabel')} value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('issues.descriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <FilePicker files={files} onChange={setFiles} error={fileError} onError={setFileError} />
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeCompose} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" disabled={!title.trim() || submitting} onClick={handleCreate} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('issues.post')}
          </Button>
        </DialogActions>
      </Dialog>

      {openId && (
        <IssueDialog
          issueId={openId}
          idToken={idToken}
          currentUser={currentUser}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onChanged={handleChanged}
          onDeleted={(id) => {
            setIssues((prev) => (prev ?? []).filter((i) => i.id !== id));
            setOpenId(null);
          }}
        />
      )}
    </>
  );
}
