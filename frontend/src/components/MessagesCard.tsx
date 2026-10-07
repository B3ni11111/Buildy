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
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../utils/api';
import { CurrentUser, MESSAGE_TYPES, Message, MessageType } from '../types/building';

const TYPE_STYLE: Record<MessageType, { color: 'default' | 'error' | 'warning'; icon: typeof CampaignOutlinedIcon }> = {
  general: { color: 'default', icon: CampaignOutlinedIcon },
  urgent: { color: 'error', icon: ErrorOutlinedIcon },
  maintenance: { color: 'warning', icon: BuildOutlinedIcon },
};

interface MessagesCardProps {
  buildingId: string;
  idToken: string;
  /** Type preselected in the compose dialog; null = dialog closed. Controlled by the parent so quick actions can open it. */
  composeType: MessageType | null;
  onComposeTypeChange: (type: MessageType | null) => void;
  /** Used to decide who sees edit/delete: the message author, or any admin. */
  currentUser: CurrentUser | null;
}

export default function MessagesCard({
  buildingId,
  idToken,
  composeType,
  onComposeTypeChange,
  currentUser,
}: MessagesCardProps) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [filter, setFilter] = useState<MessageType | 'all'>('all');

  // The user's pick in the dialog; until they pick, use the type the opener asked for.
  const [pickedType, setPickedType] = useState<MessageType | null>(null);
  const draftType = pickedType ?? composeType ?? 'general';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Set when the dialog is editing an existing message instead of composing a new one.
  const [editing, setEditing] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canModify = (message: Message) =>
    !!currentUser && (currentUser.isAdmin || message.authorId === currentUser.id);

  useEffect(() => {
    let cancelled = false;
    api
      .listMessages(idToken, buildingId)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  const openEdit = (message: Message) => {
    setEditing(message);
    setPickedType(message.type);
    setTitle(message.title);
    setDescription(message.description ?? '');
    setCreateError(null);
  };

  const closeDialog = () => {
    onComposeTypeChange(null);
    setEditing(null);
    setPickedType(null);
    setTitle('');
    setDescription('');
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      if (editing) {
        const updated = await api.updateMessage(idToken, editing.id, {
          type: draftType,
          title: title.trim(),
          description: description.trim(),
        });
        setMessages((prev) => (prev ?? []).map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await api.createMessage(idToken, buildingId, {
          type: draftType,
          title: title.trim(),
          description: description.trim() || undefined,
        });
        setMessages((prev) => [created, ...(prev ?? [])]);
      }
      closeDialog();
    } catch {
      setCreateError(t(editing ? 'messages.actionError' : 'dashboard.postMessageError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await api.deleteMessage(idToken, deleting.id);
      setMessages((prev) => (prev ?? []).filter((m) => m.id !== deleting.id));
      setDeleting(null);
    } catch {
      setDeleteError(t('messages.actionError'));
    }
  };

  const visible = (messages ?? []).filter((m) => filter === 'all' || m.type === filter);
  const dateFormat = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('dashboard.messages')}
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => onComposeTypeChange('general')}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {t('dashboard.newMessage')}
            </Button>
          </Stack>

          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {(['all', ...MESSAGE_TYPES] as const).map((type) => (
              <Chip
                key={type}
                label={type === 'all' ? t('dashboard.filterAll') : t(`messageType.${type}`)}
                color={filter === type ? 'primary' : 'default'}
                variant={filter === type ? 'filled' : 'outlined'}
                onClick={() => setFilter(type)}
                size="small"
              />
            ))}
          </Stack>

          {messages && visible.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {filter === 'all' ? t('dashboard.noMessages') : t('dashboard.noMessagesOfType')}
            </Typography>
          )}
          <List disablePadding>
            {visible.map((message, idx) => {
              const { color, icon: Icon } = TYPE_STYLE[message.type];
              return (
                <ListItem
                  key={message.id}
                  disableGutters
                  alignItems="flex-start"
                  secondaryAction={
                    canModify(message) && (
                      <Stack direction="row">
                        <IconButton size="small" aria-label={t('messages.editTitle')} onClick={() => openEdit(message)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={t('common.delete')}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(message);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )
                  }
                  sx={{
                    py: 1.25,
                    pr: canModify(message) ? 10 : 0,
                    borderTop: idx === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5, color: color === 'default' ? 'primary.main' : `${color}.main` }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography component="span" sx={{ fontWeight: 500 }}>
                          {message.title}
                        </Typography>
                        <Chip label={t(`messageType.${message.type}`)} color={color} size="small" variant="outlined" />
                      </Stack>
                    }
                    secondary={
                      <>
                        {message.description && (
                          <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                            {message.description}
                          </Typography>
                        )}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {[message.author ? message.author.name : t('common.formerResident'), dateFormat.format(new Date(message.uploadDate))]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>

      <Dialog
        open={composeType !== null || editing !== null}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t(editing ? 'messages.editTitle' : 'dashboard.newMessage')}
          </Typography>
        </Box>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                {t('dashboard.messageTypeLabel')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={draftType}
                onChange={(_e, value: MessageType | null) => value && setPickedType(value)}
              >
                {MESSAGE_TYPES.map((type) => {
                  const Icon = TYPE_STYLE[type].icon;
                  return (
                    <ToggleButton key={type} value={type} sx={{ textTransform: 'none', gap: 0.75 }}>
                      <Icon fontSize="small" />
                      {t(`messageType.${type}`)}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </Box>
            <TextField
              autoFocus
              fullWidth
              label={t('dashboard.messageTitleLabel')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('dashboard.messageDescriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!title.trim() || submitting}
            onClick={handleCreate}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t(editing ? 'common.save' : 'dashboard.postMessage')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('messages.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500, mb: 1 }}>{deleting?.title}</DialogContentText>
          <DialogContentText>{t('messages.deleteBody')}</DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleting(null)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
