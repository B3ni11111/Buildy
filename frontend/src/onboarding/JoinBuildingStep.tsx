import { useEffect, useState } from 'react';
import { Alert, Box, ButtonBase, CircularProgress, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StepShell from './StepShell';
import ConfirmCheck from './ConfirmCheck';
import { Building } from '../types/building';
import { api, ApiError } from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';

interface JoinBuildingStepProps {
  idToken: string;
  onJoined: (building: Building) => void;
}

export default function JoinBuildingStep({ idToken, onJoined }: JoinBuildingStepProps) {
  const { t } = useLanguage();
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBuilding, setConfirmedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listBuildings(idToken)
      .then((list) => {
        if (!cancelled) setBuildings(list);
      })
      .catch(() => {
        if (!cancelled) setBuildings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken]);

  const handleContinue = async () => {
    if (!selectedId || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const building = await api.joinBuilding(idToken, selectedId, password);
      setConfirmedBuilding(building);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? t('joinBuilding.wrongPassword')
          : t('joinBuilding.genericError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper' }}>
          {confirmedBuilding ? (
            <ConfirmCheck message={t('joinBuilding.confirm')} onDone={() => onJoined(confirmedBuilding)} />
          ) : (
            <StepShell
              title={t('joinBuilding.title')}
              subtitle={t('joinBuilding.subtitle')}
              onContinue={handleContinue}
              continueDisabled={!selectedId || !password || submitting}
              continueLabel={t('common.finish')}
            >
              {buildings === null ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {buildings.map((building) => {
                    const isSelected = selectedId === building.id;
                    return (
                      <ButtonBase
                        key={building.id}
                        onClick={() => {
                          setSelectedId(building.id);
                          setError(null);
                        }}
                        sx={{
                          justifyContent: 'flex-start',
                          gap: 1.5,
                          px: 2.25,
                          py: 1.75,
                          borderRadius: 3,
                          border: '1.5px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: (theme) => (isSelected ? alpha(theme.palette.primary.main, 0.07) : 'background.paper'),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: (theme) => (isSelected ? theme.palette.primary.main : theme.palette.primary.light),
                            bgcolor: (theme) => alpha(theme.palette.primary.main, isSelected ? 0.08 : 0.04),
                          },
                        }}
                      >
                        <ApartmentOutlinedIcon
                          sx={{
                            color: isSelected ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.2s ease',
                            fontSize: '1.5rem',
                          }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{building.name}</Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.25, fontSize: '0.8rem', fontWeight: 400, lineHeight: 1.4 }}
                          >
                            {building.address}
                          </Typography>
                        </Box>
                        {isSelected && <CheckCircleIcon sx={{ color: 'primary.main' }} fontSize="small" />}
                      </ButtonBase>
                    );
                  })}
                </Stack>
              )}

              {selectedId && (
                <TextField
                  fullWidth
                  type="password"
                  autoFocus
                  label={t('joinBuilding.passwordLabel')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  sx={{ mt: 2.5 }}
                />
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </StepShell>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
