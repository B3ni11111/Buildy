import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';

/** Same limits as the backend's upload allow-list (documents and issue files). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const FILE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

export function fileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return PictureAsPdfOutlinedIcon;
  if (mimeType.startsWith('image/')) return ImageOutlinedIcon;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return TableChartOutlinedIcon;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return SlideshowOutlinedIcon;
  return DescriptionOutlinedIcon;
}

/** Saves a blob to the user's device under the given file name. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
