import { BadRequestException } from '@nestjs/common';
import { resolve, sep } from 'node:path';

/** Root folder for uploaded files (a Docker named volume in compose). */
export const uploadsDir = () => resolve(process.env.UPLOADS_DIR ?? 'uploads');

/** Absolute path for a storage key, refusing anything that escapes the uploads dir. */
export function uploadPath(key: string) {
  const root = uploadsDir();
  const path = resolve(root, key);
  if (!path.startsWith(root + sep)) throw new BadRequestException('Invalid file path');
  return path;
}

/** The subset of multer's file object we use (memory storage). */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
