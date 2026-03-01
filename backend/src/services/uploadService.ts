import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

interface CreateUploadDTO {
  user_id: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  url: string;
}

export class UploadService {
  async saveUpload(data: CreateUploadDTO) {
    const uploadId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO uploads (id, user_id, entity_type, entity_id, filename, original_name, mimetype, size, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uploadId,
      data.user_id,
      data.entity_type,
      data.entity_id,
      data.filename,
      data.original_name,
      data.mimetype,
      data.size,
      data.url
    );

    logger.info(`Upload saved: ${uploadId} by user ${data.user_id}`);

    return db.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId);
  }

  async getUploadsByEntity(entityType: string, entityId: string) {
    const uploads = db.prepare(
      'SELECT * FROM uploads WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
    ).all(entityType, entityId);

    return uploads;
  }

  async deleteUpload(uploadId: string, userId: string) {
    const upload = db.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId) as any;

    if (!upload) {
      throw new Error('Upload not found');
    }

    if (upload.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own uploads');
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', upload.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.prepare('DELETE FROM uploads WHERE id = ?').run(uploadId);

    logger.info(`Upload deleted: ${uploadId}`);

    return { message: 'Upload deleted successfully' };
  }

  async getUserUploads(userId: string) {
    const uploads = db.prepare(
      'SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    return uploads;
  }
}
