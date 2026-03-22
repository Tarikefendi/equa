import { Response } from 'express';
import { AuthRequest } from '../types';
import { CampaignShareService } from '../services/campaignShareService';

const svc = new CampaignShareService();

export class CampaignShareController {
  async recordShare(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { platform = 'other' } = req.body;
      const data = await svc.recordShare(req.params.id, platform, req.user?.id);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getShareStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await svc.getShareStats(req.params.id);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
