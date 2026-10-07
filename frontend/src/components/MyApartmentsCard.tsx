import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { Building } from '../types/building';

/**
 * The user's own apartments in this building — read-only: apartments, owner/renter and
 * payment details are technical info set by building management.
 */
export default function MyApartmentsCard({ building }: { building: Building }) {
  const { t } = useLanguage();
  const { myApartments, myRequest } = building;

  return (
    <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('myUnit.title')}
        </Typography>

        {myApartments.length === 0 && !myRequest && (
          <Typography variant="body2" color="text.secondary">
            {t('myUnit.empty')}
          </Typography>
        )}

        {myRequest && (
          <Chip
            color="warning"
            variant="outlined"
            sx={{ mb: 1.5, height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
            label={t('myUnit.pending', {
              details: [
                myRequest.apartment != null ? t('members.apartment', { apartment: myRequest.apartment }) : null,
                myRequest.relationType ? t(`relationType.${myRequest.relationType}`) : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })}
          />
        )}

        <Stack spacing={1.5}>
          {myApartments.map((apartment) => {
            const rows: { labelKey: TranslationKey; value: string | null }[] = [
              { labelKey: 'myUnit.floor', value: apartment.floor?.toString() ?? null },
              { labelKey: 'myUnit.sqrm', value: apartment.sqrm?.toString() ?? null },
              {
                labelKey: 'myUnit.paymentMethod',
                value: apartment.paymentMethod ? t(`paymentMethod.${apartment.paymentMethod}`) : null,
              },
              {
                labelKey: 'myUnit.monthlyPayment',
                value: apartment.monthlyPayment != null ? `₪${apartment.monthlyPayment}` : null,
              },
            ];
            return (
              <Box key={apartment.number} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 1.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                  <HomeOutlinedIcon fontSize="small" color="primary" />
                  <Typography sx={{ fontWeight: 600 }}>{t('members.apartment', { apartment: apartment.number })}</Typography>
                  <Chip size="small" label={t(`relationType.${apartment.relationType}`)} />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.5 }}>
                  {rows
                    .filter((row) => row.value !== null)
                    .map(({ labelKey, value }) => (
                      <Box key={labelKey}>
                        <Typography variant="caption" color="text.secondary">
                          {t(labelKey)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {value}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            );
          })}
        </Stack>

        {(myApartments.length > 0 || myRequest) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {t('myUnit.setByManagement')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
