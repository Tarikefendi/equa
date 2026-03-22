import { Response } from 'express';
import { EvidenceService } from '../services/evidenceService';
import { AuthRequest } from '../types';

const service = new EvidenceService();

export class EvidenceController {
  async getEvidence(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await service.getEvidence(req.params.campaignId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async getPendingEvidence(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.getPendingEvidence(req.params.campaignId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(msg === 'Forbidden' ? 403 : 400).json({ success: false, message: msg });
    }
  }

  async addEvidence(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { type, title, description, url, file_path, credibility_type } = req.body;
      if (!type || !title?.trim()) {
        res.status(400).json({ success: false, message: 'type ve title zorunludur.' });
        return;
      }
      const data = await service.addEvidence(req.params.campaignId, req.user.id, {
        type, title: title.trim(), description, url, file_path, credibility_type
      });
      res.status(201).json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(msg === 'Forbidden' ? 403 : 400).json({ success: false, message: msg });
    }
  }

  async updateEvidenceStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Geçersiz durum. approved veya rejected olmalı.' });
        return;
      }
      const data = await service.updateEvidenceStatus(req.params.evidenceId, req.user.id, status);
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(msg === 'Forbidden' ? 403 : 400).json({ success: false, message: msg });
    }
  }

  async deleteEvidence(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.deleteEvidence(req.params.campaignId, req.params.evidenceId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(msg === 'Forbidden' ? 403 : 400).json({ success: false, message: msg });
    }
  }
}
