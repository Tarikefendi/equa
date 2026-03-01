import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import db from '../config/database';
import logger from '../config/logger';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id) as any;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed',
      });
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireModerator = requireRole(['moderator', 'admin']);
