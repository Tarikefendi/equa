import pool from '../config/database';
import { FollowService } from './followService';
import logger from '../config/logger';

const followService = new FollowService();

export class CampaignClosureService {
  async updateLastActivity(campaignId: string) {
    await pool.query(
      'UPDATE campaigns SET last_activity_at = NOW() WHERE id = $1',
      [campaignId]
    );
  }

  async resolveCampaign(campaignId: string, userId: string, reason?: string) {
    const campaign = (await pool.query(
      'SELECT id, creator_id, status, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Kampanya bulunamadı.');

    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

    if (campaign.creator_id !== userId && !isAdmin) {
      throw new Error('Sadece kampanya sahibi veya admin çözüme kavuşturabilir.');
    }

    const RESOLVABLE = ['active', 'response_received'];
    if (!RESOLVABLE.includes(campaign.status)) {
      throw new Error(`Bu kampanya çözüme kavuşturulamaz. Mevcut durum: ${campaign.status}`);
    }

    // Destek sayısını al
    const sigCount = (await pool.query(
      'SELECT COUNT(*) AS cnt FROM signatures WHERE campaign_id = $1',
      [campaignId]
    )).rows[0].cnt;

    await pool.query(
      `UPDATE campaigns
       SET status = 'resolved',
           resolution_reason = $1,
           last_activity_at = NOW(),
           victory_at = NOW(),
           victory_support_count = $2
       WHERE id = $3`,
      [reason || null, parseInt(sigCount) || 0, campaignId]
    );

    await pool.query(
      `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, 'resolved', $3, $4)`,
      [campaignId, campaign.status, userId, reason || 'Kampanya çözüme kavuşturuldu']
    );

    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       VALUES ($1, $2, 'Kampanya çözüme kavuşturuldu', $3, 'system_event')`,
      [campaignId, userId, reason || 'Kampanya sahibi tarafından çözüme kavuşturuldu.']
    );

    try {
      await followService.notifyFollowers(
        campaignId,
        'campaign_status_change',
        `Kampanya çözüme kavuşturuldu: ${campaign.title}`,
        reason || 'Kampanya başarıyla çözüme kavuşturuldu.',
        campaignId
      );
    } catch (err) {
      logger.error('Follow notification error:', err);
    }

    return { message: 'Kampanya çözüme kavuşturuldu.', status: 'resolved' };
  }

  async closeCampaign(campaignId: string, userId: string) {
    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw new Error('Sadece admin kampanyayı kapatabilir.');
    }

    const campaign = (await pool.query(
      'SELECT id, status, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Kampanya bulunamadı.');

    const CLOSEABLE = ['active', 'response_received', 'resolved'];
    if (!CLOSEABLE.includes(campaign.status)) {
      throw new Error(`Bu kampanya kapatılamaz. Mevcut durum: ${campaign.status}`);
    }

    await pool.query(
      `UPDATE campaigns SET status = 'closed', last_activity_at = NOW() WHERE id = $1`,
      [campaignId]
    );

    await pool.query(
      `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, 'closed', $3, 'Moderatör tarafından kapatıldı')`,
      [campaignId, campaign.status, userId]
    );

    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       VALUES ($1, $2, 'Kampanya kapatıldı', 'Kampanya moderatör tarafından kapatıldı.', 'system_event')`,
      [campaignId, userId]
    );

    try {
      await followService.notifyFollowers(
        campaignId,
        'campaign_status_change',
        `Kampanya kapatıldı: ${campaign.title}`,
        'Kampanya moderatör tarafından kapatıldı.',
        campaignId
      );
    } catch (err) {
      logger.error('Follow notification error:', err);
    }

    return { message: 'Kampanya kapatıldı.', status: 'closed' };
  }

  async checkResponseDeadlines() {
    // 3 gün kala uyarı bildirimi gönder
    const approaching = await pool.query(
      `SELECT c.id, c.title, c.creator_id
       FROM campaigns c
       WHERE c.status = 'active'
         AND c.response_deadline_date IS NOT NULL
         AND c.response_deadline_date > NOW()
         AND c.response_deadline_date <= NOW() + INTERVAL '3 days'
         AND NOT EXISTS (
           SELECT 1 FROM campaign_updates cu
           WHERE cu.campaign_id = c.id AND cu.type = 'official_response'
         )
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.entity_id = c.id
             AND n.type = 'deadline_approaching'
             AND n.created_at > NOW() - INTERVAL '1 day'
         )`
    );

    for (const campaign of approaching.rows) {
      try {
        await followService.notifyFollowers(
          campaign.id,
          'deadline_approaching',
          `Yanıt süresi yaklaşıyor: ${campaign.title}`,
          'Kurumun yanıt vermesi için 3 günden az süre kaldı.',
          campaign.id
        );
        logger.info(`Deadline approaching notification sent: ${campaign.id}`);
      } catch (err) {
        logger.error(`Failed to send deadline approaching notification for ${campaign.id}:`, err);
      }
    }

    // active kampanyalar arasında response_deadline_date geçmiş ve resmi yanıt olmayan kampanyaları bul
    const result = await pool.query(
      `SELECT c.id, c.title, c.creator_id
       FROM campaigns c
       WHERE c.status = 'active'
         AND c.response_deadline_date IS NOT NULL
         AND c.response_deadline_date < NOW()
         AND NOT EXISTS (
           SELECT 1 FROM campaign_updates cu
           WHERE cu.campaign_id = c.id AND cu.type = 'official_response'
         )`
    );

    const campaigns = result.rows;
    logger.info(`Response deadline check: ${campaigns.length} campaign(s) past deadline without response.`);

    for (const campaign of campaigns) {
      try {
        await pool.query(
          `UPDATE campaigns SET status = 'no_response', last_activity_at = NOW() WHERE id = $1`,
          [campaign.id]
        );

        await pool.query(
          `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
           VALUES ($1, 'active', 'no_response', NULL, 'Kurum belirtilen süre içinde yanıt vermedi')`,
          [campaign.id]
        );

        await pool.query(
          `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
           SELECT $1::text, creator_id, 'Yanıt süresi doldu', 'Kurum belirtilen süre içinde yanıt vermedi.', 'system_event'
           FROM campaigns WHERE id = $1::text`,
          [campaign.id]
        );

        await followService.notifyFollowers(
          campaign.id,
          'campaign_status_change',
          `Kampanyada yeni gelişme: ${campaign.title}`,
          'Kurum belirtilen süre içinde yanıt vermedi.',
          campaign.id
        );

        logger.info(`Marked no_response: ${campaign.id} (${campaign.title})`);
      } catch (err) {
        logger.error(`Failed to mark no_response for campaign ${campaign.id}:`, err);
      }
    }

    return { processed: campaigns.length };
  }

  async autoArchiveInactive() {
    const result = await pool.query(
      `SELECT id, title, creator_id FROM campaigns
       WHERE status IN ('active', 'response_received')
         AND last_activity_at < NOW() - INTERVAL '180 days'`
    );

    const campaigns = result.rows;
    logger.info(`Auto-archive: ${campaigns.length} inactive campaign(s) found.`);

    for (const campaign of campaigns) {
      try {
        await pool.query(
          `UPDATE campaigns SET status = 'archived', archived_at = NOW(), last_activity_at = NOW() WHERE id = $1`,
          [campaign.id]
        );

        await pool.query(
          `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
           VALUES ($1, $2, 'archived', NULL, 'Hareketsizlik nedeniyle otomatik arşivlendi')`,
          [campaign.id, campaign.status]
        );

        await pool.query(
          `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
           SELECT $1::text, creator_id, 'Kampanya otomatik arşivlendi', 'Kampanya 180 gün hareketsizlik nedeniyle otomatik olarak arşivlendi.', 'system_event'
           FROM campaigns WHERE id = $1::text`,
          [campaign.id]
        );

        logger.info(`Auto-archived campaign: ${campaign.id} (${campaign.title})`);
      } catch (err) {
        logger.error(`Failed to auto-archive campaign ${campaign.id}:`, err);
      }
    }

    return { archived: campaigns.length };
  }
}
