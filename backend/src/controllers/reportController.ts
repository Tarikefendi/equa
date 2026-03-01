import { Response } from 'express';
import { validationResult } from 'express-validator';
import { ReportService } from '../services/reportService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const reportService = new ReportService();

export class ReportController {
  async createReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const report = await reportService.createReport({
        reporter_id: req.user.id,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: report,
      });
    } catch (error) {
      logger.error('Create report error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create report',
      });
    }
  }

  async getReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, entity_type } = req.query;

      const reports = await reportService.getReports({
        status: status as string,
        entity_type: entity_type as string,
      });

      res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: reports,
      });
    } catch (error) {
      logger.error('Get reports error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get reports',
      });
    }
  }

  async getReportById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const report = await reportService.getReportById(id);

      res.status(200).json({
        success: true,
        message: 'Report retrieved successfully',
        data: report,
      });
    } catch (error) {
      logger.error('Get report error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Report not found',
      });
    }
  }

  async updateReportStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['reviewing', 'resolved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
        return;
      }

      const report = await reportService.updateReportStatus(id, req.user.id, status);

      res.status(200).json({
        success: true,
        message: 'Report status updated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('Update report status error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update report status',
      });
    }
  }

  async getUserReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const reports = await reportService.getUserReports(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User reports retrieved successfully',
        data: reports,
      });
    } catch (error) {
      logger.error('Get user reports error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user reports',
      });
    }
  }
}
