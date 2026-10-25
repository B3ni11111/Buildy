import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Feedback form. For now nothing is stored — saving it (DB table + admin list) comes later.
 * `about` switches the title for the "want to see more widgets?" entry point.
 */
export default function FeedbackDialog({ about, onClose }: { about?: 'widgets'; onClose: () => void }) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{about === 'widgets' ? t('feedback.widgetTitle') : t('feedback.title')}</DialogTitle>
      <DialogContent>
        {sent ? (
          <Alert severity="success">{t('feedback.thanks')}</Alert>
        ) : (
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            sx={{ mt: 1 }}
            label={t('feedback.label')}
            helperText={t('feedback.hint')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        {!sent && (
          <Button variant="contained" disableElevation disabled={!text.trim()} onClick={() => setSent(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('feedback.send')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
