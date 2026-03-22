import { Router, Response } from 'express';
import { AdminController } from '../controllers/adminController';
import { CampaignReportController } from '../controllers/campaignReportController';
import { StandardsController } from '../controllers/standardsController';
import { EvidenceModerationController } from '../controllers/evidenceModerationController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const adminController = new AdminController();
const reportController = new CampaignReportController();
const standardsController = new StandardsController();
const evidenceModerationController = new EvidenceModerationController();

// All admin routes require authentication and moderator/admin role
const moderatorAuth = [authenticate, requireRole(['moderator', 'admin'])];
const adminAuth = [authenticate, requireRole(['admin'])];

// Dashboard
router.get('/dashboard/stats', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getDashboardStats(req, res)
);

router.get('/dashboard/activity', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getRecentActivity(req, res)
);

router.get('/dashboard/health', adminAuth, (req: AuthRequest, res: Response) => 
  adminController.getSystemHealth(req, res)
);

// User Management
router.get('/users', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getAllUsers(req, res)
);

router.put('/users/:userId/role', adminAuth, (req: AuthRequest, res: Response) => 
  adminController.updateUserRole(req, res)
);

router.post('/users/:userId/ban', adminAuth, (req: AuthRequest, res: Response) => 
  adminController.banUser(req, res)
);

// Campaign Management
router.get('/campaigns/pending', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getPendingCampaigns(req, res)
);

router.post('/campaigns/:campaignId/approve', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.approveCampaign(req, res)
);

router.post('/campaigns/:campaignId/reject', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.rejectCampaign(req, res)
);

router.delete('/campaigns/:campaignId', adminAuth, (req: AuthRequest, res: Response) => 
  adminController.deleteCampaign(req, res)
);

// Report Management
router.get('/reports/pending', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getPendingReports(req, res)
);

router.put('/reports/:reportId/status', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.updateReportStatus(req, res)
);

// Campaign Report Management
router.get('/campaign-reports', moderatorAuth, (req: AuthRequest, res: Response) =>
  reportController.getPendingReports(req, res)
);

router.patch('/campaign-reports/:reportId', moderatorAuth, (req: AuthRequest, res: Response) =>
  reportController.updateStatus(req, res)
);

// Lawyer Management
router.get('/lawyers/pending', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.getPendingLawyers(req, res)
);

router.post('/lawyers/:lawyerId/verify', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.verifyLawyer(req, res)
);

router.post('/lawyers/:lawyerId/reject', moderatorAuth, (req: AuthRequest, res: Response) => 
  adminController.rejectLawyer(req, res)
);

// Entity Management
router.get('/entities', moderatorAuth, (req: AuthRequest, res: Response) =>
  adminController.getAllEntities(req, res)
);

router.post('/entities/:entityId/verify', moderatorAuth, (req: AuthRequest, res: Response) =>
  adminController.verifyEntity(req, res)
);

router.post('/entities/:entityId/unverify', moderatorAuth, (req: AuthRequest, res: Response) =>
  adminController.unverifyEntity(req, res)
);

router.post('/entities/:entityId/institution-account', adminAuth, (req: AuthRequest, res: Response) =>
  adminController.createInstitutionAccount(req, res)
);

// Standards Suggestion Management
router.get('/standard-suggestions', moderatorAuth, (req: AuthRequest, res: Response) =>
  standardsController.getSuggestions(req, res)
);

router.patch('/standard-suggestions/:id', moderatorAuth, (req: AuthRequest, res: Response) =>
  standardsController.reviewSuggestion(req, res)
);

// Flagged Evidence Management
router.get('/flagged-evidence', moderatorAuth, (req: AuthRequest, res: Response) =>
  evidenceModerationController.getFlagged(req, res)
);

export default router;
