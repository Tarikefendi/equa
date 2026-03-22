import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import pool from '../config/database';
import logger from '../config/logger';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await pool.query(
        'SELECT role, entity_id FROM users WHERE id = $1',
        [req.user.id]
      );
      const user = result.rows[0];

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        return;
      }

      // Attach role and entity_id to req.user for downstream use
      req.user.role = user.role;
      req.user.entity_id = user.entity_id || undefined;

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({ success: false, message: 'Authorization failed' });
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireModerator = requireRole(['moderator', 'admin']);
