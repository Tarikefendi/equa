import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { ActivityService } from './activityService';
import { CampaignApprovalService } from './campaignApprovalService';
import { sendCampaignNotificationEmail } from '../config/email';

const activityService = new ActivityService();
const approvalService = new CampaignApprovalService();

interface CreateCampaignDTO {
  title: string;
  description: string;
  target_entity: string;
  target_type: 'company' | 'brand' | 'government';
  target_email?: string;
  category: string;
  standard_reference: string;
  standard_reference_other?: string;
  demanded_action: string;
  response_deadline_days: number;
  tags?: string[];
  goals?: any;
  evidence?: any;
  ip_address?: string;
  device_fingerprint?: string;
}

interface UpdateCampaignDTO {
  title?: string;
  description?: string;
  status?: 'draft' | 'under_review' | 'active' | 'concluded';
  goals?: any;
  evidence?: any;
}

export class CampaignService {
  async createCampaign(userId: string, data: CreateCampaignDTO) {
    const campaignId = randomBytes(16).toString('hex');

    console.log('Creating campaign with evidence:', data.evidence);

    // Determine initial status based on approval system
    const approvalResult = await approvalService.determineCampaignStatus(userId, data);

    const insert = db.prepare(
      `INSERT INTO campaigns (
        id, creator_id, title, description, target_entity, target_type, target_email, 
        category, goals, evidence, status, standard_reference, standard_reference_other, 
        demanded_action, response_deadline_days, response_deadline_date
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))`
    );

    const evidenceString = typeof data.evidence === 'string' 
      ? data.evidence 
      : JSON.stringify(data.evidence || {});

    console.log('Evidence string to save:', evidenceString);
    console.log('Campaign status:', approvalResult.status, '- Reason:', approvalResult.reason);

    insert.run(
      campaignId,
      userId,
      data.title,
      data.description,
      data.target_entity,
      data.target_type,
      data.target_email || null,
      data.category,
      JSON.stringify(data.goals || {}),
      evidenceString,
      approvalResult.status,
      data.standard_reference,
      data.standard_reference_other || null,
      data.demanded_action,
      data.response_deadline_days,
      data.response_deadline_days
    );

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);

    logger.info(`Campaign created: ${campaignId} by user ${userId} with status ${approvalResult.status}`);

    await activityService.logActivity({
      user_id: userId,
      action_type: 'campaign_created',
      entity_type: 'campaign',
      entity_id: campaignId,
      details: { title: data.title, status: approvalResult.status },
    });

    // Process approval (send notifications)
    await approvalService.processCampaignApproval(campaignId, userId);

    return campaign;
  }

  async getCampaigns(filters?: { 
    status?: string; 
    category?: string; 
    search?: string;
    target_type?: string;
    date_from?: string;
    date_to?: string;
    min_signatures?: number;
    max_signatures?: number;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = `
      SELECT c.*, 
             u.username as creator_username,
             (SELECT COUNT(*) FROM votes WHERE campaign_id = c.id) as vote_count,
             (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) as signature_count
      FROM campaigns c 
      LEFT JOIN users u ON c.creator_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Status filter
    if (filters?.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    // Category filter
    if (filters?.category && filters.category !== 'Tümü') {
      query += ' AND c.category = ?';
      params.push(filters.category);
    }

    // Target type filter
    if (filters?.target_type) {
      query += ' AND c.target_type = ?';
      params.push(filters.target_type);
    }

    // Search filter
    if (filters?.search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.target_entity LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Date range filter
    if (filters?.date_from) {
      query += ' AND c.created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      query += ' AND c.created_at <= ?';
      params.push(filters.date_to);
    }

    // Signature count filter (will be applied after query)
    const minSignatures = filters?.min_signatures;
    const maxSignatures = filters?.max_signatures;

    // Sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'DESC';

    switch (sortBy) {
      case 'votes':
        query += ' ORDER BY vote_count ' + sortOrder;
        break;
      case 'signatures':
        query += ' ORDER BY signature_count ' + sortOrder;
        break;
      case 'updated_at':
        query += ' ORDER BY c.updated_at ' + sortOrder;
        break;
      case 'title':
        query += ' ORDER BY c.title ' + sortOrder;
        break;
      default:
        query += ' ORDER BY c.created_at ' + sortOrder;
    }

    // Get all results first
    let campaigns = db.prepare(query).all(...params) as any[];

    // Apply signature count filter if specified
    if (minSignatures !== undefined || maxSignatures !== undefined) {
      campaigns = campaigns.filter((c: any) => {
        const sigCount = c.signature_count || 0;
        if (minSignatures !== undefined && sigCount < minSignatures) return false;
        if (maxSignatures !== undefined && sigCount > maxSignatures) return false;
        return true;
      });
    }

    // Get total count before pagination
    const totalCount = campaigns.length;

    // Pagination
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    campaigns = campaigns.slice(offset, offset + limit);

    return {
      campaigns,
      totalCount,
      limit,
      offset,
    };
  }

  async getCampaignById(campaignId: string) {
    const campaign = db.prepare(
      `SELECT c.*, u.username as creator_username, u.id as creator_id
       FROM campaigns c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ?`
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get vote count
    const voteCount = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = ?'
    ).get(campaignId) as any;

    return {
      id: campaign.id,
      creator_id: campaign.creator_id,
      creator_username: campaign.creator_username,
      title: campaign.title,
      description: campaign.description,
      target_entity: campaign.target_entity,
      target_type: campaign.target_type,
      target_email: campaign.target_email,
      category: campaign.category,
      status: campaign.status,
      goals: campaign.goals,
      evidence: campaign.evidence,
      standard_reference: campaign.standard_reference,
      standard_reference_other: campaign.standard_reference_other,
      demanded_action: campaign.demanded_action,
      response_deadline_days: campaign.response_deadline_days,
      response_deadline_date: campaign.response_deadline_date,
      sent_to_organization_at: campaign.sent_to_organization_at,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      vote_count: voteCount.count,
    };
  }

  async updateCampaign(campaignId: string, userId: string, data: UpdateCampaignDTO) {
    // Check if user is the creator
    const campaign = db.prepare(
      'SELECT creator_id FROM campaigns WHERE id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.creator_id !== userId) {
      throw new Error('Unauthorized: You can only update your own campaigns');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.title) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.description) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.goals) {
      updates.push('goals = ?');
      params.push(JSON.stringify(data.goals));
    }

    if (data.evidence) {
      updates.push('evidence = ?');
      params.push(JSON.stringify(data.evidence));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(campaignId);

    const query = `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);

    logger.info(`Campaign updated: ${campaignId}`);

    await activityService.logActivity({
      user_id: userId,
      action_type: 'campaign_updated',
      entity_type: 'campaign',
      entity_id: campaignId,
    });

    return this.getCampaignById(campaignId);
  }

  async deleteCampaign(campaignId: string, userId: string) {
    const campaign = db.prepare(
      'SELECT creator_id FROM campaigns WHERE id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.creator_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own campaigns');
    }

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);

    logger.info(`Campaign deleted: ${campaignId}`);

    await activityService.logActivity({
      user_id: userId,
      action_type: 'campaign_deleted',
      entity_type: 'campaign',
      entity_id: campaignId,
    });

    return { message: 'Campaign deleted successfully' };
  }

  async getMyCampaigns(userId: string) {
    const campaigns = db.prepare(
      `SELECT c.*, COUNT(v.id) as vote_count
       FROM campaigns c
       LEFT JOIN votes v ON c.id = v.campaign_id
       WHERE c.creator_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    ).all(userId);

    return campaigns;
  }

  async sendToOrganization(campaignId: string, userId: string) {
    // Get campaign details
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is the creator
    if (campaign.creator_id !== userId) {
      throw new Error('Unauthorized: Only campaign creator can send to organization');
    }

    // Check if target email exists
    if (!campaign.target_email) {
      throw new Error('No target email specified for this campaign');
    }

    // Get signature count
    const signatureCount = db.prepare(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = ?'
    ).get(campaignId) as any;

    // Send email
    try {
      const campaignUrl = `${process.env.APP_URL || 'http://localhost:3000'}/campaigns/${campaign.id}`;
      const subject = `Kampanya Bildirimi: ${campaign.title}`;
      const content = `Kampanya: ${campaign.title}\nİmza Sayısı: ${signatureCount.count}\nLink: ${campaignUrl}`;
      
      await sendCampaignNotificationEmail(
        campaign.target_email,
        campaign.title,
        campaign.description,
        signatureCount.count,
        campaignUrl
      );

      // Save to email history
      const emailId = randomBytes(16).toString('hex');
      db.prepare(
        `INSERT INTO email_history (id, campaign_id, recipient_email, email_type, subject, content, signature_count, sent_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        emailId,
        campaignId,
        campaign.target_email,
        'manual_send',
        subject,
        content,
        signatureCount.count,
        userId
      );

      logger.info(`Manual campaign notification sent to ${campaign.target_email} by user ${userId}`);

      // Log activity
      await activityService.logActivity({
        user_id: userId,
        action_type: 'campaign_sent_to_organization',
        entity_type: 'campaign',
        entity_id: campaignId,
        details: { 
          target_email: campaign.target_email,
          signature_count: signatureCount.count 
        },
      });

      return {
        message: 'Campaign notification sent successfully',
        target_email: campaign.target_email,
        signature_count: signatureCount.count,
      };
    } catch (error) {
      logger.error('Failed to send campaign notification:', error);
      throw new Error('Failed to send email to organization');
    }
  }

  async getEmailHistory(campaignId: string, userId: string) {
    // Get campaign to check ownership
    const campaign = db.prepare(
      'SELECT creator_id FROM campaigns WHERE id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is the creator
    if (campaign.creator_id !== userId) {
      throw new Error('Unauthorized: Only campaign creator can view email history');
    }

    // Get email history
    const history = db.prepare(
      `SELECT eh.*, u.username as sent_by_username
       FROM email_history eh
       LEFT JOIN users u ON eh.sent_by = u.id
       WHERE eh.campaign_id = ?
       ORDER BY eh.sent_at DESC`
    ).all(campaignId);

    return history;
  }

}