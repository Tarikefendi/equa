import { Response } from 'express';
import { AuthRequest } from '../types';
import { CampaignReportService } from '../services/campaignReportService';

const svc = new CampaignReportService();

export class CampaignReportController {
  async report(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { reason, description } = req.body;
      if (!reason) { res.status(400).json({ success: false, message: 'Sebep zorunludur.' }); return; }
      const data = await svc.report(req.params.id, req.user.id, reason, description);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getPendingReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await svc.getPendingReports();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!['reviewed', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Geçersiz durum.' }); return;
      }
      const data = await svc.updateStatus(req.params.reportId, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getUserReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.json({ success: true, data: null }); return; }
      const data = await svc.getUserReport(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
