'use client';

interface ImpactMetrics {
  support_count: number;
  view_count: number;
  share_count: number;
  conversion_rate: number;
  response_received: boolean;
  campaign_status: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  response_received: 'Yanıt Alındı',
  no_response: 'Yanıt Verilmedi',
  resolved: 'Çözüldü',
  closed_unresolved: 'Çözümsüz Kapandı',
  closed: 'Kapatıldı',
  archived: 'Arşivlendi',
};

export default function CampaignImpactCard({ metrics }: { metrics: ImpactMetrics }) {
  const rows = [
    { label: 'Destekçi', value: metrics.support_count.toLocaleString('tr-TR') },
    { label: 'Görüntülenme', value: metrics.view_count.toLocaleString('tr-TR') },
    { label: 'Paylaşım', value: metrics.share_count.toLocaleString('tr-TR') },
    { label: 'Dönüşüm Oranı', value: `%${metrics.conversion_rate}` },
    {
      label: 'Kurum Yanıtı',
      value: metrics.response_received ? 'Evet' : 'Hayır',
      valueStyle: { color: metrics.response_received ? '#16a34a' : '#6b7280' },
    },
    {
      label: 'Kampanya Durumu',
      value: STATUS_LABELS[metrics.campaign_status] || metrics.campaign_status,
    },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1F2A44', marginBottom: 14, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        Kampanya Etkisi
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2A44', ...row.valueStyle }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
