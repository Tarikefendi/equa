import { Response } from 'express';
import { validationResult } from 'express-validator';
import { CampaignService } from '../services/campaignService';
import { CampaignImpactService } from '../services/CampaignImpactService';
import { CampaignMomentumService } from '../services/CampaignMomentumService';
import { MilestoneService } from '../services/milestoneService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const campaignService = new CampaignService();
const campaignImpactService = new CampaignImpactService();
const momentumService = new CampaignMomentumService();
const milestoneService = new MilestoneService();

export class CampaignController {
  async createCampaign(req: AuthRequest, res: Response): Promise<void> {
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

      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const deviceFingerprint = req.body.deviceFingerprint;

      const campaign = await campaignService.createCampaign(req.user.id, {
        ...req.body,
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign,
      });
    } catch (error) {
      logger.error('Create campaign error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
      const requiresPhone = errorMessage.includes('Phone verification required');
      
      res.status(400).json({
        success: false,
        message: errorMessage,
        requiresPhoneVerification: requiresPhone
      });
    }
  }

  async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { 
        status, 
        category, 
        search, 
        target_type,
        date_from,
        date_to,
        min_signatures,
        max_signatures,
        sort_by,
        sort_order,
        limit,
        offset
      } = req.query;

      const result = await campaignService.getCampaigns({
        status: status as string,
        category: category as string,
        search: search as string,
        target_type: target_type as string,
        date_from: date_from as string,
        date_to: date_to as string,
        min_signatures: min_signatures ? parseInt(min_signatures as string) : undefined,
        max_signatures: max_signatures ? parseInt(max_signatures as string) : undefined,
        sort_by: sort_by as string,
        sort_order: sort_order as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Campaigns retrieved successfully',
        data: result.campaigns,
        pagination: {
          total: result.totalCount,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.limit < result.totalCount,
        },
      });
    } catch (error) {
      logger.error('Get campaigns error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get campaigns',
      });
    }
  }

  async getCampaignById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await campaignService.getCampaignById(id, req.user?.id);

      res.status(200).json({
        success: true,
        message: 'Campaign retrieved successfully',
        data: campaign,
      });
    } catch (error) {
      logger.error('Get campaign error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Campaign not found',
      });
    }
  }

  async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const campaign = await campaignService.updateCampaign(id, req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign,
      });
    } catch (error) {
      logger.error('Update campaign error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update campaign',
      });
    }
  }

  async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await campaignService.deleteCampaign(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete campaign error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete campaign',
      });
    }
  }

  async getMyCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const campaigns = await campaignService.getMyCampaigns(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Your campaigns retrieved successfully',
        data: campaigns,
      });
    } catch (error) {
      logger.error('Get my campaigns error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get campaigns',
      });
    }
  }

  async sendToOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await campaignService.sendToOrganization(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error('Send to organization error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send to organization',
      });
    }
  }

  async searchCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        res.json({ success: true, data: [] });
        return;
      }
      const sort = (req.query.sort as string) || 'relevant';
      const results = await campaignService.searchCampaigns(q, sort);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Arama başarısız' });
    }
  }

  async getTrendingCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const campaigns = await campaignService.getTrendingCampaigns();
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      logger.error('Get trending campaigns error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get trending campaigns',
      });
    }
  }

  async getEmailHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const history = await campaignService.getEmailHistory(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Email history retrieved successfully',
        data: history,
      });
    } catch (error) {
      logger.error('Get email history error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get email history',
      });
    }
  }


    async updateStatus(req: AuthRequest, res: Response): Promise<void> {
      try {
        if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
        const data = await campaignService.updateStatus(req.params.id, req.user.id, req.body.status, req.body.description);
        res.json({ success: true, data });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error';
        const status = msg === 'Forbidden' ? 403 : 400;
        res.status(status).json({ success: false, message: msg });
      }
    }

    async getStatusHistory(req: AuthRequest, res: Response): Promise<void> {
      try {
        const data = await campaignService.getStatusHistory(req.params.id);
        res.json({ success: true, data });
      } catch (error) {
        res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error' });
      }
    }

  async recordView(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
      const ua = (req.headers['user-agent'] || '').substring(0, 64);
      const userId = req.user?.id;
      // Logged-in: user ID, anonymous: ip+ua hash
      const viewerKey = userId ? `u:${userId}` : `ip:${ip}:${ua}`;
      const result = await campaignService.recordView(id, viewerKey);
      res.json({ success: true, counted: result.counted });
    } catch {
      res.json({ success: true, counted: false });
    }
  }

  async getSimilarCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        res.json({ success: true, data: [] });
        return;
      }
      const campaigns = await campaignService.getSimilarCampaigns(query.trim());
      res.json({ success: true, data: campaigns });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getImpact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await campaignImpactService.getImpactMetrics(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async getMomentum(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await momentumService.getMomentum(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await milestoneService.getMilestoneInfo(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}