import pool from '../config/database';
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
    const campaignResult = await pool.query('SELECT id, status FROM campaigns WHERE id = $1', [data.campaign_id]);
    const campaign = campaignResult.rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'active') throw new Error('Can only vote on active campaigns');

    const existingResult = await pool.query(
      'SELECT id, vote_choice FROM votes WHERE campaign_id = $1 AND user_id = $2',
      [data.campaign_id, userId]
    );
    const existingVote = existingResult.rows[0];

    if (existingVote) {
      await pool.query('UPDATE votes SET vote_choice = $1 WHERE id = $2', [data.vote_choice, existingVote.id]);
      logger.info(`Vote updated: ${existingVote.id} by user ${userId}`);
      return { message: 'Vote updated successfully', vote_choice: data.vote_choice, is_new: false };
    }

    const voteId = randomBytes(16).toString('hex');
    const voteHash = randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO votes (id, campaign_id, user_id, vote_choice, vote_hash) VALUES ($1, $2, $3, $4, $5)`,
      [voteId, data.campaign_id, userId, data.vote_choice, voteHash]
    );

    logger.info(`Vote created: ${voteId} by user ${userId}`);

    const campaignDataResult = await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [data.campaign_id]);
    const campaignData = campaignDataResult.rows[0];

    if (campaignData && campaignData.creator_id !== userId) {
      await notificationService.notifyNewVote(data.campaign_id, campaignData.creator_id);
    }

    return { message: 'Vote cast successfully', vote_choice: data.vote_choice, is_new: true };
  }

  async removeVote(campaignId: string, userId: string) {
    const result = await pool.query(
      'SELECT id FROM votes WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    const vote = result.rows[0];

    if (!vote) throw new Error('Vote not found');

    await pool.query('DELETE FROM votes WHERE id = $1', [vote.id]);
    logger.info(`Vote removed: ${vote.id}`);
    return { message: 'Vote removed successfully' };
  }

  async getVoteStats(campaignId: string) {
    const statsResult = await pool.query(
      `SELECT vote_choice, COUNT(*) as count FROM votes WHERE campaign_id = $1 GROUP BY vote_choice`,
      [campaignId]
    );

    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = $1',
      [campaignId]
    );

    const result: any = { total: parseInt(totalResult.rows[0].count), support: 0, oppose: 0, neutral: 0 };
    statsResult.rows.forEach((stat: any) => { result[stat.vote_choice] = parseInt(stat.count); });
    return result;
  }

  async getUserVote(campaignId: string, userId: string) {
    const result = await pool.query(
      'SELECT vote_choice, created_at FROM votes WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    return result.rows[0] || null;
  }

  async getCampaignVoters(campaignId: string) {
    const result = await pool.query(
      `SELECT v.vote_choice, v.created_at, u.username, u.reputation_score
       FROM votes v
       LEFT JOIN users u ON v.user_id = u.id
       WHERE v.campaign_id = $1
       ORDER BY v.created_at DESC`,
      [campaignId]
    );
    return result.rows;
  }
}
