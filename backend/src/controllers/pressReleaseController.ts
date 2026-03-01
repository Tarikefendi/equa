import { Response } from 'express';
import { PressReleaseService } from '../services/pressReleaseService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const pressReleaseService = new PressReleaseService();

export class PressReleaseController {
  async generatePressRelease(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;

      const result = await pressReleaseService.createPressRelease(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Press release generated successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Generate press release error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate press release',
      });
    }
  }
}
