import { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLanguage } from '../i18n/LanguageContext';

/** How long to hold before the code shows, and how long it stays visible. */
const HOLD_MS = 700;
const SHOW_MS = 6000;

/**
 * The building's door code, hidden until held: people show their screens around, and the code is the
 * one thing in the app a stranger could use. While shown, tapping the digits copies them.
 */
export default function DoorCode({ code }: { code: string }) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const frame = useRef(0);
  const hideTimer = useRef(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const startHold = () => {
    if (shown) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / HOLD_MS);
      setProgress(p);
      if (p < 1) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      setShown(true);
      hideTimer.current = window.setTimeout(() => {
        setShown(false);
        setCopied(false);
        setProgress(0);
      }, SHOW_MS);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    cancelAnimationFrame(frame.current);
    if (!shown) setProgress(0);
  };

  const copy = () => {
    if (!shown) return;
    navigator.clipboard?.writeText(code).then(() => setCopied(true), () => {});
  };

  const holdKeys = (e: React.KeyboardEvent, down: boolean) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (down && !e.repeat) startHold();
    if (!down) cancelHold();
  };

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
      <ButtonBase
        onClick={copy}
        disabled={!shown}
        aria-label={shown ? t('door.tapToCopy') : undefined}
        sx={{ borderRadius: 1, px: 0.5 }}
      >
        <Typography
          dir="ltr"
          sx={{
            fontWeight: 600,
            fontSize: '1.75rem',
            letterSpacing: '0.18em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
            color: shown ? 'text.primary' : 'text.secondary',
          }}
        >
          {shown ? code : '•'.repeat(code.length)}
        </Typography>
      </ButtonBase>
      <ButtonBase
        aria-label={t('door.hold')}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={(e) => holdKeys(e, true)}
        onKeyUp={(e) => holdKeys(e, false)}
        onContextMenu={(e) => e.preventDefault()}
        sx={(theme) => ({
          width: 44,
          height: 44,
          borderRadius: '50%',
          flex: 'none',
          touchAction: 'none',
          background: `conic-gradient(${theme.vars?.palette.primary.main ?? theme.palette.primary.main} ${progress * 100}%, rgba(${theme.vars?.palette.text.primaryChannel ?? '0 0 0'} / 0.14) 0)`,
        })}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'grid',
            placeItems: 'center',
            color: 'text.primary',
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
      </ButtonBase>
      <Typography variant="body2" color="text.secondary" aria-live="polite">
        {copied ? t('door.copied') : shown ? t('door.tapToCopy') : t('door.hold')}
      </Typography>
    </Stack>
  );
}
