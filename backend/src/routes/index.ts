import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import campaignRoutes from './campaignRoutes';
import voteRoutes from './voteRoutes';
import activityRoutes from './activityRoutes';
import uploadRoutes from './uploadRoutes';
import notificationRoutes from './notificationRoutes';
import reportRoutes from './reportRoutes';
import milestoneRoutes from './milestoneRoutes';
import analyticsRoutes from './analyticsRoutes';
import exportRoutes from './exportRoutes';
import signatureRoutes from './signatureRoutes';
import pressReleaseRoutes from './pressReleaseRoutes';
import organizationResponseRoutes from './organizationResponseRoutes';
import campaignStatusRoutes from './campaignStatusRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/votes', voteRoutes);
router.use('/activities', activityRoutes);
router.use('/uploads', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/export', exportRoutes);
router.use('/signatures', signatureRoutes);
router.use('/press-release', pressReleaseRoutes);
router.use('/organization-responses', organizationResponseRoutes);
router.use('/campaign-status', campaignStatusRoutes);
router.use('/admin', adminRoutes);

export default router;
