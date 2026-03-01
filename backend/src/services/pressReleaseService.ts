import db from '../config/database';
import logger from '../config/logger';

interface PressReleaseData {
  campaign_id: string;
  title: string;
  description: string;
  target_entity: string;
  category: string;
  signature_count: number;
  vote_count: number;
  creator_username: string;
  created_at: string;
}

export class PressReleaseService {
  generatePressRelease(data: PressReleaseData): string {
    const date = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const categoryMap: { [key: string]: string } = {
      'İnsan Hakları': 'insan hakları',
      'Çevre': 'çevre',
      'Hayvan Hakları': 'hayvan hakları',
      'Ekonomik Adalet': 'ekonomik adalet',
      'Sağlık': 'sağlık',
      'Eğitim': 'eğitim',
      'Diğer': 'toplumsal'
    };

    const categoryText = categoryMap[data.category] || 'toplumsal';

    const pressRelease = `
BASIN BÜLTENİ
${date}

${data.title}

${data.signature_count.toLocaleString('tr-TR')} Kişi ${data.target_entity} Hakkında Harekete Geçti

Boykot Platform'da başlatılan "${data.title}" kampanyası, ${data.signature_count.toLocaleString('tr-TR')} imza ve ${data.vote_count.toLocaleString('tr-TR')} oy ile büyük bir toplumsal destek aldı.

KAMPANYA DETAYLARI

${data.description}

Kampanya, ${categoryText} alanında önemli bir toplumsal hareketi temsil ediyor ve ${data.target_entity} kuruluşundan somut adımlar atmasını talep ediyor.

TOPLUMSAL DESTEK

• ${data.signature_count.toLocaleString('tr-TR')} imza toplandı
• ${data.vote_count.toLocaleString('tr-TR')} kişi kampanyayı destekledi
• Kampanya ${new Date(data.created_at).toLocaleDateString('tr-TR')} tarihinde başlatıldı

KAMPANYA SAHİBİNDEN

Kampanyayı başlatan ${data.creator_username}, toplumsal desteğin önemini vurgulayarak, ${data.target_entity} kuruluşunun bu sürece duyarlı yaklaşmasını beklediklerini belirtti.

HAKKIMIZDA

Boykot Platform, vatandaşların seslerini duyurabilecekleri, toplumsal adaletsizliklere karşı kolektif hareket edebilecekleri dijital bir platformdur. Platform, şeffaflık, hesap verebilirlik ve toplumsal katılım ilkeleriyle hareket eder.

İLETİŞİM

Web: https://boycott-platform.com
Kampanya Linki: https://boycott-platform.com/campaigns/${data.campaign_id}

---

Bu basın bülteni Boykot Platform tarafından hazırlanmıştır.
Daha fazla bilgi için kampanya sayfasını ziyaret edebilirsiniz.
`;

    return pressRelease.trim();
  }

  async createPressRelease(campaignId: string, userId: string) {
    // Get campaign details
    const campaign = db.prepare(
      `SELECT c.*, u.username as creator_username
       FROM campaigns c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ?`
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is the creator
    if (campaign.creator_id !== userId) {
      throw new Error('Unauthorized: Only campaign creator can generate press release');
    }

    // Get signature count
    const signatureCount = db.prepare(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = ?'
    ).get(campaignId) as any;

    // Get vote count
    const voteCount = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = ?'
    ).get(campaignId) as any;

    const pressReleaseData: PressReleaseData = {
      campaign_id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      target_entity: campaign.target_entity,
      category: campaign.category,
      signature_count: signatureCount.count,
      vote_count: voteCount.count,
      creator_username: campaign.creator_username,
      created_at: campaign.created_at,
    };

    const pressReleaseText = this.generatePressRelease(pressReleaseData);

    logger.info(`Press release generated for campaign ${campaignId} by user ${userId}`);

    return {
      content: pressReleaseText,
      campaign_title: campaign.title,
      generated_at: new Date().toISOString(),
    };
  }
}
