import { Response } from 'express';
import { UploadService } from '../services/uploadService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const uploadService = new UploadService();

export class UploadController {
  async uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const { entity_type, entity_id } = req.body;

      if (!entity_type || !entity_id) {
        res.status(400).json({
          success: false,
          message: 'entity_type and entity_id are required',
        });
        return;
      }

      const url = `/uploads/${req.file.filename}`;

      const upload = await uploadService.saveUpload({
        user_id: req.user.id,
        entity_type,
        entity_id,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: upload,
      });
    } catch (error) {
      logger.error('Upload file error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file',
      });
    }
  }

  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const { entity_type, entity_id } = req.body;

      if (!entity_type || !entity_id) {
        res.status(400).json({
          success: false,
          message: 'entity_type and entity_id are required',
        });
        return;
      }

      const url = `/uploads/${req.file.filename}`;

      const upload = await uploadService.saveUpload({
        user_id: req.user.id,
        entity_type,
        entity_id,
        filename: req.file.filename,
        original_name: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: upload,
      });
    } catch (error) {
      logger.error('Upload image error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload image',
      });
    }
  }

  async uploadMultipleImages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
        return;
      }

      const { entity_type, entity_id } = req.body;

      if (!entity_type || !entity_id) {
        res.status(400).json({
          success: false,
          message: 'entity_type and entity_id are required',
        });
        return;
      }

      const uploads = [];

      for (const file of req.files) {
        const url = `/uploads/${file.filename}`;

        const upload = await uploadService.saveUpload({
          user_id: req.user.id,
          entity_type,
          entity_id,
          filename: file.filename,
          original_name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url,
        });

        uploads.push(upload);
      }

      res.status(201).json({
        success: true,
        message: 'Images uploaded successfully',
        data: uploads,
      });
    } catch (error) {
      logger.error('Upload multiple images error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload images',
      });
    }
  }

  async getEntityUploads(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      const uploads = await uploadService.getUploadsByEntity(entityType, entityId);

      res.status(200).json({
        success: true,
        message: 'Uploads retrieved successfully',
        data: uploads,
      });
    } catch (error) {
      logger.error('Get entity uploads error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get uploads',
      });
    }
  }

  async deleteUpload(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await uploadService.deleteUpload(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete upload error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete upload',
      });
    }
  }

  async getUserUploads(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const uploads = await uploadService.getUserUploads(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User uploads retrieved successfully',
        data: uploads,
      });
    } catch (error) {
      logger.error('Get user uploads error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get uploads',
      });
    }
  }
}
