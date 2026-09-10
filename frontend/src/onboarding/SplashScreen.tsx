import { Box, Button, Typography } from '@mui/material';
import { GradientWave } from '../components/GradientWave';

interface SplashScreenProps {
  onContinue: () => void;
}

export default function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GradientWave
        colors={['#3A5A40', '#6B8F71', '#5B6660', '#6B8F71', '#3A5A40', '#2A4030']}
        isPlaying={true}
        darkenTop={true}
        shadowPower={6}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
            fontWeight: 600,
            color: 'white',
            mb: 2,
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          buildy
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            mb: 4,
            fontWeight: 400,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          Your building at your fingertips
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onContinue}
          sx={{
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            px: 5,
            py: 1.5,
            bgcolor: '#F7F6F3',
            color: '#3A5A40',
            '&:hover': {
              bgcolor: '#FFFFFF',
            },
          }}
        >
          Get Started
        </Button>
      </Box>
    </Box>
  );
}
