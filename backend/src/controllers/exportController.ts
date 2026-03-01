import { Response } from 'express';
import { ExportService } from '../services/exportService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const exportService = new ExportService();

export class ExportController {
  async exportUserData(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const data = await exportService.exportUserData(req.user.id);

      const format = req.query.format || 'json';

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user.id}.json"`);
        res.status(200).json(data);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid format. Supported: json',
        });
      }
    } catch (error) {
      logger.error('Export user data error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export user data',
      });
    }
  }

  async exportCampaignData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const data = await exportService.exportCampaignData(campaignId);

      const format = req.query.format || 'json';

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}.json"`);
        res.status(200).json(data);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid format. Supported: json',
        });
      }
    } catch (error) {
      logger.error('Export campaign data error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export campaign data',
      });
    }
  }

  async exportCampaignsCSV(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, category } = req.query;

      const csv = await exportService.exportCampaignsToCSV({
        status: status as string,
        category: category as string,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="campaigns.csv"');
      res.status(200).send(csv);
    } catch (error) {
      logger.error('Export campaigns CSV error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export campaigns',
      });
    }
  }

  async exportVotesCSV(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const csv = await exportService.exportVotesToCSV(campaignId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}-votes.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      logger.error('Export votes CSV error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export votes',
      });
    }
  }
}
