import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useLanguage } from '../i18n/LanguageContext';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const TEXT_PREVIEW_CHARS = 200_000;

type PreviewKind = 'image' | 'pdf' | 'text' | 'docx' | 'none';

function previewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain') return 'text';
  if (mimeType === DOCX) return 'docx';
  return 'none';
}

/**
 * Shows a file in the browser without downloading it to disk:
 * images and PDFs use the browser's own renderers (the PDF viewer brings zoom,
 * paging and search), text is shown as-is, Word (.docx) is rendered by
 * docx-preview (loaded only when needed). Other types get a "no preview" note.
 */
export default function FilePreview({ blob, mimeType, title }: { blob: Blob; mimeType: string; title: string }) {
  const kind = previewKind(mimeType);
  // The blob gets the stored (allow-listed) type, so the browser renders it as that type only.
  // Memoized so parent re-renders (e.g. typing a title) don't re-render the preview.
  const typed = useMemo(() => (blob.type === mimeType ? blob : new Blob([blob], { type: mimeType })), [blob, mimeType]);

  if (kind === 'image') return <ImagePreview blob={typed} title={title} />;
  if (kind === 'pdf') return <PdfPreview blob={typed} title={title} />;
  if (kind === 'text') return <TextPreview blob={typed} />;
  if (kind === 'docx') return <DocxPreview blob={typed} />;
  return <NoPreview />;
}

/** Points an element's src at an object URL for the blob, revoking it when done. */
function useObjectUrlSrc<T extends HTMLImageElement | HTMLIFrameElement>(blob: Blob) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return ref;
}

function ImagePreview({ blob, title }: { blob: Blob; title: string }) {
  const ref = useObjectUrlSrc<HTMLImageElement>(blob);
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box component="img" ref={ref} alt={title} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </Box>
  );
}

function PdfPreview({ blob, title }: { blob: Blob; title: string }) {
  const ref = useObjectUrlSrc<HTMLIFrameElement>(blob);
  return <Box component="iframe" ref={ref} title={title} sx={{ width: '100%', height: '100%', border: 0 }} />;
}

function TextPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    blob.text().then((value) => {
      if (!cancelled) setText(value.slice(0, TEXT_PREVIEW_CHARS));
    });
    return () => {
      cancelled = true;
    };
  }, [blob]);
  if (text === null) return <Loading />;
  return (
    <Box
      component="pre"
      sx={{ m: 0, p: 2, height: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.85rem', unicodeBidi: 'plaintext' }}
    >
      {text}
    </Box>
  );
}

function DocxPreview({ blob }: { blob: Blob }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    const target = container.current;
    import('docx-preview')
      .then(({ renderAsync }) => {
        if (cancelled || !target) return;
        return renderAsync(blob, target, undefined, { inWrapper: true, ignoreLastRenderedPageBreak: true });
      })
      .then(() => {
        if (!cancelled) setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });
    return () => {
      cancelled = true;
      if (target) target.innerHTML = '';
    };
  }, [blob]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', position: 'relative' }}>
      {state === 'loading' && <Loading />}
      {state === 'failed' && <NoPreview />}
      {/* docx-preview draws white "pages" on a gray backdrop, like Word */}
      <Box ref={container} sx={{ '& .docx-wrapper': { bgcolor: 'grey.300', py: 2 } }} />
    </Box>
  );
}

function Loading() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 120 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function NoPreview() {
  const { t } = useLanguage();
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 160, p: 3 }}>
      <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
      <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
        {t('docs.noPreview')}
      </Typography>
    </Stack>
  );
}
