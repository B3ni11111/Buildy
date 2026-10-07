import { useEffect, useState } from 'react';
import { Avatar, type SxProps, type Theme } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Picture } from '../types/building';

// Uploaded pictures need the auth header, so they're fetched once per (user, version)
// and shared as object URLs for the rest of the session.
const cache = new Map<string, Promise<string | null>>();

function loadUploaded(idToken: string, userId: string, version: string) {
  const key = `${userId}:${version}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = api
      .avatarBlob(idToken, userId, version)
      .then((blob) => URL.createObjectURL(blob))
      .catch(() => null);
    cache.set(key, entry);
  }
  return entry;
}

const initials = (name: string | null | undefined) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

interface UserAvatarProps {
  userId: string;
  name: string | null | undefined;
  picture: Picture | null | undefined;
  size?: number;
  sx?: SxProps<Theme>;
}

/** Profile picture: uploaded one → Google photo → initials. */
export default function UserAvatar({ userId, name, picture, size = 36, sx }: UserAvatarProps) {
  const { tokens } = useAuth();
  const idToken = tokens?.id_token;
  const version = picture?.version ?? null;
  const [uploaded, setUploaded] = useState<{ key: string; url: string | null } | null>(null);
  const key = version ? `${userId}:${version}` : null;

  useEffect(() => {
    if (!key || !version || !idToken) return;
    let cancelled = false;
    loadUploaded(idToken, userId, version).then((url) => {
      if (!cancelled) setUploaded({ key, url });
    });
    return () => {
      cancelled = true;
    };
  }, [idToken, userId, version, key]);

  const uploadedUrl = uploaded && uploaded.key === key ? uploaded.url : null;
  const src = uploadedUrl ?? picture?.google ?? undefined;

  return (
    <Avatar
      src={src}
      alt={name ?? ''}
      // Google photo URLs refuse some referrers.
      slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
      sx={{ width: size, height: size, fontSize: size * 0.38, ...sx }}
    >
      {initials(name)}
    </Avatar>
  );
}
