import { Router, Request, Response } from 'express';
import { EntityController } from '../controllers/entityController';
import { EntityFollowController } from '../controllers/entityFollowController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const entityController = new EntityController();
const entityFollowController = new EntityFollowController();

router.get('/most-active', (req: Request, res: Response) => entityController.getMostActive(req, res));
router.get('/search', (req: Request, res: Response) => entityController.search(req, res));

router.get('/:slug/follow', optionalAuth, (req, res) => entityFollowController.getStatus(req as any, res));
router.post('/:slug/follow', authenticate, (req, res) => entityFollowController.follow(req as any, res));
router.delete('/:slug/follow', authenticate, (req, res) => entityFollowController.unfollow(req as any, res));

router.get('/:slug/metrics', (req: Request, res: Response) => entityController.getMetrics(req, res));
router.get('/:slug/transparency-score', (req: Request, res: Response) => entityController.getTransparencyScore(req, res));

router.get('/:slug', (req: Request, res: Response) => entityController.getBySlug(req, res));
router.post('/', (req: Request, res: Response) => entityController.create(req, res));

export default router;
