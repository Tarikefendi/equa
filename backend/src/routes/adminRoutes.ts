import { Router, Response } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const adminController = new AdminController();

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

export default router;
