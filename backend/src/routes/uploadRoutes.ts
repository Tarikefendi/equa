import { Router, Response } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { uploadSingle, uploadMultiple, uploadFile } from '../config/upload';
import { AuthRequest } from '../types';

const router = Router();
const uploadController = new UploadController();

// Upload single file (any type)
router.post('/file', authenticate, uploadFile, (req: AuthRequest, res: Response) => uploadController.uploadFile(req, res));

// Upload single image
router.post('/image', authenticate, uploadSingle, (req: AuthRequest, res: Response) => uploadController.uploadImage(req, res));

// Upload multiple images
router.post('/images', authenticate, uploadMultiple, (req: AuthRequest, res: Response) => uploadController.uploadMultipleImages(req, res));

// Get uploads for an entity
router.get('/entity/:entityType/:entityId', (req: AuthRequest, res: Response) => uploadController.getEntityUploads(req, res));

// Delete upload
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => uploadController.deleteUpload(req, res));

// Get user's uploads
router.get('/my-uploads', authenticate, (req: AuthRequest, res: Response) => uploadController.getUserUploads(req, res));

export default router;
