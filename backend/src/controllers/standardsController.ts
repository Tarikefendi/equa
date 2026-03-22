import { Response } from 'express';
import { StandardsService } from '../services/StandardsService';
import { AuthRequest } from '../types';

const svc = new StandardsService();

export class StandardsController {
  async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await svc.getCategories();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStandards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
      const data = await svc.getStandards(categoryId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async suggestStandard(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { title, description, category_id, source_url } = req.body;
      if (!title?.trim()) { res.status(400).json({ success: false, message: 'Title required' }); return; }
      const data = await svc.suggestStandard({
        title: title.trim(),
        description,
        category_id: category_id ? parseInt(category_id) : undefined,
        source_url,
        suggested_by: req.user.id,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSuggestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const data = await svc.getSuggestions(status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async reviewSuggestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status' });
        return;
      }
      const data = status === 'approved'
        ? await svc.approveSuggestion(id)
        : await svc.rejectSuggestion(id);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }
}
