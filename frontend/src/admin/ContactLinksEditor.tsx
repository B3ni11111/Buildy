import { useState } from 'react';
import { Alert, Chip, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import { useLanguage } from '../i18n/LanguageContext';
import { ContactLinkInput, ContactType } from '../types/building';

const TYPES: ContactType[] = ['whatsapp', 'phone', 'email'];
const ICON: Record<ContactType, typeof WhatsAppIcon> = {
  whatsapp: WhatsAppIcon,
  phone: PhoneOutlinedIcon,
  email: MailOutlinedIcon,
};
const PLACEHOLDER: Record<ContactType, string> = {
  whatsapp: 'https://chat.whatsapp.com/…',
  phone: '050-123-4567',
  email: 'committee@example.com',
};

/** Same rules the backend enforces — checked here too so mistakes show before saving. */
function isValidContactLink({ type, link }: ContactLinkInput) {
  const value = link.trim();
  if (type === 'whatsapp') return /^https:\/\/\S+$/.test(value);
  if (type === 'phone') return /^\+?[\d\s\-()]{6,20}$/.test(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

interface ContactLinksEditorProps<T extends ContactLinkInput> {
  links: T[];
  /** Resolve to add; reject (or throw) to show the error. */
  onAdd: (link: ContactLinkInput) => Promise<void> | void;
  onRemove: (link: T, index: number) => void;
}

/** List of contact links with remove buttons, plus a type + value row to add one. */
export default function ContactLinksEditor<T extends ContactLinkInput>({ links, onAdd, onRemove }: ContactLinksEditorProps<T>) {
  const { t } = useLanguage();
  const [type, setType] = useState<ContactType>('whatsapp');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const input = { type, link: link.trim() };
    if (!isValidContactLink(input)) {
      setError(t('admin.contactError'));
      return;
    }
    try {
      await onAdd(input);
      setLink('');
      setError(null);
    } catch {
      setError(t('admin.contactError'));
    }
  };

  return (
    <Stack spacing={1.5}>
      {links.length > 0 && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {links.map((item, index) => {
            const Icon = ICON[item.type];
            return (
              <Chip
                key={`${item.type}-${item.link}-${index}`}
                icon={<Icon />}
                label={item.link}
                onDelete={() => onRemove(item, index)}
                deleteIcon={<CloseIcon />}
                variant="outlined"
                sx={{ direction: 'ltr', maxWidth: '100%' }}
              />
            );
          })}
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          select
          size="small"
          value={type}
          onChange={(e) => setType(e.target.value as ContactType)}
          sx={{ minWidth: 130 }}
        >
          {TYPES.map((option) => (
            <MenuItem key={option} value={option}>
              {t(`contactType.${option}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          fullWidth
          placeholder={PLACEHOLDER[type]}
          aria-label={t('admin.contactLinkLabel')}
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          slotProps={{ htmlInput: { dir: 'ltr' } }}
        />
        <IconButton onClick={handleAdd} disabled={!link.trim()} color="primary" aria-label={t('admin.addContact')}>
          <AddIcon />
        </IconButton>
      </Stack>
      {error && <Alert severity="warning">{error}</Alert>}
    </Stack>
  );
}
