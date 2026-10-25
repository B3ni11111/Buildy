import { Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

const pop = keyframes`
  from { transform: scale(0); }
  to { transform: scale(1); }
`;
const draw = keyframes`
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
`;
const rise = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

/** The moment after paying: the circle pops in, the check draws itself, then the thank-you rises. */
export default function PaidCheck({ label }: { label: string }) {
  return (
    <Stack
      direction="row"
      role="status"
      sx={{
        alignItems: 'center',
        gap: 1.25,
        '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
          animation: `${pop} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          aria-hidden
          sx={{ width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', strokeDasharray: 24, animation: `${draw} 0.45s ease 0.25s both` }}
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </Box>
      </Box>
      <Typography sx={{ fontWeight: 600, animation: `${rise} 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both` }}>{label}</Typography>
    </Stack>
  );
}
