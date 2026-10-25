import { useEffect, useState } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { api } from '../utils/api';

// Pictures are fetched with the auth header (a plain <img src> can't send it), once per picture.
const cache = new Map<string, Promise<string>>();
const urlFor = (idToken: string, id: string, kind: 'issue' | 'doc') => {
  const key = kind + id;
  let url = cache.get(key);
  if (!url) {
    const load = kind === 'doc' ? api.downloadDoc : api.downloadIssueFile;
    url = load(idToken, id).then((blob) => URL.createObjectURL(blob));
    url.catch(() => cache.delete(key));
    cache.set(key, url);
  }
  return url;
};

/** A small square preview of a picture attached to an issue. Clicking it calls `onOpen`. */
export function Thumb({
  idToken,
  id,
  name,
  size,
  kind = 'issue',
  onOpen,
}: {
  idToken: string;
  id: string;
  name: string;
  size: number;
  /** Whose file it is: an issue's picture or a building document. */
  kind?: 'issue' | 'doc';
  onOpen?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    urlFor(idToken, id, kind)
      .then((url) => !cancelled && setSrc(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [idToken, id, kind]);

  return (
    <ButtonBase
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
      disabled={!onOpen}
      aria-label={name}
      sx={{
        width: size,
        height: size,
        borderRadius: '2px',
        overflow: 'hidden',
        flexShrink: 0,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {src && <Box component="img" src={src} alt={name} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </ButtonBase>
  );
}
