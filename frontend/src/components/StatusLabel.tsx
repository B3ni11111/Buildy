import { Box } from '@mui/material';

/** What a status means, whatever it is about (an issue, a payment). */
export type StatusTone = 'open' | 'progress' | 'done' | 'denied';

// Dots only: the word carries the meaning, so the label reads on any tile colour and without colour.
const DOT: Record<StatusTone, string> = {
  open: '#D49B1E',
  progress: '#3C8FC8',
  done: '#4F8A58',
  denied: '#C8524E',
};

/** A status as a small coloured dot and a word, with no background (it sits on coloured tiles). */
export default function StatusLabel({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: '0.8125rem',
        fontWeight: 500,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        color: 'text.primary',
      }}
    >
      <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: DOT[tone], flex: 'none' }} />
      {label}
    </Box>
  );
}
