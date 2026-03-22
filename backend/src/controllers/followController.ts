import { Response } from 'express';
import { FollowService } from '../services/followService';
import { AuthRequest } from '../types';

const followService = new FollowService();

export class FollowController {
  async follow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const result = await followService.follow(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Hata' });
    }
  }

  async unfollow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const result = await followService.unfollow(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Hata' });
    }
  }

  async getStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const count = await followService.getFollowerCount(req.params.id);
      const following = req.user ? await followService.isFollowing(req.params.id, req.user.id) : false;
      res.json({ success: true, data: { following, count } });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Hata' });
    }
  }
}
