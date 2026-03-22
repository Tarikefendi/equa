import { Response } from 'express';
import { AuthRequest } from '../types';
import { CampaignClosureService } from '../services/campaignClosureService';
import pool from '../config/database';

const closureService = new CampaignClosureService();

export class CampaignClosureController {
  async resolveCampaign(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { reason } = req.body;
      const result = await closureService.resolveCampaign(id, userId, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.message.includes('Sadece') ? 403 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  async closeCampaign(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await closureService.closeCampaign(id, userId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.message.includes('Sadece') ? 403 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  async getVictory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'SELECT status, victory_at, victory_support_count FROM campaigns WHERE id = $1',
        [id]
      );
      const campaign = result.rows[0];
      if (!campaign) { res.status(404).json({ success: false, message: 'Kampanya bulunamadı' }); return; }

      if (campaign.status !== 'resolved' || !campaign.victory_at) {
        res.json({ success: true, data: { is_victory: false } });
        return;
      }

      res.json({
        success: true,
        data: {
          is_victory: true,
          victory_at: campaign.victory_at,
          supporters: campaign.victory_support_count || 0,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
