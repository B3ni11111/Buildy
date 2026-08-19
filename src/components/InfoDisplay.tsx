import { Avatar, Box, Button, Card, CardContent, Container, Divider, Stack, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface InfoDisplayProps {
  onReset: () => void;
}

function InfoDisplay({ onReset }: InfoDisplayProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Georgia","Iowan Old Style","Palatino Linotype",serif',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  User Information
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Your profile details
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar
                  src={user.picture}
                  alt={user.name || 'User'}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '3px solid',
                    borderColor: 'primary.main',
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.email || 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {user.email || 'N/A'}
                  </Typography>
                </Box>

                {user.email_verified !== undefined && (
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Email Verified
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: user.email_verified ? 'success.main' : 'error.main',
                        fontWeight: 600,
                      }}
                    >
                      {user.email_verified ? '✓ Verified' : '✗ Not Verified'}
                    </Typography>
                  </Box>
                )}

                {user.sub && (
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      User ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {user.sub}
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Divider />

              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onReset}
                sx={{ textTransform: 'none' }}
              >
                Back to Home
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default InfoDisplay;
