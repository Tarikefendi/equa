'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}

function getCampaignStatusLabel(req: any): { label: string; color: string; bg: string } {
  if (req.campaign_status === 'no_response') return { label: 'Yanıt yok', color: '#b91c1c', bg: '#fef2f2' };
  if (req.campaign_status === 'closed_unresolved') return { label: 'Çözümsüz kapandı', color: '#b91c1c', bg: '#fef2f2' };
  // Check deadline
  let deadlinePassed = false;
  if (req.response_deadline_date) {
    deadlinePassed = new Date(req.response_deadline_date) < new Date();
  } else if (req.response_deadline_days && req.campaign_created_at) {
    const d = new Date(req.campaign_created_at);
    d.setDate(d.getDate() + req.response_deadline_days);
    deadlinePassed = d < new Date();
  }
  if (deadlinePassed) return { label: 'Süre doldu', color: '#b45309', bg: '#fffbeb' };
  return { label: 'Aktif', color: '#15803d', bg: '#f0fdf4' };
}

export default function LawyerPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<'panel' | 'register'>('panel');
  const [requests, setRequests] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Register form
  const [fullName, setFullName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, requestsRes]: any[] = await Promise.all([
        api.getMyLawyerProfile(),
        api.getOpenLegalRequests(),
      ]);
      if (profileRes.success) setMyProfile(profileRes.data);
      if (requestsRes.success) setRequests(requestsRes.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleApply = async (requestId: string) => {
    setApplying(requestId);
    try {
      await api.applyToLegalRequest(requestId);
      setAppliedIds(prev => new Set([...prev, requestId]));
      loadData();
    } catch (err: any) {
      alert(err.message || 'İşlem başarısız');
    } finally {
      setApplying(null);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !expertise.trim()) {
      setRegisterError('Ad ve uzmanlık alanı zorunludur.');
      return;
    }
    setRegistering(true);
    setRegisterError('');
    try {
      await api.registerAsLawyer({ full_name: fullName, expertise, bar_number: barNumber || undefined, city: city || undefined, bio: bio || undefined });
      loadData();
      setView('panel');
    } catch (err: any) {
      setRegisterError(err.message || 'Kayıt başarısız');
    } finally {
      setRegistering(false);
    }
  };

  if (authLoading || loading) return null;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Avukat Paneli</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Hukuki destek talep eden kampanyaları inceleyin ve ilgilendiğinizi bildirin.</p>
        </div>

        {/* Not registered */}
        {!myProfile && view === 'panel' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px 32px', marginBottom: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Avukat olarak kayıtlı değilsiniz</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Kampanyalara başvurabilmek için önce profilinizi oluşturun.</p>
            <button onClick={() => setView('register')}
              style={{ padding: '10px 24px', background: '#1F2A44', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Avukat Olarak Kaydol
            </button>
          </div>
        )}

        {/* Pending verification */}
        {myProfile && !myProfile.is_verified && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Profiliniz inceleniyor</p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Admin onayından sonra kampanyalara başvurabilirsiniz.</p>
          </div>
        )}

        {/* Verified badge */}
        {myProfile?.is_verified && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>{myProfile.full_name}</p>
              <p style={{ fontSize: 12, color: '#16a34a' }}>{myProfile.expertise} {myProfile.city ? `· ${myProfile.city}` : ''}</p>
            </div>
          </div>
        )}

        {/* Register form */}
        {view === 'register' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '28px 32px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2A44', marginBottom: 20 }}>Avukat Profili Oluştur</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ad Soyad *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', color: '#374151', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Uzmanlık Alanı *</label>
                <input value={expertise} onChange={e => setExpertise(e.target.value)}
                  placeholder="örn. Tüketici Hukuku, İş Hukuku"
                  style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', color: '#374151', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Baro Sicil No</label>
                  <input value={barNumber} onChange={e => setBarNumber(e.target.value)}
                    style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', color: '#374151', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Şehir</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', color: '#374151', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Kısa Biyografi</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', color: '#374151', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              {registerError && <p style={{ fontSize: 12, color: '#dc2626' }}>{registerError}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setView('panel')}
                  style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>
                  İptal
                </button>
                <button onClick={handleRegister} disabled={registering}
                  style={{ padding: '9px 20px', background: '#1F2A44', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: registering ? 0.5 : 1 }}>
                  {registering ? 'Kaydediliyor...' : 'Kaydol'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open requests */}
        {view === 'panel' && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
              Açık Talepler ({requests.length})
            </p>

            {requests.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '48px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#9ca3af' }}>Şu an açık hukuki talep bulunmuyor.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {requests.map((req: any) => {
                  const isApplied = appliedIds.has(req.id);
                  const statusInfo = getCampaignStatusLabel(req);
                  return (
                    <div key={req.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Meta row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            {req.category && (
                              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{req.category}</span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: statusInfo.color, background: statusInfo.bg, padding: '2px 8px', borderRadius: 4 }}>
                              {statusInfo.label}
                            </span>
                            {req.reopen_count > 0 && (
                              <span style={{ fontSize: 11, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                Yeniden açıldı
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(req.created_at)}</span>
                          </div>

                          <Link href={`/campaigns/${req.campaign_id}`}
                            style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                            {req.campaign_title}
                          </Link>
                          {req.entity_name && (
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Hedef: {req.entity_name}</p>
                          )}
                          {req.description && (
                            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10,
                              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                              {req.description}
                            </p>
                          )}

                          {/* Key signals */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#1F2A44' }}>
                              {parseInt(req.support_count).toLocaleString('tr-TR')} destek
                            </span>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>·</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{statusInfo.label}</span>
                          </div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {isApplied ? (
                            <div style={{ padding: '9px 18px', background: '#f0fdf4', color: '#15803d', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #86efac' }}>
                              Başvuruldu
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApply(req.id)}
                              disabled={!myProfile?.is_verified || applying === req.id}
                              style={{
                                padding: '9px 18px', background: '#1F2A44', color: '#fff',
                                borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
                                cursor: (!myProfile?.is_verified || applying === req.id) ? 'not-allowed' : 'pointer',
                                opacity: (!myProfile?.is_verified || applying === req.id) ? 0.5 : 1,
                              }}
                            >
                              {applying === req.id ? '...' : 'İlgileniyorum'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <div style={{ marginTop: 28, padding: '14px 18px', background: '#f9fafb', border: '1px solid #f1f5f9', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                EQUA herhangi bir hukuki sürecin tarafı değildir. Platform yalnızca avukat ile kullanıcıyı bir araya getirir. Hukuki ilişki yalnızca kullanıcı ile avukat arasında kurulur.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
