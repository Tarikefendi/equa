import { Router, Response, Request } from 'express';
import { OrganizationResponseController } from '../controllers/organizationResponseController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { AuthRequest } from '../types';

const router = Router();
const organizationResponseController = new OrganizationResponseController();

const createResponseValidation = [
  body('campaign_id').notEmpty().withMessage('Campaign ID is required'),
  body('organization_name').notEmpty().withMessage('Organization name is required'),
  body('organization_email').isEmail().withMessage('Valid email is required'),
  body('response_text').isLength({ min: 20 }).withMessage('Response must be at least 20 characters'),
  body('response_type').isIn(['official', 'statement', 'action_taken']).withMessage('Invalid response type'),
];

// Public routes
router.post('/', createResponseValidation, (req: Request, res: Response) => 
  organizationResponseController.createResponse(req, res)
);

router.get('/campaign/:campaignId', (req: Request, res: Response) => 
  organizationResponseController.getCampaignResponses(req, res)
);

// Admin routes
router.put('/:id/verify', authenticate, (req: AuthRequest, res: Response) => 
  organizationResponseController.verifyResponse(req, res)
);

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => 
  organizationResponseController.deleteResponse(req, res)
);

export default router;
