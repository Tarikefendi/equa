'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const TYPE_LABELS: Record<string, string> = {
  company: 'Şirket',
  government: 'Kamu Kurumu',
  organization: 'Sivil Toplum',
  person: 'Kişi',
  other: 'Diğer',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  response_received: 'Yanıt Alındı',
  disputed: 'İtiraz Edildi',
  resolved: 'Çözüldü',
  concluded: 'Sonuçsuz Kapandı',
  archived: 'Arşivlendi',
  no_response: 'Yanıt Yok',
  closed: 'Kapatıldı',
  closed_unresolved: 'Kapatıldı',
};

const STATUS_COLORS: Record<string, { color: string; background: string }> = {
  active:            { color: '#374151', background: '#f3f4f6' },
  response_received: { color: '#374151', background: '#f3f4f6' },
  resolved:          { color: '#374151', background: '#f3f4f6' },
  archived:          { color: '#9ca3af', background: '#f9fafb' },
  no_response:       { color: '#6b7280', background: '#f3f4f6' },
  concluded:         { color: '#9ca3af', background: '#f9fafb' },
  closed:            { color: '#9ca3af', background: '#f9fafb' },
  closed_unresolved: { color: '#9ca3af', background: '#f9fafb' },
};

const STATUS_STATS = [
  { key: 'active',            label: 'Aktif' },
  { key: 'response_received', label: 'Yanıt Alındı' },
  { key: 'resolved',          label: 'Çözüldü' },
  { key: 'unanswered',        label: 'Cevapsız' },
];

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  marginBottom: '1.25rem',
};

export default function EntityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<{ isFollowing: boolean; followerCount: number } | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [transparencyScore, setTransparencyScore] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    (api.getEntityBySlug(slug) as Promise<any>)
      .then((res: any) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    (api.getEntityMetrics(slug) as Promise<any>)
      .then((res: any) => setMetrics(res.data))
      .catch(() => {});
    (api.getEntityTransparencyScore(slug) as Promise<any>)
      .then((res: any) => setTransparencyScore(res.data))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    (api.getEntityFollowStatus(slug) as Promise<any>)
      .then((res: any) => setFollowStatus(res.data))
      .catch(() => {});
  }, [slug]);

  const handleFollow = async () => {
    if (!user) { window.location.href = '/auth/login'; return; }
    setFollowLoading(true);
    try {
      const res: any = followStatus?.isFollowing
        ? await api.unfollowEntity(slug)
        : await api.followEntity(slug);
      setFollowStatus(res.data);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header />
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card, marginBottom: '1rem' }}>
              <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '30%', marginBottom: 10 }} />
              <div style={{ height: 12, background: '#f9fafb', borderRadius: 4, width: '55%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header />
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Kurum bulunamadı.</p>
          <Link href="/entities" style={{ fontSize: '0.75rem', color: '#1F2A44', textDecoration: 'underline', display: 'inline-block', marginTop: '0.75rem' }}>
            Kurumlara dön
          </Link>
        </div>
      </div>
    );
  }

  const { entity, campaigns, stats } = data;
  const followerCount = followStatus !== null ? (followStatus?.followerCount ?? 0) : (parseInt(entity.follower_count) || 0);

  // no_response kampanyaları öne çıkar
  const sortedCampaigns = [...(campaigns || [])].sort((a: any, b: any) => {
    if (a.status === 'no_response' && b.status !== 'no_response') return -1;
    if (b.status === 'no_response' && a.status !== 'no_response') return 1;
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Yanıtsız kampanya uyarı banner */}
        {metrics && metrics.metrics_available && metrics.no_response_count > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 0.2rem' }}>
                {metrics.no_response_count} kampanya yanıtsız kaldı
              </p>
              <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0 }}>
                Bu kurum yanıt süresi dolan kampanyalara cevap vermedi.
              </p>
            </div>
          </div>
        )}

        {/* Hero — Kurum Profili */}
        <div style={card}>
          <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
            Kurum Profili
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{entity.name}</h1>
            {entity.verified && (
              <span style={{ fontSize: '0.7rem', color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontWeight: 400 }}>
                Doğrulanmış Kurum
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: entity.description ? '0.875rem' : '0' }}>
            {entity.type && (
              <span style={{ fontSize: '0.72rem', color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.1rem 0.45rem', borderRadius: '0.25rem' }}>
                {TYPE_LABELS[entity.type] || entity.type}
              </span>
            )}
            {entity.country && (
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{entity.country}</span>
            )}
            {entity.website && (
              <a href={entity.website} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.72rem', color: '#6b7280', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                {entity.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {entity.description && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.7, margin: '0 0 1rem' }}>
              {entity.description}
            </p>
          )}

          {/* Follow row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <FollowButton isFollowing={!!followStatus?.isFollowing} loading={followLoading} onClick={handleFollow} />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{followerCount} takipçi</span>
            {data.last_activity && (
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 'auto' }}>
                Son aktivite: {new Date(data.last_activity).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </span>
            )}
          </div>
        </div>

        {/* Kampanya İstatistikleri */}
        <div style={card}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>Kampanya İstatistikleri</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.625rem', marginBottom: '1.25rem' }}>
            {/* Total — emphasized */}
            <StatCard label="Toplam" value={stats.total} emphasized />
            {STATUS_STATS.map(s => (
              <StatCard
                key={s.key}
                label={s.label}
                value={stats[s.key] || 0}
                warning={s.key === 'unanswered'}
              />
            ))}
          </div>

          {/* Çözülme Oranı */}
          {stats.total > 0 && (() => {
            const resolved = stats.resolved || 0;
            const rate = Math.round((resolved / stats.total) * 100);
            return (
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Çözülme Oranı</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>%{rate}</span>
                </div>
                <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${rate}%`, height: '100%', background: '#1F2A44', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.5rem 0 0' }}>
                  {resolved} / {stats.total} kampanya çözüldü
                </p>
              </div>
            );
          })()}
        </div>

        {/* Şeffaflık Skoru */}
        {transparencyScore && transparencyScore.total_campaigns > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1.25rem' }}>Şeffaflık Skoru</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.375rem' }}>
              <ScoreCircle score={transparencyScore.transparency_score} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {transparencyScore.transparency_score >= 70 ? 'Şeffaf Kurum' : transparencyScore.transparency_score >= 40 ? 'Kısmen Şeffaf' : 'Düşük Şeffaflık'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
                  {transparencyScore.total_campaigns} kampanya verisi üzerinden hesaplandı
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.625rem' }}>
              <StatCard label="Kampanya" value={transparencyScore.total_campaigns} />
              <StatCard label="Yanıt Verilen" value={transparencyScore.responses} />
              <StatCard label="Çözülen" value={transparencyScore.resolved} />
              <StatCard label="Yanıtsız" value={transparencyScore.ignored} warning />
            </div>
            {transparencyScore.avg_response_days != null && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.875rem 0 0' }}>
                Ortalama yanıt süresi:{' '}
                <span style={{ fontWeight: 600, color: '#374151' }}>{transparencyScore.avg_response_days} gün</span>
              </p>
            )}
          </div>
        )}

        {/* Yanıt Sicili */}
        {metrics && (
          <div style={card}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>Yanıt Sicili</h2>
            {!metrics.metrics_available ? (
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                Bu kurumun yanıt metrikleri, en az 3 kampanya hedef aldığında görünür hale gelecektir.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.625rem' }}>
                <StatCard label="Hedef Alınan" value={metrics.campaign_count} />
                <StatCard label="Yanıt Verilen" value={metrics.response_count} />
                <StatCard label="Çözüme Kavuşan" value={metrics.resolved_count} />
                <StatCard label="Yanıtsız Kalan" value={metrics.no_response_count} warning />
                <StatCard label="Yanıt Oranı" value={`%${Math.round((metrics.response_rate || 0) * 100)}`} />
                <StatCard label="Ort. Yanıt Süresi" value={metrics.avg_response_time_days != null ? `${metrics.avg_response_time_days} gün` : '—'} />
              </div>
            )}
          </div>
        )}

        {/* Kampanya Listesi */}
        <div>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.875rem' }}>
            İlgili Kampanyalar ({campaigns.length})
          </h2>
          {campaigns.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Bu kuruma ait kampanya bulunamadı.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {sortedCampaigns.map((c: any) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ label, value, emphasized, warning }: {
  label: string; value: string | number; emphasized?: boolean; warning?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '0.75rem 0.5rem',
        borderRadius: '0.4rem',
        background: hovered ? '#f3f4f6' : (warning ? '#fef9f0' : '#f9fafb'),
        border: `1px solid ${warning ? '#fde68a' : (hovered ? '#e5e7eb' : '#f3f4f6')}`,
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{
        fontSize: emphasized ? '1.5rem' : '1.125rem',
        fontWeight: emphasized ? 800 : 600,
        color: warning ? '#92400e' : (emphasized ? '#0f172a' : '#374151'),
        margin: '0 0 0.25rem',
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '0.68rem',
        color: warning ? '#b45309' : (emphasized ? '#374151' : '#9ca3af'),
        margin: 0,
        fontWeight: emphasized ? 600 : 400,
        letterSpacing: emphasized ? '0.01em' : 0,
      }}>
        {label}
      </p>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const isHigh = score >= 70;
  const isMid = score >= 40;
  const borderColor = isHigh ? '#16a34a' : isMid ? '#d97706' : '#dc2626';
  const bg = isHigh ? '#f0fdf4' : isMid ? '#fef9f0' : '#fff5f5';
  const textColor = isHigh ? '#15803d' : isMid ? '#b45309' : '#b91c1c';

  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
      background: bg, border: `3px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
    }}>
      <span style={{ fontSize: '1.375rem', fontWeight: 800, color: textColor, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '0.1rem' }}>/ 100</span>
    </div>
  );
}

function FollowButton({ isFollowing, loading, onClick }: {
  isFollowing: boolean; loading: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        fontSize: '0.75rem',
        padding: '0.35rem 0.875rem',
        borderRadius: '0.35rem',
        border: '1px solid #1F2A44',
        background: isFollowing ? '#1F2A44' : (hovered ? '#f9fafb' : '#fff'),
        color: isFollowing ? '#fff' : '#1F2A44',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'background 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? '...' : isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
    </button>
  );
}

function CampaignRow({ campaign: c }: { campaign: any }) {
  const [hovered, setHovered] = useState(false);
  const statusStyle = STATUS_COLORS[c.status] || { color: '#6b7280', background: '#f3f4f6' };

  return (
    <Link href={`/campaigns/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: hovered ? '#f9fafb' : '#fff',
          border: `1px solid ${hovered ? '#9ca3af' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          padding: '1rem 1.125rem',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {c.case_number && (
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace', margin: '0 0 0.25rem' }}>{c.case_number}</p>
            )}
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4, margin: 0 }}>{c.title}</h3>
          </div>
          <span style={{
            fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
            color: statusStyle.color, background: statusStyle.background,
            padding: '0.2rem 0.55rem', borderRadius: '0.25rem',
            border: '1px solid transparent',
          }}>
            {STATUS_LABELS[c.status] || c.status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          {c.category && <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{c.category}</span>}
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>{c.signature_count}</span> destek
          </span>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
            {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </span>
        </div>
      </div>
    </Link>
  );
}
