import { Router, Response } from 'express';
import { SignatureController } from '../controllers/signatureController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const signatureController = new SignatureController();

// Add signature
router.post('/', authenticate, (req: AuthRequest, res: Response) => signatureController.addSignature(req, res));

// Remove signature
router.delete('/campaign/:campaignId', authenticate, (req: AuthRequest, res: Response) => signatureController.removeSignature(req, res));

// Get campaign signatures
router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) => signatureController.getCampaignSignatures(req, res));

// Get signature count
router.get('/campaign/:campaignId/count', (req: AuthRequest, res: Response) => signatureController.getSignatureCount(req, res));

// Get user's signature for a campaign
router.get('/campaign/:campaignId/my-signature', authenticate, (req: AuthRequest, res: Response) => signatureController.getUserSignature(req, res));

// Get all user's signatures
router.get('/my-signatures', authenticate, (req: AuthRequest, res: Response) => signatureController.getUserSignatures(req, res));

export default router;
