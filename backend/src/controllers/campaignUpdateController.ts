import { Response } from 'express';
import { CampaignUpdateService } from '../services/campaignUpdateService';
import { AuthRequest } from '../types';

const service = new CampaignUpdateService();

export class CampaignUpdateController {
  async getUpdates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await service.getUpdates(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async addUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { content, title, source_url } = req.body;
      if (!content?.trim()) { res.status(400).json({ success: false, message: 'Content is required' }); return; }
      const data = await service.addUpdate(req.params.id, req.user.id, content.trim(), title?.trim(), source_url?.trim());
      res.status(201).json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg === 'Forbidden' ? 403 : 400;
      res.status(status).json({ success: false, message: msg });
    }
  }

  async getUpdateHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await service.getUpdateHistory(req.params.updateId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
    }
  }

  async editUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { content, title, source_url, reason } = req.body;
      if (!content?.trim()) { res.status(400).json({ success: false, message: 'Content is required' }); return; }
      const data = await service.editUpdate(
        req.params.id, req.params.updateId, req.user.id,
        { title: title?.trim(), content: content.trim(), source_url: source_url?.trim(), reason: reason?.trim() }
      );
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg === 'Forbidden' ? 403 : 400;
      res.status(status).json({ success: false, message: msg });
    }
  }

  async deleteUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.deleteUpdate(req.params.id, req.params.updateId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg === 'Forbidden' ? 403 : 400;
      res.status(status).json({ success: false, message: msg });
    }
  }

  async togglePin(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.togglePin(req.params.id, req.params.updateId, req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg === 'Forbidden' ? 403 : 400;
      res.status(status).json({ success: false, message: msg });
    }
  }

  async addOfficialResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      if (req.user.role !== 'institution') {
        res.status(403).json({ success: false, message: 'Yalnızca kurum hesapları resmi yanıt bırakabilir.' });
        return;
      }
      if (!req.user.entity_id) {
        res.status(403).json({ success: false, message: 'Hesabınıza bağlı bir kurum bulunamadı.' });
        return;
      }
      const { content, title, source_url } = req.body;
      if (!content?.trim()) { res.status(400).json({ success: false, message: 'İçerik zorunludur.' }); return; }
      const data = await service.addOfficialResponse(req.params.id, req.user.id, req.user.entity_id, content.trim(), title?.trim(), source_url?.trim());
      res.status(201).json({ success: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, message: msg });
    }
  }
}
