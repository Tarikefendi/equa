import { Request, Response } from 'express';
import { EntityService } from '../services/entityService';
import { EntityMetricsService } from '../services/entityMetricsService';
import { EntityTransparencyService } from '../services/EntityTransparencyService';

const entityService = new EntityService();
const entityMetricsService = new EntityMetricsService();
const transparencyService = new EntityTransparencyService();

export class EntityController {
  async getMostActive(req: Request, res: Response): Promise<void> {
    try {
      const entities = await entityService.getMostActive(5);
      res.json({ success: true, data: entities });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Hata oluştu' });
    }
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const data = await entityService.getBySlug(slug);
      if (!data) { res.status(404).json({ success: false, message: 'Kurum bulunamadı' }); return; }
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Hata oluştu' });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = (req.query.q as string) || '';
      const entities = await entityService.search(q);
      res.json({ success: true, data: entities });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Arama başarısız' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, website, country, type } = req.body;
      if (!name?.trim()) {
        res.status(400).json({ success: false, message: 'Kurum adı zorunludur' });
        return;
      }
      const entity = await entityService.create({ name: name.trim(), description, website, country, type });
      res.status(201).json({ success: true, data: entity });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Kurum oluşturulamadı' });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const metrics = await entityMetricsService.getMetricsBySlug(slug);
      res.json({ success: true, data: metrics });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Metrikler alınamadı' });
    }
  }

  async getTransparencyScore(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const data = await transparencyService.getScoreBySlug(slug);
      res.json({ success: true, data });
    } catch (error: any) {
      const status = error.message === 'Kurum bulunamadı' ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}
