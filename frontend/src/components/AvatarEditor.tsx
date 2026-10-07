import { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import Cropper, { type Area } from 'react-easy-crop';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import UserAvatar from './UserAvatar';
import { useLanguage } from '../i18n/LanguageContext';
import type { Picture } from '../types/building';

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const CROP_DIAMETER = 240;

/**
 * A picture change that isn't saved yet — the profile's own Save applies it, Cancel drops it.
 * `upload` carries the cropped image; `remove` goes back to the Google photo / initials.
 */
export type StagedPicture = { kind: 'upload'; file: File; previewUrl: string } | { kind: 'remove' } | null;

/** Crops the chosen area into a square image file (the avatar is shown as a circle). */
async function cropToFile(src: string, area: Area): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('crop failed'))), 'image/jpeg', 0.9),
  );
  return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
}

/** Round crop step: the circle shows exactly what's saved; the rest is dimmed and blurred. */
function PictureCropDialog({
  source,
  onCancel,
  onDone,
}: {
  source: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const { t } = useLanguage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!area) return;
    setBusy(true);
    try {
      onDone(await cropToFile(source, area));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('picture.cropTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', height: 320, borderRadius: 3, overflow: 'hidden', bgcolor: 'grey.900' }}>
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            cropSize={{ width: CROP_DIAMETER, height: CROP_DIAMETER }}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => setArea(pixels)}
            style={{ cropAreaStyle: { border: '2px solid rgba(255,255,255,0.9)', color: 'rgba(0,0,0,0.35)' } }}
          />
          {/* Blur everything outside the circle (the circle itself stays sharp). */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              maskImage: `radial-gradient(circle ${CROP_DIAMETER / 2}px at center, transparent ${CROP_DIAMETER / 2 - 1}px, #000 ${CROP_DIAMETER / 2}px)`,
              WebkitMaskImage: `radial-gradient(circle ${CROP_DIAMETER / 2}px at center, transparent ${CROP_DIAMETER / 2 - 1}px, #000 ${CROP_DIAMETER / 2}px)`,
            }}
          />
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(_e, value) => setZoom(value as number)}
            aria-label={t('picture.zoom')}
          />
          <ZoomInIcon fontSize="small" color="action" />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {t('picture.cropHint')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} sx={{ textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" disabled={!area || busy} onClick={save} sx={{ textTransform: 'none', fontWeight: 600 }}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface AvatarEditorProps {
  userId: string;
  name: string | null | undefined;
  /** The saved picture. */
  picture: Picture;
  /** The unsaved change, if any (owned by the parent so its Save/Cancel decide). */
  staged: StagedPicture;
  onStage: (staged: StagedPicture) => void;
  size?: number;
  /** Error message shown by the parent (e.g. file too large). */
  onError?: (message: string) => void;
}

/**
 * Avatar with a + badge (no uploaded picture) or a pencil (has one). The badge opens
 * "Upload file" / "Remove picture"; uploads go through the crop step. Nothing is saved here.
 */
export default function AvatarEditor({ userId, name, picture, staged, onStage, size = 64, onError }: AvatarEditorProps) {
  const { t } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);

  // Release the chosen file's temporary URL once the crop step closes.
  // (The staged preview URL belongs to the parent, which releases it on Save/Cancel.)
  useEffect(() => {
    if (!cropSource) return;
    return () => URL.revokeObjectURL(cropSource);
  }, [cropSource]);
  const stagedUrl = staged?.kind === 'upload' ? staged.previewUrl : null;

  const hasUploaded = staged ? staged.kind === 'upload' : !!picture.version;
  // What the avatar shows right now: the staged change wins over the saved picture.
  const shownPicture: Picture = staged?.kind === 'remove' ? { google: picture.google, version: null } : picture;

  const pickFile = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = ''; // so picking the same file again still fires
    if (!file) return;
    if (!file.type.startsWith('image/')) return onError?.(t('picture.notImage'));
    if (file.size > MAX_SOURCE_BYTES) return onError?.(t('settings.pictureTooLarge'));
    setCropSource(URL.createObjectURL(file));
  };

  return (
    <>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <IconButton
            size="small"
            aria-label={t(hasUploaded ? 'picture.edit' : 'picture.add')}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 26,
              height: 26,
              border: '2px solid',
              borderColor: 'background.paper',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {hasUploaded ? <EditIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        }
      >
        {stagedUrl ? (
          <Avatar src={stagedUrl} alt={name ?? ''} sx={{ width: size, height: size, border: '3px solid', borderColor: 'primary.main' }} />
        ) : (
          <UserAvatar
            userId={userId}
            name={name}
            picture={shownPicture}
            size={size}
            sx={{ border: '3px solid', borderColor: 'primary.main' }}
          />
        )}
      </Badge>

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            fileInput.current?.click();
          }}
        >
          <ListItemIcon>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('picture.upload')} />
        </MenuItem>
        {hasUploaded && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onStage(picture.version ? { kind: 'remove' } : null);
            }}
          >
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('picture.remove')} />
          </MenuItem>
        )}
      </Menu>

      {cropSource && (
        <PictureCropDialog
          source={cropSource}
          onCancel={() => setCropSource(null)}
          onDone={(file) => {
            setCropSource(null);
            onStage({ kind: 'upload', file, previewUrl: URL.createObjectURL(file) });
          }}
        />
      )}
    </>
  );
}
