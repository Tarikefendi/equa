import { Response } from 'express';
import { AuthRequest } from '../types';
import { EntityFollowService } from '../services/entityFollowService';
import { EntityService } from '../services/entityService';

const svc = new EntityFollowService();
const entitySvc = new EntityService();

export class EntityFollowController {
  async getStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const entity = await entitySvc.getBySlug(req.params.slug);
      if (!entity) { res.status(404).json({ success: false, message: 'Kurum bulunamadı' }); return; }

      const count = await svc.getCount(entity.entity.id);
      const isFollowing = req.user
        ? (await svc.getStatus(entity.entity.id, req.user.id)).isFollowing
        : false;

      res.json({ success: true, data: { isFollowing, followerCount: count } });
    } catch {
      res.status(400).json({ success: false, message: 'Hata' });
    }
  }

  async follow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Giriş gerekli' }); return; }
      const entity = await entitySvc.getBySlug(req.params.slug);
      if (!entity) { res.status(404).json({ success: false, message: 'Kurum bulunamadı' }); return; }
      const result = await svc.follow(entity.entity.id, req.user.id);
      res.json({ success: true, data: result });
    } catch {
      res.status(400).json({ success: false, message: 'Hata' });
    }
  }

  async unfollow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Giriş gerekli' }); return; }
      const entity = await entitySvc.getBySlug(req.params.slug);
      if (!entity) { res.status(404).json({ success: false, message: 'Kurum bulunamadı' }); return; }
      const result = await svc.unfollow(entity.entity.id, req.user.id);
      res.json({ success: true, data: result });
    } catch {
      res.status(400).json({ success: false, message: 'Hata' });
    }
  }
}
