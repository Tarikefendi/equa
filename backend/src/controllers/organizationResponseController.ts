import { Response, Request } from 'express';
import { validationResult } from 'express-validator';
import { OrganizationResponseService } from '../services/organizationResponseService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const organizationResponseService = new OrganizationResponseService();

export class OrganizationResponseController {
  async createResponse(req: Request, res: Response): Promise<void> {
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

      const result = await organizationResponseService.createResponse(req.body);

      res.status(201).json({
        success: true,
        message: result.message,
        data: { id: result.id },
      });
    } catch (error) {
      logger.error('Create response error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create response',
      });
    }
  }

  async getCampaignResponses(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const responses = await organizationResponseService.getCampaignResponses(campaignId);

      res.status(200).json({
        success: true,
        message: 'Responses retrieved successfully',
        data: responses,
      });
    } catch (error) {
      logger.error('Get responses error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get responses',
      });
    }
  }

  async verifyResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await organizationResponseService.verifyResponse(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Verify response error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify response',
      });
    }
  }

  async deleteResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await organizationResponseService.deleteResponse(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete response error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete response',
      });
    }
  }
}
