import { Router, Response } from 'express';
import { body } from 'express-validator';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { requireModerator } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const reportController = new ReportController();

// Create report
router.post(
  '/',
  authenticate,
  [
    body('entity_type').notEmpty().withMessage('Entity type is required'),
    body('entity_id').notEmpty().withMessage('Entity ID is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('description').optional().isString(),
  ],
  (req: AuthRequest, res: Response) => reportController.createReport(req, res)
);

// Get all reports (moderator only)
router.get('/', authenticate, requireModerator, (req: AuthRequest, res: Response) => reportController.getReports(req, res));

// Get report by ID (moderator only)
router.get('/:id', authenticate, requireModerator, (req: AuthRequest, res: Response) => reportController.getReportById(req, res));

// Update report status (moderator only)
router.put('/:id/status', authenticate, requireModerator, (req: AuthRequest, res: Response) => reportController.updateReportStatus(req, res));

// Get user's own reports
router.get('/my-reports', authenticate, (req: AuthRequest, res: Response) => reportController.getUserReports(req, res));

export default router;
