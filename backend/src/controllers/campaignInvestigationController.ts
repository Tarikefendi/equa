import { Response } from 'express';
import { AuthRequest } from '../types';
import { CampaignInvestigationService } from '../services/CampaignInvestigationService';

const service = new CampaignInvestigationService();

export class CampaignInvestigationController {
  async toggle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { investigation_mode } = req.body;
      if (typeof investigation_mode !== 'boolean') {
        return res.status(400).json({ success: false, message: 'investigation_mode boolean olmalı' });
      }
      const result = await service.toggleInvestigationMode(id, req.user!.id, investigation_mode);
      res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.message === 'Forbidden' ? 403 : err.message === 'Kampanya bulunamadı' ? 404 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  async summary(req: AuthRequest, res: Response) {
    try {
      const result = await service.getInvestigationSummary(req.params.id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
