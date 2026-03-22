import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { LawyerService } from '../services/LawyerService';

const router = Router();
const lawyerService = new LawyerService();

// Get legal status for a campaign
router.get('/campaigns/:campaignId/legal-status', async (req, res: Response) => {
  try {
    const data = await lawyerService.getLegalStatus(req.params.campaignId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Campaign owner requests legal support
router.post('/campaigns/:campaignId/legal-request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await lawyerService.requestLegalSupport(req.params.campaignId, req.user!.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get open legal requests (lawyer panel)
router.get('/legal-requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await lawyerService.getOpenRequests();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Lawyer applies to a request
router.post('/legal-requests/:requestId/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lawyer = await lawyerService.getLawyerByUserId(req.user!.id);
    if (!lawyer) return res.status(403).json({ success: false, message: 'You are not registered as a lawyer' });
    if (!lawyer.is_verified) return res.status(403).json({ success: false, message: 'Your lawyer profile is pending verification' });
    const data = await lawyerService.applyToRequest(req.params.requestId, lawyer.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Register as lawyer
router.post('/lawyers/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, expertise, bar_number, city, bio } = req.body;
    if (!full_name || !expertise) return res.status(400).json({ success: false, message: 'full_name and expertise are required' });
    const data = await lawyerService.registerLawyer(req.user!.id, { full_name, expertise, bar_number, city, bio });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get own lawyer profile
router.get('/lawyers/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await lawyerService.getLawyerByUserId(req.user!.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: get pending lawyers
router.get('/admin/lawyers/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const data = await lawyerService.getPendingLawyers();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: verify lawyer
router.post('/admin/lawyers/:lawyerId/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const data = await lawyerService.verifyLawyer(req.params.lawyerId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: reject lawyer
router.post('/admin/lawyers/:lawyerId/reject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const data = await lawyerService.rejectLawyer(req.params.lawyerId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
