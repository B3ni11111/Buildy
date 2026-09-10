import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import './onboarding.css';

interface ConfirmCheckProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

/**
 * A short, self-dismissing "saved" confirmation — a hand-drawn checkmark
 * followed by a message. Shown briefly after every onboarding step is
 * submitted, then hands control back to the flow via onDone.
 */
export default function ConfirmCheck({ message, onDone, duration = 2150 }: ConfirmCheckProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <Box
      sx={{
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Box
        component="svg"
        width={72}
        height={72}
        viewBox="0 0 72 72"
        fill="none"
        sx={{ color: 'primary.main' }}
      >
        <circle className="ob-check-circle" cx="36" cy="36" r="30" stroke="currentColor" />
        <path className="ob-check-path" d="M22 37.5L31.5 47L50 26" stroke="currentColor" />
      </Box>
      <Typography className="ob-check-text" variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
