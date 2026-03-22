import pool from '../config/database';
import { FollowService } from './followService';
import { EntityFollowService } from './entityFollowService';
import { ReputationService, REPUTATION_POINTS } from './reputationService';

const followService = new FollowService();
const entityFollowService = new EntityFollowService();
const reputationService = new ReputationService();

export class CampaignUpdateService {
  async getUpdates(campaignId: string) {
    const result = await pool.query(
      `SELECT cu.id, cu.title, cu.content, cu.source_url, cu.created_at, cu.updated_at,
              cu.is_pinned, cu.type, cu.entity_id,
              CASE WHEN u.is_public = true THEN u.username ELSE 'Anonim' END as username,
              e.name as entity_name, e.verified as entity_verified,
              COUNT(cuh.id) as history_count
       FROM campaign_updates cu
       JOIN users u ON cu.author_id = u.id
       LEFT JOIN entities e ON cu.entity_id = e.id
       LEFT JOIN campaign_update_history cuh ON cuh.update_id = cu.id
       WHERE cu.campaign_id = $1
       GROUP BY cu.id, u.is_public, u.username, e.name, e.verified
       ORDER BY cu.is_pinned DESC, cu.created_at DESC`,
      [campaignId]
    );
    return result.rows;
  }

  async addOfficialResponse(campaignId: string, userId: string, entityId: string, content: string, title?: string, source_url?: string) {
    // Kullanıcının entity_id'si ile kampanyanın entity_id'si eşleşmeli
    const campaign = (await pool.query(
      'SELECT id, title, entity_id, status, creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');
    if (campaign.entity_id !== entityId) throw new Error('Bu kampanya kurumunuza ait değil.');
    if (campaign.status === 'archived') throw new Error('Arşivlenmiş kampanyaya yanıt eklenemez.');

    const entity = (await pool.query('SELECT id, name, verified FROM entities WHERE id = $1', [entityId])).rows[0];
    if (!entity) throw new Error('Kurum bulunamadı.');

    const result = await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, source_url, type, entity_id)
       VALUES ($1, $2, $3, $4, $5, 'official_response', $6)
       RETURNING id, title, content, source_url, created_at, type, entity_id`,
      [campaignId, userId, title || `${entity.name} Resmi Yanıtı`, content, source_url || null, entity.id]
    );

    // Kampanya aktifse otomatik response_received yap
    if (campaign.status === 'active') {
      await pool.query(
        `UPDATE campaigns SET status = 'response_received', status_changed_at = NOW() WHERE id = $1`,
        [campaignId]
      );
      await pool.query(
        `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
         VALUES ($1, 'active', 'response_received', $2, 'Kurum resmi yanıt verdi')`,
        [campaignId, userId]
      );
    }

    // Kampanya sahibine bildirim
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'official_response', $2, $3, 'campaign', $4)`,
        [
          campaign.creator_id,
          `${entity.name} resmi yanıt bıraktı`,
          `"${campaign.title}" kampanyasına ${entity.name} resmi yanıt verdi.`,
          campaignId,
        ]
      );
    } catch (err) {
      console.error('Notification error:', err);
    }

    // Takipçilere bildirim gönder
    try {
      await followService.notifyFollowers(
        campaignId,
        'official_response',
        `Kampanyaya resmi yanıt geldi`,
        `"${campaign.title}" kampanyasına ${entity.name} resmi yanıt verdi.`,
        campaignId
      );
    } catch (err) {
      console.error('Follow notification error:', err);
    }

    return { ...result.rows[0], entity_name: entity.name };
  }

  async addUpdate(campaignId: string, userId: string, content: string, title?: string, source_url?: string) {
    const campaign = (await pool.query(
      'SELECT creator_id, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Forbidden');

    const campaignStatus = (await pool.query('SELECT status FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (campaignStatus?.status === 'archived') throw new Error('Arşivlenmiş kampanyaya güncelleme eklenemez.');

    const result = await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, source_url, type)
       VALUES ($1, $2, $3, $4, $5, 'update')
       RETURNING id, title, content, source_url, created_at, type`,
      [campaignId, userId, title || null, content, source_url || null]
    );
    const update = result.rows[0];

    // Update last_activity_at
    await pool.query('UPDATE campaigns SET last_activity_at = NOW() WHERE id = $1', [campaignId]);

    // Destekçilere bildirim gönder
    try {
      const supporters = await pool.query(
        'SELECT DISTINCT user_id FROM signatures WHERE campaign_id = $1 AND user_id != $2',
        [campaignId, userId]
      );

      for (const s of supporters.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
           VALUES ($1, 'campaign_update', $2, $3, 'campaign', $4)`,
          [
            s.user_id,
            'Desteklediğin kampanyada yeni güncelleme',
            title
              ? `"${campaign.title}": ${title}`
              : `"${campaign.title}" kampanyasında yeni bir güncelleme paylaşıldı.`,
            campaignId,
          ]
        );
      }
    } catch (err) {
      console.error('Supporter notification error:', err);
    }

    // Takipçilere bildirim gönder
    try {
      await followService.notifyFollowers(
        campaignId,
        'campaign_update',
        `Kampanyada yeni bir gelişme var`,
        title
          ? `"${campaign.title}": ${title} — ${content.substring(0, 80)}`
          : `"${campaign.title}": ${content.substring(0, 120)}`,
        campaignId
      );
    } catch (err) {
      console.error('Follow notification error:', err);
    }

    // Entity takipçilerine bildirim gönder
    try {
      const campaignFull = (await pool.query('SELECT entity_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
      if (campaignFull?.entity_id) {
        await entityFollowService.notifyFollowers(campaignFull.entity_id, campaignId, campaign.title);
      }
    } catch (err) {
      console.error('Entity follow notification error:', err);
    }

    // Reputation: güncelleme ekleme +3
    await reputationService.addPoints(userId, REPUTATION_POINTS.update_added, 'update_added');

    return update;
  }

  async getUpdateHistory(updateId: string) {
    const result = await pool.query(
      `SELECT id, update_id, old_title, old_content, old_source_url, edited_by, reason, created_at
       FROM campaign_update_history
       WHERE update_id = $1
       ORDER BY created_at ASC`,
      [updateId]
    );
    return result.rows;
  }

  async editUpdate(campaignId: string, updateId: string, userId: string, data: { title?: string; content?: string; source_url?: string; reason?: string }) {
    const campaign = (await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Forbidden');

    // Mevcut kaydı al
    const existing = (await pool.query(
      'SELECT title, content, source_url FROM campaign_updates WHERE id = $1 AND campaign_id = $2',
      [updateId, campaignId]
    )).rows[0];
    if (!existing) throw new Error('Update not found');

    // Geçmişe kaydet (güncelleme öncesi)
    await pool.query(
      `INSERT INTO campaign_update_history (update_id, old_title, old_content, old_source_url, edited_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [updateId, existing.title || null, existing.content, existing.source_url || null, userId, data.reason || null]
    );

    const result = await pool.query(
      `UPDATE campaign_updates
       SET title = $1, content = $2, source_url = $3, updated_at = NOW()
       WHERE id = $4 AND campaign_id = $5
       RETURNING id, title, content, source_url, created_at, updated_at`,
      [data.title || null, data.content, data.source_url || null, updateId, campaignId]
    );

    if (result.rows.length === 0) throw new Error('Update not found');
    return result.rows[0];
  }

  async deleteUpdate(campaignId: string, updateId: string, userId: string) {
    const campaign = (await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Forbidden');

    const result = await pool.query(
      'DELETE FROM campaign_updates WHERE id = $1 AND campaign_id = $2 RETURNING id',
      [updateId, campaignId]
    );

    if (result.rows.length === 0) throw new Error('Update not found');
    return { message: 'Deleted' };
  }

  async togglePin(campaignId: string, updateId: string, userId: string) {
    const campaign = (await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Forbidden');

    const result = await pool.query(
      `UPDATE campaign_updates SET is_pinned = NOT is_pinned WHERE id = $1 AND campaign_id = $2 RETURNING id, is_pinned`,
      [updateId, campaignId]
    );

    if (result.rows.length === 0) throw new Error('Update not found');
    return result.rows[0];
  }
}
