import pool from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { ActivityService } from './activityService';
import { CampaignApprovalService } from './campaignApprovalService';
import { sendCampaignNotificationEmail } from '../config/email';
import { FollowService } from './followService';
import { EntityFollowService } from './entityFollowService';
import { ReputationService, REPUTATION_POINTS } from './reputationService';

const activityService = new ActivityService();
const approvalService = new CampaignApprovalService();
const followService = new FollowService();
const entityFollowService = new EntityFollowService();
const reputationService = new ReputationService();

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
  entity_id?: string;
  visibility?: 'public' | 'unlisted' | 'private';
}

interface UpdateCampaignDTO {
  title?: string;
  description?: string;
  status?: 'draft' | 'under_review' | 'active' | 'concluded';
  goals?: any;
  evidence?: any;
}

export class CampaignService {
  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await pool.query(`SELECT nextval('campaign_case_seq') as n`);
    const num = String(result.rows[0].n).padStart(6, '0');
    return `EQUA-${year}-${num}`;
  }

  async createCampaign(userId: string, data: CreateCampaignDTO) {
    const campaignId = randomBytes(16).toString('hex');
    const caseNumber = await this.generateCaseNumber();

    console.log('Creating campaign with evidence:', data.evidence);

    const approvalResult = await approvalService.determineCampaignStatus(userId, data);

    const evidenceString = typeof data.evidence === 'string'
      ? data.evidence
      : JSON.stringify(data.evidence || {});

    console.log('Evidence string to save:', evidenceString);
    console.log('Campaign status:', approvalResult.status, '- Reason:', approvalResult.reason);

    const visibility = data.visibility || 'public';
    const deadlineDays = 30; // Fixed 30-day deadline for all campaigns

    await pool.query(
      `INSERT INTO campaigns (
        id, creator_id, title, description, target_entity, target_type, target_email,
        category, goals, evidence, status, standard_reference, standard_reference_other,
        demanded_action, response_deadline_days, response_deadline_date, entity_id, case_number, visibility
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        CASE WHEN $16::integer IS NOT NULL THEN NOW() + ($16::text || ' days')::interval ELSE NULL END,
        $17, $18, $19)`,
      [
        campaignId, userId, data.title, data.description, data.target_entity,
        data.target_type, data.target_email || null, data.category,
        JSON.stringify(data.goals || {}), evidenceString, approvalResult.status,
        data.standard_reference, data.standard_reference_other || null,
        data.demanded_action, deadlineDays, deadlineDays, data.entity_id || null,
        caseNumber, visibility,
      ]
    );

    const campaign = (await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId])).rows[0];

    logger.info(`Campaign created: ${campaignId} by user ${userId} with status ${approvalResult.status}`);

    // Otomatik ilk güncelleme ekle
    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       VALUES ($1, $2, $3, $4, 'system')`,
      [campaignId, userId, 'Kampanya başlatıldı', 'Bu kampanya kamuoyu desteği toplamak için başlatıldı.']
    );

    // Kampanya sahibini otomatik takipçi yap
    await pool.query(
      `INSERT INTO campaign_followers (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [campaignId, userId]
    );

    await activityService.logActivity({
      user_id: userId,
      action_type: 'campaign_created',
      entity_type: 'campaign',
      entity_id: campaignId,
      details: { title: data.title, status: approvalResult.status },
    });

    // Reputation: kampanya oluşturma +2, kanıt ekleme +5
    await reputationService.addPoints(userId, REPUTATION_POINTS.campaign_created, 'campaign_created');
    const evidenceLinks = typeof data.evidence === 'object' ? (data.evidence?.links || []) : [];
    if (evidenceLinks.length > 0) {
      await reputationService.addPoints(userId, REPUTATION_POINTS.evidence_added, 'evidence_added');
    }

    await approvalService.processCampaignApproval(campaignId, userId);

    // Entity takipçilerine bildirim gönder
    if (data.entity_id) {
      try {
        await entityFollowService.notifyFollowers(data.entity_id, campaignId, data.title);
      } catch (err) {
        logger.error('Entity follow notification error:', err);
      }
    }

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
        AND c.visibility = 'public'
        AND c.status != 'archived'
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (filters?.status) {
      query += ` AND c.status = $${paramIdx++}`;
      params.push(filters.status);
    }

    if (filters?.category && filters.category !== 'Tümü') {
      query += ` AND c.category = $${paramIdx++}`;
      params.push(filters.category);
    }

    if (filters?.target_type) {
      query += ` AND c.target_type = $${paramIdx++}`;
      params.push(filters.target_type);
    }

    if (filters?.search) {
      query += ` AND (c.title ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx} OR c.target_entity ILIKE $${paramIdx})`;
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    if (filters?.date_from) {
      query += ` AND c.created_at >= $${paramIdx++}`;
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      query += ` AND c.created_at <= $${paramIdx++}`;
      params.push(filters.date_to);
    }

    const minSignatures = filters?.min_signatures;
    const maxSignatures = filters?.max_signatures;

    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = (filters?.sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    switch (sortBy) {
      case 'votes':
        query += ` ORDER BY vote_count ${sortOrder}`;
        break;
      case 'signatures':
        query += ` ORDER BY signature_count ${sortOrder}`;
        break;
      case 'updated_at':
        query += ` ORDER BY c.updated_at ${sortOrder}`;
        break;
      case 'title':
        query += ` ORDER BY c.title ${sortOrder}`;
        break;
      default:
        query += ` ORDER BY c.created_at ${sortOrder}`;
    }

    let campaigns = (await pool.query(query, params)).rows;

    if (minSignatures !== undefined || maxSignatures !== undefined) {
      campaigns = campaigns.filter((c: any) => {
        const sigCount = parseInt(c.signature_count) || 0;
        if (minSignatures !== undefined && sigCount < minSignatures) return false;
        if (maxSignatures !== undefined && sigCount > maxSignatures) return false;
        return true;
      });
    }

    const totalCount = campaigns.length;
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    campaigns = campaigns.slice(offset, offset + limit);

    return { campaigns, totalCount, limit, offset };
  }

  async getCampaignById(campaignId: string, requestingUserId?: string) {
    const campaign = (await pool.query(
      `SELECT c.*, u.username as creator_username, u.id as creator_id,
              e.name as entity_name, e.slug as entity_slug, e.website as entity_website, e.country as entity_country
       FROM campaigns c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN entities e ON c.entity_id = e.id
       WHERE c.id = $1`,
      [campaignId]
    )).rows[0];

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Private kampanyaya sadece sahibi ve admin erişebilir
    if (campaign.visibility === 'private') {
      if (!requestingUserId || (requestingUserId !== campaign.creator_id)) {
        // Admin kontrolü
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [requestingUserId || '']);
        const isAdmin = userResult.rows[0]?.role === 'admin';
        if (!isAdmin) throw new Error('Campaign not found');
      }
    }

    const voteCount = (await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = $1',
      [campaignId]
    )).rows[0];

    const followerCount = (await pool.query(
      'SELECT COUNT(*) as count FROM campaign_followers WHERE campaign_id = $1',
      [campaignId]
    )).rows[0];

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
      vote_count: parseInt(voteCount.count),
      followers_count: parseInt(followerCount.count),
      entity_id: campaign.entity_id,
      entity_name: campaign.entity_name,
      entity_slug: campaign.entity_slug,
      entity_website: campaign.entity_website,
      entity_country: campaign.entity_country,
      status_changed_at: campaign.status_changed_at,
      archived_at: campaign.archived_at || null,
      views: campaign.views || 0,
      case_number: campaign.case_number || null,
      visibility: campaign.visibility || 'public',
      share_count: campaign.share_count || 0,
      investigation_mode: campaign.investigation_mode || false,
    };
  }

  async updateCampaign(campaignId: string, userId: string, data: UpdateCampaignDTO) {
    const campaign = (await pool.query(
      'SELECT creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Unauthorized: You can only update your own campaigns');

    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (data.title) { updates.push(`title = $${paramIdx++}`); params.push(data.title); }
    if (data.description) { updates.push(`description = $${paramIdx++}`); params.push(data.description); }
    if (data.status) { updates.push(`status = $${paramIdx++}`); params.push(data.status); }
    if (data.goals) { updates.push(`goals = $${paramIdx++}`); params.push(JSON.stringify(data.goals)); }
    if (data.evidence) { updates.push(`evidence = $${paramIdx++}`); params.push(JSON.stringify(data.evidence)); }

    if (updates.length === 0) throw new Error('No fields to update');

    params.push(campaignId);
    await pool.query(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params);

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
    const campaign = (await pool.query(
      'SELECT creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Unauthorized: You can only delete your own campaigns');

    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);

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
    const campaigns = (await pool.query(
      `SELECT c.*, COUNT(v.id) as vote_count
       FROM campaigns c
       LEFT JOIN votes v ON c.id = v.campaign_id
       WHERE c.creator_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [userId]
    )).rows;

    return campaigns;
  }

  async sendToOrganization(campaignId: string, userId: string) {
    const campaign = (await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Unauthorized: Only campaign creator can send to organization');
    if (!campaign.target_email) throw new Error('No target email specified for this campaign');

    const signatureCount = (await pool.query(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = $1',
      [campaignId]
    )).rows[0];

    try {
      const campaignUrl = `${process.env.APP_URL || 'http://localhost:3000'}/campaigns/${campaign.id}`;
      const subject = `Kampanya Bildirimi: ${campaign.title}`;
      const content = `Kampanya: ${campaign.title}\nİmza Sayısı: ${signatureCount.count}\nLink: ${campaignUrl}`;

      await sendCampaignNotificationEmail(
        campaign.target_email,
        campaign.title,
        campaign.description,
        parseInt(signatureCount.count),
        campaignUrl
      );

      const emailId = randomBytes(16).toString('hex');
      await pool.query(
        `INSERT INTO email_history (id, campaign_id, recipient_email, email_type, subject, content, signature_count, sent_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [emailId, campaignId, campaign.target_email, 'manual_send', subject, content, parseInt(signatureCount.count), userId]
      );

      logger.info(`Manual campaign notification sent to ${campaign.target_email} by user ${userId}`);

      await activityService.logActivity({
        user_id: userId,
        action_type: 'campaign_sent_to_organization',
        entity_type: 'campaign',
        entity_id: campaignId,
        details: { target_email: campaign.target_email, signature_count: parseInt(signatureCount.count) },
      });

      return {
        message: 'Campaign notification sent successfully',
        target_email: campaign.target_email,
        signature_count: parseInt(signatureCount.count),
      };
    } catch (error) {
      logger.error('Failed to send campaign notification:', error);
      throw new Error('Failed to send email to organization');
    }
  }

  async updateStatus(campaignId: string, userId: string, status: string, description?: string) {
    const VALID_STATUSES = ['active', 'response_received', 'resolved', 'closed_unresolved', 'archived'];

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      active: ['response_received', 'resolved', 'closed_unresolved', 'archived'],
      response_received: ['resolved', 'closed_unresolved', 'archived'],
      resolved: ['archived'],
      closed_unresolved: ['archived'],
      archived: ['active'], // 24 saat içinde geri alınabilir
    };

    const STATUS_LABELS: Record<string, string> = {
      active: 'Aktif',
      response_received: 'Yanıt Alındı',
      resolved: 'Çözüldü',
      closed_unresolved: 'Çözümsüz Kapandı',
      archived: 'Arşivlendi',
    };

    if (!VALID_STATUSES.includes(status)) throw new Error('Geçersiz durum');

    const campaign = (await pool.query(
      `SELECT creator_id, status, status_changed_at, archived_at
       FROM campaigns WHERE id = $1`,
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Kampanya bulunamadı');
    if (campaign.creator_id !== userId) throw new Error('Forbidden');

    // Arşivden geri alma: sadece 24 saat içinde izin ver
    if (campaign.status === 'archived' && status === 'active') {
      if (!campaign.archived_at) throw new Error('Arşivleme tarihi bulunamadı.');
      const diffHours = (Date.now() - new Date(campaign.archived_at).getTime()) / 1000 / 3600;
      if (diffHours > 24) {
        throw new Error('Arşivleme geri alma süresi (24 saat) dolmuştur. Kampanya kalıcı olarak arşivlenmiştir.');
      }
      // Geri alma: archived_at sıfırla, günlük limit atla
      await pool.query(
        `UPDATE campaigns SET status = 'active', archived_at = NULL, status_changed_at = NOW() WHERE id = $1`,
        [campaignId]
      );
      // Geçmiş kaydı
      await pool.query(
        `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
         VALUES ($1, 'archived', 'active', $2, 'Arşivleme geri alındı')`,
        [campaignId, userId]
      );
      await pool.query(
        `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
         VALUES ($1, $2, $3, $4, 'status_change')`,
        [campaignId, userId, 'Durum güncellendi', 'Arşivleme geri alındı. Kampanya tekrar aktif edildi.']
      );
      return { ...(await this.getCampaignById(campaignId)), daily_changes_remaining: null };
    }

    // Geçiş kontrolü
    const allowed = ALLOWED_TRANSITIONS[campaign.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(`Bu geçiş izin verilmiyor: ${STATUS_LABELS[campaign.status]} → ${STATUS_LABELS[status]}`);
    }

    // 10 dakika kilidi — arşivleme hedefleniyorsa atla
    // Arşivleme ise archived_at set et
    const archivedAtClause = status === 'archived' ? ', archived_at = NOW()' : '';

    // Günlük limit kontrolü (arşivleme hariç)
    if (status !== 'archived') {
      // 10 dakika kilidi
      if (campaign.status_changed_at) {
        const diffMinutes = (Date.now() - new Date(campaign.status_changed_at).getTime()) / 1000 / 60;
        if (diffMinutes < 10) {
          const remaining = Math.ceil(10 - diffMinutes);
          throw new Error(`Son durum değişikliğinden ${remaining} dakika geçmeden tekrar değiştiremezsiniz.`);
        }
      }

      const dailyCheck = await pool.query(
        `SELECT status_change_count_today
         FROM campaigns
         WHERE id = $1 AND status_change_date = CURRENT_DATE`,
        [campaignId]
      );
      const countToday = dailyCheck.rows.length > 0 ? (dailyCheck.rows[0].status_change_count_today || 0) : 0;
      if (countToday >= 2) {
        throw new Error('Günlük maksimum 2 durum değişikliği hakkınızı kullandınız.');
      }
    }

    // Durum geçmişini kaydet
    await pool.query(
      `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [campaignId, campaign.status, status, userId, description || null]
    );

    // Güncelle
    await pool.query(
      `UPDATE campaigns
       SET status = $1,
           status_changed_at = NOW(),
           status_change_count_today = CASE WHEN status_change_date = CURRENT_DATE THEN status_change_count_today + 1 ELSE 1 END,
           status_change_date = CURRENT_DATE
           ${archivedAtClause}
       WHERE id = $2`,
      [status, campaignId]
    );

    // Timeline'a sistem eventi ekle
    const updateContent = description?.trim()
      ? `Campaign status changed to ${STATUS_LABELS[status]}\nNote: ${description.trim()}`
      : `Campaign status changed to ${STATUS_LABELS[status]}`;

    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       VALUES ($1, $2, $3, $4, 'system_event')`,
      [campaignId, userId, 'Durum güncellendi', updateContent]
    );

    const updated = await this.getCampaignById(campaignId);

    // Takipçilere bildirim gönder
    try {
      await followService.notifyFollowers(
        campaignId,
        'campaign_status_change',
        `Kampanya durumu değişti: ${updated.title}`,
        `Yeni durum: ${STATUS_LABELS[status]}`,
        campaignId
      );
    } catch (err) {
      logger.error('Follow notification error:', err);
    }

    return updated;
  }

  async recordView(campaignId: string, viewerKey: string) {
    // 30 dakika içinde aynı viewer_key için tekrar sayma
    const recent = await pool.query(
      `SELECT id FROM campaign_views
       WHERE campaign_id = $1 AND viewer_key = $2
         AND viewed_at > NOW() - INTERVAL '30 minutes'
       LIMIT 1`,
      [campaignId, viewerKey]
    );
    if (recent.rows.length > 0) return { counted: false };

    await pool.query(
      'INSERT INTO campaign_views (campaign_id, viewer_key) VALUES ($1, $2)',
      [campaignId, viewerKey]
    );
    await pool.query(
      'UPDATE campaigns SET views = views + 1 WHERE id = $1',
      [campaignId]
    );
    return { counted: true };
  }

  async searchCampaigns(query: string, sort: string = 'relevant') {
    const q = `%${query}%`;

    const ORDER_MAP: Record<string, string> = {
      newest: 'c.created_at DESC',
      support: 'signature_count DESC',
      views: 'c.views DESC',
    };
    const orderBy = ORDER_MAP[sort] || 'c.created_at DESC';

    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.status, c.category, c.created_at, c.views,
              u.username as creator_username,
              e.name as entity_name,
              (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) as signature_count
       FROM campaigns c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN entities e ON c.entity_id = e.id
       WHERE c.status NOT IN ('draft', 'under_review', 'archived')
         AND c.visibility = 'public'
         AND (c.title ILIKE $1 OR c.description ILIKE $1 OR e.name ILIKE $1)
       ORDER BY ${orderBy}
       LIMIT 50`,
      [q]
    );
    return result.rows;
  }

  async getTrendingCampaigns() {
    const result = await pool.query(
      `SELECT c.*,
              u.username as creator_username,
              e.name as entity_name,
              COUNT(DISTINCT s.id) as support_count,
              COALESCE(c.views, 0) as view_count,
              CASE WHEN c.last_activity_at >= NOW() - INTERVAL '24 hours' THEN 50 ELSE 0 END as activity_bonus,
              (COUNT(DISTINCT s.id) * 3) + COALESCE(c.views, 0) +
              CASE WHEN c.last_activity_at >= NOW() - INTERVAL '24 hours' THEN 50 ELSE 0 END as trending_score
       FROM campaigns c
       LEFT JOIN users u ON c.creator_id = u.id
       LEFT JOIN entities e ON c.entity_id = e.id
       LEFT JOIN signatures s ON c.id = s.campaign_id
       WHERE c.status IN ('active', 'response_received', 'no_response', 'resolved')
         AND c.visibility = 'public'
       GROUP BY c.id, u.username, e.name
       ORDER BY trending_score DESC
       LIMIT 20`
    );
    return result.rows.map((r: any) => ({
      ...r,
      support_count: parseInt(r.support_count) || 0,
      trending_score: parseInt(r.trending_score) || 0,
    }));
  }
  async getSimilarCampaigns(query: string) {
      const result = await pool.query(
        `SELECT c.id, c.title,
                COUNT(s.id) as support_count,
                e.name as entity_name
         FROM campaigns c
         LEFT JOIN signatures s ON c.id = s.campaign_id
         LEFT JOIN entities e ON c.entity_id = e.id
         WHERE c.title ILIKE $1
           AND c.visibility = 'public'
           AND c.status != 'archived'
         GROUP BY c.id, e.name
         ORDER BY support_count DESC
         LIMIT 5`,
        [`%${query}%`]
      );
      return result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        support_count: parseInt(r.support_count) || 0,
        entity_name: r.entity_name || null,
      }));
    }

  async getEmailHistory(campaignId: string, userId: string) {
    const campaign = (await pool.query(
      'SELECT creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Unauthorized: Only campaign creator can view email history');

    const history = (await pool.query(
      `SELECT eh.*, u.username as sent_by_username
       FROM email_history eh
       LEFT JOIN users u ON eh.sent_by = u.id
       WHERE eh.campaign_id = $1
       ORDER BY eh.sent_at DESC`,
      [campaignId]
    )).rows;

    return history;
  }

    async getStatusHistory(campaignId: string) {
      const result = await pool.query(
        `SELECT sh.id, sh.old_status, sh.new_status, sh.reason, sh.created_at,
                u.username as changed_by_username
         FROM campaign_status_history sh
         LEFT JOIN users u ON sh.changed_by = u.id
         WHERE sh.campaign_id = $1
         ORDER BY sh.created_at ASC`,
        [campaignId]
      );
      return result.rows;
    }
}
