import { useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useLanguage } from '../i18n/LanguageContext';

const KNOB = 44;
const PAD = 4;

/**
 * Paying is a gesture, not a click: slide the knob to the end to pay. It can't happen by accident, and
 * it mirrors in Hebrew and Arabic. Keyboard users press Enter or Space on the knob instead.
 */
export default function SlideToPay({
  label,
  disabled,
  onConfirm,
}: {
  label: string;
  disabled?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const { t, dir } = useLanguage();
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; max: number } | null>(null);
  const [x, setX] = useState(0);
  const [settling, setSettling] = useState(false);
  const [sending, setSending] = useState(false);
  const sign = dir === 'rtl' ? -1 : 1;
  const max = () => (track.current ? track.current.clientWidth - KNOB - PAD * 2 : 0);

  const confirm = async () => {
    setX(max());
    setSending(true);
    try {
      await onConfirm();
    } finally {
      // On success the parent usually replaces this control; otherwise go back to the start.
      setSending(false);
      setSettling(true);
      setX(0);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || sending) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, max: max() };
    setSettling(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setX(Math.max(0, Math.min(d.max, (e.clientX - d.startX) * sign)));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (x >= d.max * 0.9) void confirm();
    else {
      setSettling(true);
      setX(0);
    }
  };

  const progress = max() ? x / max() : 0;

  return (
    <Box
      ref={track}
      sx={{
        position: 'relative',
        height: KNOB + PAD * 2,
        borderRadius: `${(KNOB + PAD * 2) / 2}px`,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        overflow: 'hidden',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Typography
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontWeight: 600,
          paddingInlineStart: `${KNOB + PAD}px`,
          opacity: sending ? 1 : 1 - progress * 0.8,
          pointerEvents: 'none',
        }}
      >
        {sending ? t('payments.sending') : label}
      </Typography>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || sending}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !sending) {
            e.preventDefault();
            void confirm();
          }
        }}
        sx={{
          position: 'absolute',
          top: PAD,
          insetInlineStart: PAD,
          width: KNOB,
          height: KNOB,
          borderRadius: '50%',
          bgcolor: 'primary.contrastText',
          color: 'primary.main',
          display: 'grid',
          placeItems: 'center',
          cursor: disabled ? 'default' : 'grab',
          touchAction: 'none',
          transform: `translateX(${x * sign}px)`,
          transition: settling ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.contrastText', outlineOffset: 2 },
          '&:active': { cursor: 'grabbing' },
        }}
      >
        {sending ? (
          <CircularProgress size={20} thickness={5} sx={{ color: 'primary.main' }} />
        ) : (
          <ArrowForwardIcon fontSize="small" sx={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }} />
        )}
      </Box>
    </Box>
  );
}
