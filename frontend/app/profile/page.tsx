'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  response_received: 'Yanıt Alındı',
  resolved: 'Çözüldü',
  closed_unresolved: 'Kapatıldı',
  archived: 'Arşivlendi',
  no_response: 'Yanıt Yok',
  pending: 'Beklemede',
  under_review: 'İncelemede',
};

const REP_EVENT_LABELS: Record<string, string> = {
  campaign_created: 'Kampanya oluşturuldu',
  update_added: 'Güncelleme eklendi',
  evidence_added: 'Kanıt eklendi',
  evidence_approved: 'Kanıt onaylandı',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  marginBottom: '1.25rem',
};

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState(0);
  const [reputationEvents, setReputationEvents] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [campaignPage, setCampaignPage] = useState(1);
  const [signaturePage, setSignaturePage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [campaignsRes, signaturesRes, profileRes, repEventsRes] = await Promise.all([
        api.getMyCampaigns().catch(() => ({ success: false, data: [] })),
        api.getMySignatures().catch(() => ({ success: false, data: [] })),
        api.getProfile().catch(() => ({ success: false, data: null })),
        api.getReputationEvents().catch(() => ({ success: false, data: [] })),
      ]) as any[];
      if (campaignsRes.success) setCampaigns(campaignsRes.data || []);
      if (signaturesRes.success) setSignatures(signaturesRes.data || []);
      if (profileRes.success) {
        setReputation(profileRes.data?.reputation || 0);
        setIsPublic(profileRes.data?.is_public || false);
      }
      if (repEventsRes?.success) setReputationEvents(repEventsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyToggle = async () => {
    setPrivacyLoading(true);
    try {
      const res: any = await api.updateProfile({ is_public: !isPublic });
      if (res.success) setIsPublic(res.data?.is_public ?? !isPublic);
    } finally {
      setPrivacyLoading(false);
    }
  };

  if (authLoading) {
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

  if (!user) return null;

  const totalSupport = campaigns.reduce((sum, c) => sum + (parseInt(c.vote_count || c.support_count || 0)), 0);
  const visibleCampaigns = campaigns.slice(0, campaignPage * PAGE_SIZE);
  const visibleSignatures = signatures.slice(0, signaturePage * PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Hero — Identity */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Avatar */}
              <div style={{
                width: '3.25rem', height: '3.25rem', borderRadius: '50%',
                background: '#1F2A44', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
                  {user.username?.[0]?.toUpperCase()}
                </span>
              </div>
              {/* Identity */}
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.2rem', lineHeight: 1.2 }}>
                  {user.username}
                </h1>
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 0.5rem' }}>{user.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {user.is_verified ? (
                    <span style={{ fontSize: '0.68rem', color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.1rem 0.45rem', borderRadius: '0.25rem', fontWeight: 500 }}>
                      Doğrulanmış
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '0.1rem 0.45rem', borderRadius: '0.25rem', fontWeight: 500 }}>
                      Doğrulanmamış
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span style={{ fontSize: '0.68rem', color: '#1F2A44', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.1rem 0.45rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                      Admin
                    </span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '0.1rem 0.45rem', borderRadius: '0.25rem', fontWeight: 500 }}>
                    {reputation} puan
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.875rem', borderRadius: '0.35rem', border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer', fontWeight: 500, transition: 'border-color 0.12s, color 0.12s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
            >
              Çıkış Yap
            </button>
          </div>

          {/* Privacy toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1.125rem', borderTop: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151', margin: '0 0 0.2rem' }}>
                {isPublic ? 'Profil Herkese Açık' : 'Profil Gizli'}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
                {isPublic ? 'Kullanıcı adın kampanya ve desteklerde görünür.' : 'Aktif olduğunda katkıların anonim görünür.'}
              </p>
            </div>
            <button
              onClick={handlePrivacyToggle}
              disabled={privacyLoading}
              aria-label="Gizlilik ayarını değiştir"
              style={{
                position: 'relative', width: '2.5rem', height: '1.375rem',
                borderRadius: '999px', border: 'none', cursor: privacyLoading ? 'not-allowed' : 'pointer',
                background: isPublic ? '#1F2A44' : '#d1d5db',
                opacity: privacyLoading ? 0.5 : 1,
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: '0.1875rem',
                left: isPublic ? '1.1875rem' : '0.1875rem',
                width: '1rem', height: '1rem', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <MetricCard label="Kampanyam" value={campaigns.length} />
          <MetricCard label="İmzaladığım" value={signatures.length} />
          <MetricCard label="Toplam Destek" value={totalSupport} />
          <MetricCard label="İtibar Puanı" value={reputation} emphasized />
        </div>

        {/* Reputation */}
        <div style={card}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem' }}>İtibar Puanı</h2>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 1rem' }}>Topluluk katkılarına göre hesaplanır</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
            <div style={{
              width: '3.5rem', height: '3.5rem', borderRadius: '50%', flexShrink: 0,
              background: '#f9fafb', border: '2px solid #1F2A44',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{reputation}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Kampanya', points: '+10' },
                { label: 'Güncelleme', points: '+3' },
                { label: 'Kanıt', points: '+5' },
              ].map(item => (
                <div key={item.label} style={{ fontSize: '0.72rem', color: '#6b7280', background: '#f9fafb', border: '1px solid #f3f4f6', padding: '0.25rem 0.6rem', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{item.points}</span> {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Reputation history */}
          {reputationEvents.length > 0 && (
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }}>Son Aktiviteler</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {reputationEvents.slice(0, 8).map((ev: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: i < Math.min(reputationEvents.length, 8) - 1 ? '1px solid #f9fafb' : 'none',
                  }}>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>
                      {REP_EVENT_LABELS[ev.type] || ev.type}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                        {new Date(ev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1F2A44', minWidth: '2rem', textAlign: 'right' }}>
                        +{ev.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Campaigns + Signatures grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* My Campaigns */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Kampanyalarım ({campaigns.length})
              </h2>
              <Link href="/campaigns/new"
                style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1F2A44', textDecoration: 'none', border: '1px solid #e5e7eb', padding: '0.2rem 0.6rem', borderRadius: '0.25rem', transition: 'border-color 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#9ca3af'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'}
              >
                Yeni
              </Link>
            </div>
            {loading ? <SkeletonList /> : campaigns.length === 0 ? (
              <EmptyState message="Henüz kampanya oluşturmadın." cta="Kampanya Başlat" href="/campaigns/new" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {visibleCampaigns.map(c => <CampaignRow key={c.id} campaign={c} />)}
                </div>
                <PaginationControls
                  total={campaigns.length}
                  visible={visibleCampaigns.length}
                  pageSize={PAGE_SIZE}
                  onMore={() => setCampaignPage(p => p + 1)}
                  onLess={() => setCampaignPage(1)}
                />
              </>
            )}
          </div>

          {/* My Signatures */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>
              İmzalarım ({signatures.length})
            </h2>
            {loading ? <SkeletonList /> : signatures.length === 0 ? (
              <EmptyState message="Henüz kampanya imzalamadın." cta="Kampanyaları Keşfet" href="/campaigns" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {visibleSignatures.map(s => <SignatureRow key={s.id} signature={s} />)}
                </div>
                <PaginationControls
                  total={signatures.length}
                  visible={visibleSignatures.length}
                  pageSize={PAGE_SIZE}
                  onMore={() => setSignaturePage(p => p + 1)}
                  onLess={() => setSignaturePage(1)}
                />
              </>
            )}
          </div>
        </div>

        {/* Admin panel link */}
        {user.role === 'admin' && (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>Admin Paneli</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Kampanyaları yönet, kullanıcıları kontrol et</p>
            </div>
            <Link href="/admin" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', background: '#1F2A44', padding: '0.45rem 1rem', borderRadius: '0.35rem', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#2d3d5c'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#1F2A44'}
            >
              Panele Git
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function MetricCard({ label, value, emphasized }: { label: string; value: number; emphasized?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: hovered ? '#f3f4f6' : '#f9fafb',
        border: `1px solid ${hovered ? '#e5e7eb' : '#f3f4f6'}`,
        borderRadius: '0.4rem',
        padding: '0.875rem 0.75rem',
        textAlign: 'center',
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ fontSize: emphasized ? '1.5rem' : '1.25rem', fontWeight: emphasized ? 800 : 700, color: '#0f172a', margin: '0 0 0.25rem', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: 0, fontWeight: emphasized ? 500 : 400 }}>{label}</p>
    </div>
  );
}

function CampaignRow({ campaign: c }: { campaign: any }) {
  const [hovered, setHovered] = useState(false);
  const statusLabel = STATUS_LABELS[c.status] || c.status;
  return (
    <Link href={`/campaigns/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: '0.375rem',
          background: hovered ? '#f9fafb' : 'transparent',
          border: `1px solid ${hovered ? '#e5e7eb' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {c.title}
          </p>
          <span style={{ fontSize: '0.65rem', color: '#6b7280', background: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}>
            {statusLabel}
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>
          {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </Link>
  );
}

function SignatureRow({ signature: s }: { signature: any }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/campaigns/${s.campaign_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: '0.375rem',
          background: hovered ? '#f9fafb' : 'transparent',
          border: `1px solid ${hovered ? '#e5e7eb' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {s.campaign_title}
          </p>
          <span style={{ fontSize: '0.65rem', color: s.is_anonymous ? '#9ca3af' : '#6b7280', background: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: '0.2rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {s.is_anonymous ? 'Anonim' : 'Açık'}
          </span>
        </div>
        {s.message && (
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{s.message}"
          </p>
        )}
        <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>
          {new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </Link>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: '0.625rem 0' }}>
          <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '70%', marginBottom: 6 }} />
          <div style={{ height: 10, background: '#f9fafb', borderRadius: 4, width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
      <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 0.75rem' }}>{message}</p>
      <Link href={href} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1F2A44', textDecoration: 'none', border: '1px solid #e5e7eb', padding: '0.35rem 0.875rem', borderRadius: '0.35rem', transition: 'border-color 0.12s' }}
        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#9ca3af'}
        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'}
      >
        {cta}
      </Link>
    </div>
  );
}

function PaginationControls({ total, visible, pageSize, onMore, onLess }: {
  total: number; visible: number; pageSize: number;
  onMore: () => void; onLess: () => void;
}) {
  const [moreHovered, setMoreHovered] = useState(false);
  const [lessHovered, setLessHovered] = useState(false);
  const hasMore = visible < total;
  const isExpanded = visible > pageSize;

  if (total <= pageSize) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #f3f4f6' }}>
      {hasMore && (
        <button
          onClick={onMore}
          style={{
            fontSize: '0.75rem', fontWeight: 500, color: moreHovered ? '#0f172a' : '#6b7280',
            background: 'transparent', border: '1px solid #e5e7eb',
            borderColor: moreHovered ? '#9ca3af' : '#e5e7eb',
            padding: '0.3rem 0.875rem', borderRadius: '0.35rem',
            cursor: 'pointer', transition: 'color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={() => setMoreHovered(true)}
          onMouseLeave={() => setMoreHovered(false)}
        >
          Daha Fazla Göster
        </button>
      )}
      {isExpanded && (
        <button
          onClick={onLess}
          style={{
            fontSize: '0.75rem', fontWeight: 500, color: lessHovered ? '#0f172a' : '#9ca3af',
            background: 'transparent', border: '1px solid transparent',
            padding: '0.3rem 0.875rem', borderRadius: '0.35rem',
            cursor: 'pointer', transition: 'color 0.12s',
          }}
          onMouseEnter={() => setLessHovered(true)}
          onMouseLeave={() => setLessHovered(false)}
        >
          Daha Az Göster
        </button>
      )}
      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
        {visible} / {total}
      </span>
    </div>
  );
}
