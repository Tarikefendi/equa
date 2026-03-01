import { Router, Response } from 'express';
import { CampaignController } from '../controllers/campaignController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { AuthRequest } from '../types';

const router = Router();
const campaignController = new CampaignController();

const createCampaignValidation = [
  body('title').isLength({ min: 5, max: 500 }).withMessage('Title must be 5-500 characters'),
  body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('target_entity').notEmpty().withMessage('Target entity is required'),
  body('target_type').isIn(['company', 'brand', 'government']).withMessage('Invalid target type'),
  body('category').notEmpty().withMessage('Category is required'),
];

// Public routes
router.get('/', (req: AuthRequest, res: Response) => campaignController.getCampaigns(req, res));
router.get('/:id', (req: AuthRequest, res: Response) => campaignController.getCampaignById(req, res));

// Protected routes
router.post('/', authenticate, createCampaignValidation, (req: AuthRequest, res: Response) => 
  campaignController.createCampaign(req, res)
);

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.updateCampaign(req, res)
);

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.deleteCampaign(req, res)
);

router.get('/my/campaigns', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.getMyCampaigns(req, res)
);

router.post('/:id/send-to-organization', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.sendToOrganization(req, res)
);

router.get('/:id/email-history', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.getEmailHistory(req, res)
);

export default router;