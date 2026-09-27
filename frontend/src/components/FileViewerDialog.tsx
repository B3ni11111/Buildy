import { useState } from 'react';
import { Alert, Box, CircularProgress, Dialog, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import FilePreview from './FilePreview';
import { useLanguage } from '../i18n/LanguageContext';

interface FileViewerDialogProps {
  open: boolean;
  title: string;
  mimeType: string;
  /** null while the file is still loading. */
  blob: Blob | null;
  error?: string | null;
  onDownload: () => void;
  onClose: () => void;
}

/** Pop-up viewer for a document, with a full-screen toggle and a download button. */
export default function FileViewerDialog({ open, title, mimeType, blob, error, onDownload, onClose }: FileViewerDialogProps) {
  const { t } = useLanguage();
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, height: fullScreen ? '100%' : '85vh' } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1, px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
          {title}
        </Typography>
        <Tooltip title={t(fullScreen ? 'docs.exitFullscreen' : 'docs.fullscreen')}>
          <IconButton onClick={() => setFullScreen((v) => !v)}>
            {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('docs.download')}>
          <span>
            <IconButton onClick={onDownload} disabled={!blob}>
              <DownloadOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('docs.close')}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, bgcolor: 'background.default' }}>
        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : blob ? (
          <FilePreview blob={blob} mimeType={mimeType} title={title} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
