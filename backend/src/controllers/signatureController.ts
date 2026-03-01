import { Response } from 'express';
import { SignatureService } from '../services/signatureService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const signatureService = new SignatureService();

export class SignatureController {
  async addSignature(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaign_id, message, is_anonymous, deviceFingerprint } = req.body;

      if (!campaign_id) {
        res.status(400).json({
          success: false,
          message: 'campaign_id is required',
        });
        return;
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

      const result = await signatureService.addSignature(req.user.id, {
        campaign_id,
        message,
        is_anonymous,
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: { id: result.id },
      });
    } catch (error) {
      logger.error('Add signature error:', error);
      
      // Check if phone verification is required
      const errorMessage = error instanceof Error ? error.message : 'Failed to add signature';
      const requiresPhone = errorMessage.includes('Phone verification required');
      
      res.status(400).json({
        success: false,
        message: errorMessage,
        requiresPhoneVerification: requiresPhone
      });
    }
  }

  async removeSignature(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;

      const result = await signatureService.removeSignature(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Remove signature error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove signature',
      });
    }
  }

  async getCampaignSignatures(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const signatures = await signatureService.getCampaignSignatures(campaignId);

      res.status(200).json({
        success: true,
        message: 'Signatures retrieved successfully',
        data: signatures,
      });
    } catch (error) {
      logger.error('Get campaign signatures error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get signatures',
      });
    }
  }

  async getSignatureCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const result = await signatureService.getSignatureCount(campaignId);

      res.status(200).json({
        success: true,
        message: 'Signature count retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Get signature count error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get signature count',
      });
    }
  }

  async getUserSignature(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;

      const signature = await signatureService.getUserSignature(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'User signature retrieved successfully',
        data: signature,
      });
    } catch (error) {
      logger.error('Get user signature error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user signature',
      });
    }
  }

  async getUserSignatures(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const signatures = await signatureService.getUserSignatures(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User signatures retrieved successfully',
        data: signatures,
      });
    } catch (error) {
      logger.error('Get user signatures error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user signatures',
      });
    }
  }
}
