import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import FilePreview from './FilePreview';
import { Thumb } from './IssueThumbs';
import FileViewerDialog from './FileViewerDialog';
import { FILE_ACCEPT, MAX_UPLOAD_BYTES, fileIcon, formatSize, saveBlob } from '../utils/files';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { CurrentUser, Doc } from '../types/building';

interface Pending {
  key: number;
  file: File;
  title: string;
  error: string | null;
}

interface DocumentsCardProps {
  buildingId: string;
  idToken: string;
  currentUser: CurrentUser | null;
  /** Controlled so the "Upload a document" quick action can open the dialog. */
  uploadOpen: boolean;
  onUploadOpenChange: (open: boolean) => void;
}

export default function DocumentsCard({
  buildingId,
  idToken,
  currentUser,
  uploadOpen,
  onUploadOpenChange,
}: DocumentsCardProps) {
  const { t, language } = useLanguage();
  const [docs, setDocs] = useState<Doc[] | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  // Several documents can be uploaded at once: each has its own title and shows its own error.
  const [pending, setPending] = useState<Pending[]>([]);
  const [previewKey, setPreviewKey] = useState<number | null>(null);
  const nextKey = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [renaming, setRenaming] = useState<Doc | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // The document open in the viewer; its file is fetched into memory only while viewing.
  const [viewing, setViewing] = useState<{ doc: Doc; blob: Blob | null; error: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listDocs(idToken, buildingId)
      .then((list) => {
        if (!cancelled) setDocs(list);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId]);

  const canModify = (doc: Doc) => !!currentUser && (currentUser.isAdmin || doc.uploader?.id === currentUser.id);
  const dateFormat = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' });

  const closeUpload = () => {
    onUploadOpenChange(false);
    setPending([]);
    setPreviewKey(null);
    setUploadError(null);
  };

  const pickFiles = (picked: File[]) => {
    if (picked.length === 0) return;
    const added = picked.map((file) => ({
      key: nextKey.current++,
      file,
      title: file.name.replace(/\.[^.]+$/, ''),
      error: file.size > MAX_UPLOAD_BYTES ? t('docs.tooLarge') : null,
    }));
    setPending((current) => [...current, ...added]);
    setPreviewKey((current) => current ?? added[0].key);
    setUploadError(null);
  };

  const removePending = (key: number) => {
    setPending((current) => current.filter((item) => item.key !== key));
    setPreviewKey((current) => (current === key ? null : current));
  };

  const previewing = pending.find((item) => item.key === previewKey);
  const uploadable = pending.filter((item) => item.file.size <= MAX_UPLOAD_BYTES);

  const handleUpload = async () => {
    if (uploadable.length === 0 || uploading) return;
    setUploading(true);
    setUploadError(null);
    // One after the other; the ones that go through leave the list, the others stay with their error.
    const failed = new Map<number, string>();
    for (const item of uploadable) {
      try {
        const doc = await api.uploadDoc(idToken, buildingId, item.file, item.title.trim());
        setDocs((prev) => [doc, ...(prev ?? [])]);
        setPending((current) => current.filter((p) => p.key !== item.key));
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        failed.set(item.key, t(status === 413 ? 'docs.tooLarge' : status === 400 ? 'docs.badType' : 'docs.uploadError'));
      }
    }
    setUploading(false);
    if (failed.size === 0) closeUpload();
    else setPending((current) => current.map((item) => (failed.has(item.key) ? { ...item, error: failed.get(item.key)! } : item)));
  };

  const openViewer = async (doc: Doc) => {
    setViewing({ doc, blob: null, error: null });
    try {
      const blob = await api.downloadDoc(idToken, doc.id);
      // Ignore a late response if the user already closed or switched documents.
      setViewing((current) => (current?.doc.id === doc.id ? { doc, blob, error: null } : current));
    } catch {
      setViewing((current) =>
        current?.doc.id === doc.id ? { doc, blob: null, error: t('docs.downloadError') } : current,
      );
    }
  };

  const handleRename = async () => {
    if (!renaming || !newTitle.trim()) return;
    setActionError(null);
    try {
      const updated = await api.renameDoc(idToken, renaming.id, newTitle.trim());
      setDocs((prev) => (prev ?? []).map((d) => (d.id === updated.id ? updated : d)));
      setRenaming(null);
    } catch {
      setActionError(t('docs.actionError'));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionError(null);
    try {
      await api.deleteDoc(idToken, deleting.id);
      setDocs((prev) => (prev ?? []).filter((d) => d.id !== deleting.id));
      setDeleting(null);
    } catch {
      setActionError(t('docs.actionError'));
    }
  };

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack className="tile-header" direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('docs.title')}
            </Typography>
            <Button
              startIcon={<FileUploadOutlinedIcon />}
              onClick={() => onUploadOpenChange(true)}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {t('docs.upload')}
            </Button>
          </Stack>

          {docs && docs.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {t('docs.empty')}
            </Typography>
          )}
          <List disablePadding>
            {(docs ?? []).map((doc, idx) => {
              const Icon = fileIcon(doc.mimeType);
              return (
                <ListItem
                  key={doc.id}
                  className="doc-row"
                  disablePadding
                  sx={{ borderTop: idx === 0 ? 'none' : '1px solid', borderColor: 'divider' }}
                  secondaryAction={
                    canModify(doc) && (
                      <Stack direction="row">
                        <IconButton
                          size="small"
                          aria-label={t('docs.renameTitle')}
                          onClick={() => {
                            setActionError(null);
                            setNewTitle(doc.title);
                            setRenaming(doc);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={t('common.delete')}
                          onClick={() => {
                            setActionError(null);
                            setDeleting(doc);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )
                  }
                >
                  <ListItemButton
                    onClick={() => openViewer(doc)}
                    sx={{ px: 0.5, py: 1.25, paddingInlineEnd: canModify(doc) ? 'var(--doc-actions, 80px)' : '4px', borderRadius: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 52, color: 'primary.main' }}>
                      {doc.mimeType.startsWith('image/') ? (
                        <Thumb idToken={idToken} id={doc.id} name={doc.title} size={40} kind="doc" />
                      ) : (
                        <Icon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.title}
                      secondary={[doc.uploader ? doc.uploader.name : t('common.formerResident'), dateFormat.format(new Date(doc.uploadDate)), formatSize(doc.sizeBytes)]
                        .filter(Boolean)
                        .join(' · ')}
                      slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onClose={closeUpload} maxWidth={pending.length ? 'sm' : 'xs'} fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('docs.uploadTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <input
              ref={fileInput}
              type="file"
              accept={FILE_ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                pickFiles([...(e.target.files ?? [])]);
                e.target.value = '';
              }}
            />
            <Box
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFiles([...e.dataTransfer.files]);
              }}
              sx={{
                border: '1.5px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                p: 2.5,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <FileUploadOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 500 }}>{pending.length ? t('docs.addMore') : t('docs.chooseFiles')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('docs.fileHint')}
              </Typography>
            </Box>
            {pending.length > 0 && (
              <Stack spacing={1}>
                {pending.map((item) => {
                  const Icon = fileIcon(item.file.type);
                  return (
                    <Box
                      key={item.key}
                      sx={{
                        border: '1px solid',
                        borderColor: item.error ? 'error.main' : previewKey === item.key ? 'primary.main' : 'divider',
                        borderRadius: 3,
                        p: 1,
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => setPreviewKey(previewKey === item.key ? null : item.key)} aria-label={item.file.name}>
                          <Icon fontSize="small" color="primary" />
                        </IconButton>
                        <TextField
                          size="small"
                          fullWidth
                          label={t('docs.titleLabel')}
                          value={item.title}
                          onChange={(e) => setPending((current) => current.map((p) => (p.key === item.key ? { ...p, title: e.target.value } : p)))}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatSize(item.file.size)}
                        </Typography>
                        <IconButton size="small" onClick={() => removePending(item.key)} aria-label={t('common.delete')} disabled={uploading}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      {item.error && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, ml: 1 }}>
                          {item.file.name} — {item.error}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
            {previewing && (
              <Box
                sx={{
                  height: 280,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                }}
              >
                <FilePreview blob={previewing.file} mimeType={previewing.file.type} title={previewing.file.name} />
              </Box>
            )}
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeUpload} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={uploadable.length === 0 || uploading}
            onClick={handleUpload}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {uploadable.length > 1 ? t('docs.uploadCount', { count: uploadable.length }) : t('docs.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      <FileViewerDialog
        open={viewing !== null}
        title={viewing?.doc.title ?? ''}
        mimeType={viewing?.doc.mimeType ?? ''}
        blob={viewing?.blob ?? null}
        error={viewing?.error}
        onDownload={() => viewing?.blob && saveBlob(viewing.blob, viewing.doc.fileName)}
        onClose={() => setViewing(null)}
      />

      <Dialog open={renaming !== null} onClose={() => setRenaming(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('docs.renameTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            sx={{ mt: 1 }}
          />
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenaming(null)} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" disabled={!newTitle.trim()} onClick={handleRename} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('docs.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500, mb: 1 }}>{deleting?.title}</DialogContentText>
          <DialogContentText>{t('docs.deleteBody')}</DialogContentText>
          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
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
