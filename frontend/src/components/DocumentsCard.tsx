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
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import FilePreview from './FilePreview';
import FileViewerDialog from './FileViewerDialog';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiError, api } from '../utils/api';
import { CurrentUser, Doc } from '../types/building';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

function fileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return PictureAsPdfOutlinedIcon;
  if (mimeType.startsWith('image/')) return ImageOutlinedIcon;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return TableChartOutlinedIcon;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return SlideshowOutlinedIcon;
  return DescriptionOutlinedIcon;
}

/** Saves a blob to the user's device under the given file name. */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
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
    setFile(null);
    setTitle('');
    setUploadError(null);
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    setUploadError(picked.size > MAX_UPLOAD_BYTES ? t('docs.tooLarge') : null);
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!file || file.size > MAX_UPLOAD_BYTES || uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      const doc = await api.uploadDoc(idToken, buildingId, file, title.trim());
      setDocs((prev) => [doc, ...(prev ?? [])]);
      closeUpload();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setUploadError(t(status === 413 ? 'docs.tooLarge' : status === 400 ? 'docs.badType' : 'docs.uploadError'));
    } finally {
      setUploading(false);
    }
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
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                    sx={{ px: 0.5, py: 1.25, pr: canModify(doc) ? 10 : 0.5, borderRadius: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                      <Icon />
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

      <Dialog open={uploadOpen} onClose={closeUpload} maxWidth={file ? 'sm' : 'xs'} fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('docs.uploadTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Box
              onClick={() => fileInput.current?.click()}
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
              <Typography sx={{ fontWeight: 500 }}>{file ? file.name : t('docs.chooseFile')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {file ? formatSize(file.size) : t('docs.fileHint')}
              </Typography>
            </Box>
            {file && (
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
                <FilePreview blob={file} mimeType={file.type} title={file.name} />
              </Box>
            )}
            <TextField fullWidth label={t('docs.titleLabel')} value={title} onChange={(e) => setTitle(e.target.value)} />
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeUpload} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={!file || file.size > MAX_UPLOAD_BYTES || uploading}
            onClick={handleUpload}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('docs.upload')}
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
