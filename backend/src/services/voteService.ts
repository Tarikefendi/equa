import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

interface CreateVoteDTO {
  campaign_id: string;
  vote_choice: 'support' | 'oppose' | 'neutral';
}

export class VoteService {
  async castVote(userId: string, data: CreateVoteDTO) {
    // Check if campaign exists
    const campaign = db.prepare('SELECT id, status FROM campaigns WHERE id = ?').get(data.campaign_id) as any;
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Can only vote on active campaigns');
    }

    // Check if user already voted
    const existingVote = db.prepare(
      'SELECT id, vote_choice FROM votes WHERE campaign_id = ? AND user_id = ?'
    ).get(data.campaign_id, userId) as any;

    if (existingVote) {
      // Update existing vote
      db.prepare(
        'UPDATE votes SET vote_choice = ? WHERE id = ?'
      ).run(data.vote_choice, existingVote.id);

      logger.info(`Vote updated: ${existingVote.id} by user ${userId}`);

      return {
        message: 'Vote updated successfully',
        vote_choice: data.vote_choice,
        is_new: false,
      };
    }

    // Create new vote
    const voteId = randomBytes(16).toString('hex');
    const voteHash = randomBytes(32).toString('hex');

    db.prepare(
      `INSERT INTO votes (id, campaign_id, user_id, vote_choice, vote_hash)
       VALUES (?, ?, ?, ?, ?)`
    ).run(voteId, data.campaign_id, userId, data.vote_choice, voteHash);

    logger.info(`Vote created: ${voteId} by user ${userId}`);

    // Get campaign creator to send notification
    const campaignData = db.prepare(
      'SELECT creator_id FROM campaigns WHERE id = ?'
    ).get(data.campaign_id) as any;

    // Send notification to campaign creator (if not voting on own campaign)
    if (campaignData && campaignData.creator_id !== userId) {
      await notificationService.notifyNewVote(data.campaign_id, campaignData.creator_id);
    }

    return {
      message: 'Vote cast successfully',
      vote_choice: data.vote_choice,
      is_new: true,
    };
  }

  async removeVote(campaignId: string, userId: string) {
    const vote = db.prepare(
      'SELECT id FROM votes WHERE campaign_id = ? AND user_id = ?'
    ).get(campaignId, userId) as any;

    if (!vote) {
      throw new Error('Vote not found');
    }

    db.prepare('DELETE FROM votes WHERE id = ?').run(vote.id);

    logger.info(`Vote removed: ${vote.id}`);

    return { message: 'Vote removed successfully' };
  }

  async getVoteStats(campaignId: string) {
    const stats = db.prepare(
      `SELECT 
        vote_choice,
        COUNT(*) as count
       FROM votes
       WHERE campaign_id = ?
       GROUP BY vote_choice`
    ).all(campaignId) as any[];

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = ?'
    ).get(campaignId) as any;

    const result: any = {
      total: total.count,
      support: 0,
      oppose: 0,
      neutral: 0,
    };

    stats.forEach((stat) => {
      result[stat.vote_choice] = stat.count;
    });

    return result;
  }

  async getUserVote(campaignId: string, userId: string) {
    const vote = db.prepare(
      'SELECT vote_choice, created_at FROM votes WHERE campaign_id = ? AND user_id = ?'
    ).get(campaignId, userId) as any;

    if (!vote) {
      return null;
    }

    return vote;
  }

  async getCampaignVoters(campaignId: string) {
    const voters = db.prepare(
      `SELECT v.vote_choice, v.created_at, u.username, u.reputation_score
       FROM votes v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.campaign_id = ?
       ORDER BY v.created_at DESC`
    ).all(campaignId);

    return voters;
  }
}
