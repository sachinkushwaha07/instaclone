import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { raw, Router } from 'express';
import { HttpError, asyncHandler } from '../../middleware/error.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

export const mediaRouter = Router();
export const mediaUploadsDirectory = path.resolve(process.cwd(), 'uploads');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
const extensionForType: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm',
};

// Local development equivalent of an object-store presigned upload. The UI
// keeps the same two-step contract it will use with S3/R2 in production.
mediaRouter.post('/media/presign', requireAuth, asyncHandler(async (req, res) => {
  const { fileName, contentType } = req.body as { fileName?: unknown; contentType?: unknown };
  if (typeof fileName !== 'string' || typeof contentType !== 'string' || !allowedTypes.has(contentType)) {
    throw new HttpError(400, 'Please select a JPG, PNG, WebP, GIF, MP4, or WebM file.');
  }
  const key = `${randomUUID()}${extensionForType[contentType]}`;
  res.json({ uploadUrl: `/api/media/upload/${key}`, key });
}));

mediaRouter.put('/media/upload/:key', requireAuth, raw({ type: '*/*', limit: '25mb' }), asyncHandler(async (req, res) => {
  const key = req.params['key'];
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm)$/.test(key)) throw new HttpError(400, 'Invalid upload key.');
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw new HttpError(400, 'Upload file is empty.');
  await mkdir(mediaUploadsDirectory, { recursive: true });
  await writeFile(path.join(mediaUploadsDirectory, key), req.body);
  res.status(204).end();
}));
