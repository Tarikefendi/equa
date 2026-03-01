import { Response } from 'express';
import { validationResult } from 'express-validator';
import { VoteService } from '../services/voteService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const voteService = new VoteService();

export class VoteController {
  async castVote(req: AuthRequest, res: Response): Promise<void> {
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

      const result = await voteService.castVote(req.user.id, req.body);

      res.status(result.is_new ? 201 : 200).json({
        success: true,
        message: result.message,
        data: {
          vote_choice: result.vote_choice,
          is_new: result.is_new,
        },
      });
    } catch (error) {
      logger.error('Cast vote error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cast vote',
      });
    }
  }

  async removeVote(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;

      const result = await voteService.removeVote(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Remove vote error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove vote',
      });
    }
  }

  async getVoteStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const stats = await voteService.getVoteStats(campaignId);

      res.status(200).json({
        success: true,
        message: 'Vote statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Get vote stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get vote statistics',
      });
    }
  }

  async getUserVote(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;

      const vote = await voteService.getUserVote(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: vote ? 'User vote retrieved successfully' : 'User has not voted',
        data: vote,
      });
    } catch (error) {
      logger.error('Get user vote error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user vote',
      });
    }
  }

  async getCampaignVoters(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const voters = await voteService.getCampaignVoters(campaignId);

      res.status(200).json({
        success: true,
        message: 'Campaign voters retrieved successfully',
        data: voters,
      });
    } catch (error) {
      logger.error('Get campaign voters error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get campaign voters',
      });
    }
  }
}
