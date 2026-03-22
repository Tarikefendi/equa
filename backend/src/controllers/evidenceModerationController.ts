import { Response } from 'express';
import { EvidenceModerationService } from '../services/EvidenceModerationService';
import { AuthRequest } from '../types';

const svc = new EvidenceModerationService();

export class EvidenceModerationController {
  async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await svc.approveEvidence(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(e.message === 'Forbidden' ? 403 : 400).json({ success: false, message: e.message });
    }
  }

  async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await svc.rejectEvidence(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(e.message === 'Forbidden' ? 403 : 400).json({ success: false, message: e.message });
    }
  }

  async flag(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await svc.flagEvidence(req.params.id, req.user.id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async summary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await svc.getEvidenceSummary(req.params.campaignId);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getFlagged(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await svc.getFlaggedEvidence();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}
