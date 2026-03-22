import { Router, Response } from 'express';
import { StandardsController } from '../controllers/standardsController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const ctrl = new StandardsController();

router.get('/categories', (req: AuthRequest, res: Response) => ctrl.getCategories(req, res));
router.get('/', (req: AuthRequest, res: Response) => ctrl.getStandards(req, res));
router.post('/suggest', authenticate, (req: AuthRequest, res: Response) => ctrl.suggestStandard(req, res));

export default router;
