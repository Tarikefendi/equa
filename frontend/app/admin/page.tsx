'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';

type Tab = 'overview' | 'campaigns' | 'reports' | 'users' | 'lawyers' | 'entities' | 'standards';

const TYPE_LABELS: Record<string, string> = {
  company: 'Şirket', government: 'Kamu', organization: 'STK', person: 'Kişi', other: 'Diğer',
};

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.25rem',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [campaignReports, setCampaignReports] = useState<any[]>([]);
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [standardSuggestions, setStandardSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'moderator') { router.push('/'); return; }
    if (user) loadData();
  }, [user, router]);

  const loadData = async () => {
    const safe = async (fn: () => Promise<any>) => { try { return await fn(); } catch { return { success: false }; } };
    const [statsRes, campaignsRes, reportsRes, lawyersRes, entitiesRes, campaignReportsRes, suggestionsRes]: any[] = await Promise.all([
      safe(() => api.getAdminDashboardStats()),
      safe(() => api.getPendingCampaigns(10)),
      safe(() => api.getPendingReports(10)),
      safe(() => api.getPendingLawyers()),
      safe(() => api.getAdminEntities()),
      safe(() => api.getCampaignReports()),
      safe(() => api.getStandardSuggestions()),
    ]);
    if (statsRes?.success) setStats(statsRes.data);
    if (campaignsRes?.success) setPendingCampaigns(campaignsRes.data);
    if (reportsRes?.success) setPendingReports(reportsRes.data);
    if (lawyersRes?.success) setPendingLawyers(lawyersRes.data);
    if (entitiesRes?.success) setEntities(entitiesRes.data || []);
    if (campaignReportsRes?.success) setCampaignReports(campaignReportsRes.data || []);
    if (suggestionsRes?.success) setStandardSuggestions(suggestionsRes.data || []);
    setLoading(false);
  };

  const handleApproveCampaign = async (id: string) => {
    if (!confirm('Bu kampanyayı onaylamak istediğinizden emin misiniz?')) return;
    try { await api.approveCampaign(id); loadData(); } catch (e: any) { alert(e.message); }
  };
  const handleRejectCampaign = async (id: string) => {
    const reason = prompt('Red sebebini girin:');
    if (!reason) return;
    try { await api.rejectCampaign(id, reason); loadData(); } catch (e: any) { alert(e.message); }
  };
  const handleResolveReport = async (id: string) => {
    const note = prompt('Çözüm notunu girin:');
    if (!note) return;
    try { await api.updateReportStatus(id, 'resolved', note); loadData(); } catch (e: any) { alert(e.message); }
  };
  const handleVerifyLawyer = async (id: string) => {
    if (!confirm('Bu avukatı doğrulamak istediğinizden emin misiniz?')) return;
    try { await api.verifyLawyer(id); loadData(); } catch (e: any) { alert(e.message); }
  };
  const handleRejectLawyer = async (id: string) => {
    if (!confirm('Bu avukatı reddetmek istediğinizden emin misiniz?')) return;
    try { await api.rejectLawyer(id); loadData(); } catch (e: any) { alert(e.message); }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header />
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Header />
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card, marginBottom: '1rem' }}>
              <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '25%', marginBottom: 10 }} />
              <div style={{ height: 12, background: '#f9fafb', borderRadius: 4, width: '45%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pendingStandards = standardSuggestions.filter((s: any) => s.status === 'pending');
  const openReports = campaignReports.filter((r: any) => r.status === 'pending');

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',   label: 'Genel Bakış' },
    { id: 'campaigns',  label: 'Kampanyalar',  badge: pendingCampaigns.length },
    { id: 'reports',    label: 'Raporlar',     badge: openReports.length },
    { id: 'users',      label: 'Kullanıcılar' },
    { id: 'lawyers',    label: 'Avukatlar',    badge: pendingLawyers.length },
    { id: 'entities',   label: 'Kurumlar' },
    { id: 'standards',  label: 'Standartlar',  badge: pendingStandards.length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Admin Paneli</h1>
          <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0 }}>Platform yönetim ve denetim merkezi</p>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.75rem', overflowX: 'auto' }}>
          <nav style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
            {TABS.map(tab => (
              <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </nav>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <OverviewCard label="Toplam Kampanya"    value={stats.campaigns?.total_campaigns ?? '—'} />
              <OverviewCard label="Aktif Kampanya"     value={stats.campaigns?.active_campaigns ?? '—'} />
              <OverviewCard label="Bekleyen Onay"      value={stats.campaigns?.pending_campaigns ?? '—'} warn={stats.campaigns?.pending_campaigns > 0} />
              <OverviewCard label="Açık Raporlar"      value={stats.reports?.pending_reports ?? '—'} warn={stats.reports?.pending_reports > 0} />
              <OverviewCard label="Toplam Kullanıcı"   value={stats.users?.total_users ?? '—'} />
              <OverviewCard label="Doğrulanmış Kurum"  value={entities.filter((e: any) => e.verified).length} />
            </div>

            {/* Pending actions */}
            {(pendingCampaigns.length > 0 || openReports.length > 0 || pendingLawyers.length > 0) && (
              <div style={card}>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>Bekleyen İşlemler</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {pendingCampaigns.length > 0 && (
                    <PendingRow
                      label={`${pendingCampaigns.length} kampanya onay bekliyor`}
                      cta="İncele"
                      onClick={() => setActiveTab('campaigns')}
                      warn
                    />
                  )}
                  {openReports.length > 0 && (
                    <PendingRow
                      label={`${openReports.length} incelenmemiş rapor var`}
                      cta="İncele"
                      onClick={() => setActiveTab('reports')}
                      warn
                    />
                  )}
                  {pendingLawyers.length > 0 && (
                    <PendingRow
                      label={`${pendingLawyers.length} avukat doğrulama bekliyor`}
                      cta="İncele"
                      onClick={() => setActiveTab('lawyers')}
                    />
                  )}
                  {pendingStandards.length > 0 && (
                    <PendingRow
                      label={`${pendingStandards.length} standart önerisi bekliyor`}
                      cta="İncele"
                      onClick={() => setActiveTab('standards')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Activity */}
            {stats.activity && (
              <div style={card}>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>Son 24 Saat</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.625rem' }}>
                  <MiniStat label="Yeni Kampanya"  value={stats.activity.campaigns_created} />
                  <MiniStat label="Paylaşım"        value={stats.activity.campaigns_shared} />
                  <MiniStat label="Görüntülenme"    value={stats.activity.campaigns_viewed} />
                  <MiniStat label="Toplam Aktivite" value={stats.activity.total_activities} />
                </div>
              </div>
            )}

            {/* User growth */}
            {stats.users && (
              <div style={card}>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1rem' }}>Kullanıcı Büyümesi</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {[
                    { label: 'Bu Hafta',    value: stats.users.new_users_week,  total: stats.users.total_users },
                    { label: 'Bu Ay',       value: stats.users.new_users_month, total: stats.users.total_users },
                    { label: 'Doğrulanmış', value: stats.users.verified_users,  total: stats.users.total_users },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
                      </div>
                      <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${row.total ? Math.min((row.value / row.total) * 100, 100) : 0}%`, height: '100%', background: '#1F2A44', borderRadius: '999px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CAMPAIGNS TAB ── */}
        {activeTab === 'campaigns' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Onay Bekleyen Kampanyalar ({pendingCampaigns.length})
              </h2>
            </div>
            {pendingCampaigns.length === 0 ? (
              <EmptyState message="Bekleyen kampanya bulunmuyor." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {pendingCampaigns.map((c: any, i: number) => (
                  <div key={c.id} style={{ padding: '1rem 0', borderBottom: i < pendingCampaigns.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                        {c.description && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</p>}
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                          {c.creator_username && <span>{c.creator_username}</span>}
                          {c.creator_reputation != null && <span>{c.creator_reputation} puan</span>}
                          <span>{new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <Link href={`/campaigns/${c.id}`} target="_blank" style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem', border: '1px solid #e5e7eb', borderRadius: '0.3rem', color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>İncele</Link>
                        <ActionBtn label="Onayla" onClick={() => handleApproveCampaign(c.id)} primary />
                        <ActionBtn label="Reddet" onClick={() => handleRejectCampaign(c.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div>
            <div style={card}>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1.25rem' }}>
                Kampanya Şikayetleri ({campaignReports.length})
              </h2>
              {campaignReports.length === 0 ? <EmptyState message="Bekleyen şikayet bulunmuyor." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {campaignReports.map((r: any, i: number) => (
                    <div key={r.id} style={{ padding: '1rem 0', borderBottom: i < campaignReports.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>{r.campaign_title}</p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.2rem' }}>
                            <span style={{ fontWeight: 500 }}>{r.reason}</span>
                            {r.description && ` — ${r.description}`}
                          </p>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                            {r.reporter_username && <span>{r.reporter_username}</span>}
                            <span>{new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                            <span style={{ color: r.status === 'pending' ? '#92400e' : '#9ca3af', background: r.status === 'pending' ? '#fef3c7' : '#f3f4f6', padding: '0.05rem 0.4rem', borderRadius: '0.2rem', fontWeight: 500 }}>
                              {r.status === 'pending' ? 'Bekliyor' : r.status === 'reviewed' ? 'İncelendi' : 'Reddedildi'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <Link href={`/campaigns/${r.campaign_id}`} target="_blank" style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem', border: '1px solid #e5e7eb', borderRadius: '0.3rem', color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Görüntüle</Link>
                          {r.status === 'pending' && <>
                            <ActionBtn label="İncelendi" onClick={async () => { await api.updateCampaignReportStatus(r.id, 'reviewed'); loadData(); }} primary />
                            <ActionBtn label="Reddet" onClick={async () => { await api.updateCampaignReportStatus(r.id, 'rejected'); loadData(); }} />
                          </>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pendingReports.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1.25rem' }}>Diğer Raporlar ({pendingReports.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {pendingReports.map((r: any, i: number) => (
                    <div key={r.id} style={{ padding: '1rem 0', borderBottom: i < pendingReports.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>{r.reason}</p>
                          {r.description && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.2rem' }}>{r.description}</p>}
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                            {r.reporter_username && <span>{r.reporter_username}</span>}
                            <span>{new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                        <ActionBtn label="Çöz" onClick={() => handleResolveReport(r.id)} primary />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div style={card}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.75rem' }}>Kullanıcı Yönetimi</h2>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Kullanıcı yönetimi özellikleri yakında eklenecek.</p>
          </div>
        )}

        {/* ── LAWYERS TAB ── */}
        {activeTab === 'lawyers' && (
          <div style={card}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 1.25rem' }}>
              Avukat Doğrulama ({pendingLawyers.length})
            </h2>
            {pendingLawyers.length === 0 ? <EmptyState message="Doğrulama bekleyen avukat bulunmuyor." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {pendingLawyers.map((l: any, i: number) => (
                  <div key={l.id} style={{ padding: '1rem 0', borderBottom: i < pendingLawyers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>Av. {l.username}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.375rem' }}>{l.email}</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#6b7280', flexWrap: 'wrap' }}>
                          {l.bar_number && <span>Baro: <span style={{ fontWeight: 600 }}>{l.bar_number}</span></span>}
                          {l.city && <span>Şehir: <span style={{ fontWeight: 600 }}>{l.city}</span></span>}
                          {l.specialization && <span>Uzmanlık: <span style={{ fontWeight: 600 }}>{l.specialization}</span></span>}
                          {l.experience_years && <span>{l.experience_years} yıl deneyim</span>}
                        </div>
                        {l.bio && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.375rem 0 0' }}>{l.bio}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <ActionBtn label="Onayla" onClick={() => handleVerifyLawyer(l.id)} primary />
                        <ActionBtn label="Reddet" onClick={() => handleRejectLawyer(l.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ENTITIES TAB ── */}
        {activeTab === 'entities' && (
          <div style={card}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>Kurum Doğrulama</h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Doğrulanmış kurumlar kampanyalara resmi yanıt bırakabilir.</p>
            </div>
            {entities.length === 0 ? <EmptyState message="Kurum bulunamadı." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {entities.map((e: any, i: number) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 0', borderBottom: i < entities.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{e.name}</span>
                        {e.verified && <span style={{ fontSize: '0.65rem', color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.05rem 0.35rem', borderRadius: '0.2rem' }}>Doğrulandı</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                        {e.type && <span>{TYPE_LABELS[e.type] || e.type}</span>}
                        {e.website && <span>{e.website.replace(/^https?:\/\//, '')}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {e.verified ? (
                        <ActionBtn label="Doğrulamayı Kaldır" onClick={async () => { await api.unverifyEntity(e.id); loadData(); }} />
                      ) : (
                        <ActionBtn label="Doğrula" onClick={async () => { await api.verifyEntity(e.id); loadData(); }} primary />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STANDARDS TAB ── */}
        {activeTab === 'standards' && (
          <div style={card}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.2rem' }}>Standart Önerileri</h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Kullanıcıların önerdiği standartları incele ve onayla.</p>
            </div>
            {standardSuggestions.length === 0 ? <EmptyState message="Bekleyen standart önerisi bulunmuyor." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {standardSuggestions.map((s: any, i: number) => (
                  <div key={s.id} style={{ padding: '1rem 0', borderBottom: i < standardSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{s.title}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 500, padding: '0.1rem 0.4rem', borderRadius: '0.2rem',
                            color: s.status === 'pending' ? '#92400e' : s.status === 'approved' ? '#374151' : '#9ca3af',
                            background: s.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                          }}>
                            {s.status === 'pending' ? 'Bekliyor' : s.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                          </span>
                        </div>
                        {s.category_name && <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 0.2rem' }}>{s.category_name}</p>}
                        {s.description && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.2rem' }}>{s.description}</p>}
                        {s.source_url && <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#6b7280', textDecoration: 'underline', wordBreak: 'break-all' }}>{s.source_url}</a>}
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.375rem' }}>
                          {s.suggested_by_username && <span>{s.suggested_by_username}</span>}
                          {s.ai_confidence != null && <span>AI güven: %{Math.round(s.ai_confidence * 100)}</span>}
                          <span>{new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                      {s.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <ActionBtn label="Onayla" onClick={async () => { await api.reviewStandardSuggestion(s.id, 'approved'); loadData(); }} primary />
                          <ActionBtn label="Reddet" onClick={async () => { await api.reviewStandardSuggestion(s.id, 'rejected'); loadData(); }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function TabButton({ tab, active, onClick }: { tab: { id: string; label: string; badge?: number }; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.75rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: '0.8125rem', fontWeight: active ? 600 : 400,
        color: active ? '#0f172a' : (hovered ? '#374151' : '#6b7280'),
        borderBottom: active ? '2px solid #1F2A44' : '2px solid transparent',
        marginBottom: '-1px', transition: 'color 0.12s', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {tab.label}
      {tab.badge != null && tab.badge > 0 && (
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '0.05rem 0.4rem', borderRadius: '999px', minWidth: '1.1rem', textAlign: 'center' }}>
          {tab.badge}
        </span>
      )}
    </button>
  );
}

function OverviewCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: hovered ? '#f3f4f6' : '#f9fafb',
        border: `1px solid ${warn ? '#fde68a' : (hovered ? '#e5e7eb' : '#f3f4f6')}`,
        borderRadius: '0.4rem', padding: '1rem 0.875rem', textAlign: 'center',
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: warn ? '#92400e' : '#0f172a', margin: '0 0 0.25rem', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: warn ? '#b45309' : '#9ca3af', margin: 0 }}>{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '0.4rem', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#374151', margin: '0 0 0.2rem', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: 0 }}>{label}</p>
    </div>
  );
}

function PendingRow({ label, cta, onClick, warn }: { label: string; cta: string; onClick: () => void; warn?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.625rem 0', borderBottom: '1px solid #f9fafb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: warn ? '#d97706' : '#9ca3af', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{label}</span>
      </div>
      <button
        onClick={onClick}
        style={{
          fontSize: '0.72rem', fontWeight: 600, color: hovered ? '#0f172a' : '#1F2A44',
          background: 'transparent', border: '1px solid #e5e7eb',
          borderColor: hovered ? '#9ca3af' : '#e5e7eb',
          padding: '0.2rem 0.6rem', borderRadius: '0.25rem', cursor: 'pointer',
          transition: 'border-color 0.12s, color 0.12s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {cta}
      </button>
    </div>
  );
}

function ActionBtn({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '0.3rem', cursor: 'pointer',
        border: primary ? '1px solid #1F2A44' : '1px solid #e5e7eb',
        background: primary ? (hovered ? '#2d3d5c' : '#1F2A44') : (hovered ? '#f3f4f6' : '#fff'),
        color: primary ? '#fff' : (hovered ? '#374151' : '#6b7280'),
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '2rem 0', textAlign: 'center' }}>
      <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0 }}>{message}</p>
    </div>
  );
}
