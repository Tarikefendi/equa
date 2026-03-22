'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Link from 'next/link';
import OnboardingModal from '@/components/OnboardingModal';

function fmt(val: any): string {
  const n = parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(n)) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'B';
  return n.toLocaleString('tr-TR');
}

const ST: Record<string, { label: string; bg: string; color: string }> = {
  active:            { label: 'Aktif',        bg: '#f0fdf4', color: '#15803d' },
  response_received: { label: 'Yanıt Alındı', bg: '#eff6ff', color: '#1d4ed8' },
  resolved:          { label: 'Çözüldü',      bg: '#f0fdf4', color: '#15803d' },
  closed_unresolved: { label: 'Kapatıldı',    bg: '#f3f4f6', color: '#6b7280' },
  no_response:       { label: 'Yanıt Yok',    bg: '#fef2f2', color: '#b91c1c' },
  archived:          { label: 'Arşivlendi',   bg: '#f3f4f6', color: '#6b7280' },
};

const CSS = `
*,*::before,*::after{box-sizing:border-box}
.lp{font-family:inherit;color:#0f172a;background:#fff}
.w{max-width:72rem;margin:0 auto;padding:0 1.5rem}
.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.97);backdrop-filter:blur(8px);border-bottom:1px solid #e5e7eb}
.nav-i{display:flex;align-items:center;justify-content:space-between;height:3.5rem}
.bd{display:inline-flex;align-items:center;padding:.6rem 1.5rem;background:#1F2A44;color:#fff;border:none;border-radius:.5rem;font-size:.875rem;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s,transform .15s,box-shadow .15s}
.bd:hover{background:#2d3d5c;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.bo{display:inline-flex;align-items:center;padding:.6rem 1.5rem;background:transparent;color:#374151;border:1px solid #d1d5db;border-radius:.5rem;font-size:.875rem;font-weight:500;cursor:pointer;text-decoration:none;transition:border-color .15s,color .15s}
.bo:hover{border-color:#6b7280;color:#0f172a}
.bw{display:inline-flex;align-items:center;padding:.7rem 1.75rem;background:#fff;color:#1F2A44;border:none;border-radius:.5rem;font-size:.9375rem;font-weight:700;cursor:pointer;text-decoration:none;transition:opacity .15s,transform .15s}
.bw:hover{opacity:.92;transform:translateY(-1px)}
.bgw{display:inline-flex;align-items:center;padding:.7rem 1.75rem;background:transparent;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.3);border-radius:.5rem;font-size:.9375rem;font-weight:500;cursor:pointer;text-decoration:none;transition:border-color .15s}
.bgw:hover{border-color:rgba(255,255,255,.6)}
.sec{padding:5.5rem 0}
.sec-g{padding:5.5rem 0;background:#f9fafb}
.sec-d{padding:5.5rem 0;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%)}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;padding:1.5rem;transition:border-color .15s,box-shadow .15s}
.card:hover{border-color:#9ca3af;box-shadow:0 4px 20px rgba(0,0,0,.07)}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
@media(max-width:960px){.g4{grid-template-columns:repeat(2,1fr)!important}.g3{grid-template-columns:repeat(2,1fr)!important}.hflex{flex-direction:column!important}.hright{display:none!important}}
@media(max-width:600px){.g4,.g3{grid-template-columns:1fr!important}.ctab{flex-direction:column!important;align-items:center!important}.srow{flex-direction:column!important;gap:1.5rem!important;text-align:center}}
`;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ active: 0, total: 0, sigs: 0, responded: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [urgentCampaigns, setUrgentCampaigns] = useState<any[]>([]);
  const [ignoredCampaigns, setIgnoredCampaigns] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/campaigns');
  }, [user, authLoading]);

  useEffect(() => {
    (async () => {
      try {
        const [tr, lr, ig]: any[] = await Promise.all([
          api.getTrendingCampaigns(),
          api.getCampaigns({ limit: 1000 }),
          api.getCampaigns({ status: 'no_response', limit: 3 }),
        ]);
        if (tr.success) setCampaigns((tr.data || []).slice(0, 3));
        if (lr.success && lr.data) {
          const a = lr.data;
          setStats({ total: a.length, active: a.filter((c: any) => c.status === 'active').length, sigs: a.reduce((s: number, c: any) => s + (parseInt(String(c.support_count || 0)) || 0), 0), responded: a.filter((c: any) => ['response_received', 'resolved'].includes(c.status)).length });
          // Deadline yaklaşıyor: aktif + response_deadline_date var + 7 gün içinde
          const now = Date.now();
          const urgent = a.filter((c: any) => {
            if (c.status !== 'active' || !c.response_deadline_date) return false;
            const deadline = new Date(c.response_deadline_date.replace(' ', 'T')).getTime();
            const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);
            return daysLeft >= 0 && daysLeft <= 7;
          }).sort((a: any, b: any) => new Date(a.response_deadline_date).getTime() - new Date(b.response_deadline_date).getTime()).slice(0, 3);
          setUrgentCampaigns(urgent);
        }
        if (ig.success) setIgnoredCampaigns((ig.data || []).slice(0, 3));
      } catch {} finally { setReady(true); }
    })();
  }, []);

  if (authLoading || user) return null;

  return (
    <>
      <style>{CSS}</style>
      <OnboardingModal />
      <div className="lp">

        {/* NAV */}
        <nav className="nav">
          <div className="w"><div className="nav-i">
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:'.5rem', textDecoration:'none' }}>
              <div style={{ width:'1.75rem', height:'1.75rem', background:'#1F2A44', borderRadius:'.35rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#fff', fontWeight:800, fontSize:'.85rem' }}>E</span>
              </div>
              <span style={{ fontWeight:700, color:'#0f172a', fontSize:'1rem', letterSpacing:'.04em' }}>EQUA</span>
            </Link>
            <div style={{ display:'flex', gap:'.5rem' }}>
              <Link href="/auth/login" className="bo" style={{ padding:'.4rem .9rem', fontSize:'.8125rem' }}>Giriş Yap</Link>
              <Link href="/auth/register" className="bd" style={{ padding:'.4rem .9rem', fontSize:'.8125rem' }}>Kayıt Ol</Link>
            </div>
          </div></div>
        </nav>

        {/* HERO */}
        <section style={{ padding:'6rem 0 5rem', background:'#fff' }}>
          <div className="w">
            <div className="hflex" style={{ display:'flex', alignItems:'center', gap:'4rem' }}>

              {/* Left */}
              <div style={{ flex:'0 0 54%' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'.5rem', background:'#f0f4ff', border:'1px solid #dbeafe', borderRadius:'999px', padding:'.3rem .875rem', marginBottom:'1.75rem' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3b82f6' }} />
                  <span style={{ fontSize:'.75rem', fontWeight:600, color:'#1d4ed8' }}>Hesap verebilirlik platformu</span>
                </div>
                <h1 style={{ fontSize:'clamp(2.25rem,4.5vw,3.25rem)', fontWeight:800, color:'#0f172a', lineHeight:1.12, margin:'0 0 1.25rem', letterSpacing:'-.02em' }}>
                  Kurumları Hesap<br />Vermeye Zorla
                </h1>
                <p style={{ fontSize:'1.0625rem', color:'#4b5563', lineHeight:1.75, margin:'0 0 2.25rem', maxWidth:'30rem' }}>
                  Kampanya başlat, kanıt ekle ve toplulukla birlikte çözüm talep et. Şeffaflık için güçlü bir araç.
                </p>
                <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
                  <Link href="/auth/register" className="bd">Hemen Kampanya Başlat</Link>
                  <a href="#nasil-calisir" className="bo">Nasıl Çalışır?</a>
                </div>
                <p style={{ fontSize:'.8rem', color:'#9ca3af', margin:0 }}>
                  {ready ? <><span style={{ color:'#374151', fontWeight:600 }}>{stats.total}</span> kampanya başlatıldı · <span style={{ color:'#374151', fontWeight:600 }}>{stats.responded}</span> kurum geri adım attı · </> : ''}
                  Ücretsiz
                </p>
              </div>

              {/* Right — impact card */}
              <div className="hright" style={{ flex:1 }}>
                <div style={{ background:'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)', borderRadius:'1rem', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,.18)' }}>
                  <p style={{ fontSize:'.7rem', fontWeight:600, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.1em', margin:'0 0 1.25rem' }}>Sonuç Alan Kampanyalar</p>
                  {[
                    { name:'Türk Telekom', result:'Yanıt verdi' },
                    { name:'Migros', result:'Açıklama yaptı' },
                    { name:'Sağlık Bakanlığı', result:'İnceleme başlattı' },
                  ].map(item => (
                    <div key={item.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.875rem 0', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      <span style={{ fontSize:'.875rem', color:'rgba(255,255,255,.7)', fontWeight:500 }}>{item.name}</span>
                      <span style={{ fontSize:'.75rem', fontWeight:600, color:'#86efac', background:'rgba(134,239,172,.1)', padding:'.2rem .6rem', borderRadius:'999px' }}>{item.result}</span>
                    </div>
                  ))}
                  <Link href="/auth/register" style={{ display:'block', marginTop:'1.5rem', padding:'.7rem', background:'#fff', color:'#1F2A44', borderRadius:'.5rem', textAlign:'center', fontWeight:700, fontSize:'.875rem', textDecoration:'none' }}>
                    Hemen Başla
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="nasil-calisir" className="sec-g">
          <div className="w">
            <div style={{ textAlign:'center', marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'clamp(1.375rem,2.5vw,1.75rem)', fontWeight:800, color:'#0f172a', margin:'0 0 .5rem' }}>Nasıl Çalışır?</h2>
              <p style={{ fontSize:'.9375rem', color:'#6b7280', margin:0 }}>3 adımda değişim başlat</p>
            </div>
            <div className="g3">
              {[
                { n:'01', title:'Oluştur', desc:'Sorunu tanımla, hedef kurumu belirle, kanıtlarını ekle.' },
                { n:'02', title:'Destek Topla', desc:'Topluluk kampanyanı destekler, görünürlük artar.' },
                { n:'03', title:'Sonuç Al', desc:'Kurum yanıt vermek zorunda kalır, süreç şeffaf şekilde kayıt altına alınır.' },
              ].map(s => (
                <div key={s.n} className="card">
                  <p style={{ fontSize:'.7rem', fontWeight:700, color:'#9ca3af', letterSpacing:'.1em', margin:'0 0 1rem' }}>{s.n}</p>
                  <h3 style={{ fontSize:'1.0625rem', fontWeight:700, color:'#0f172a', margin:'0 0 .5rem' }}>{s.title}</h3>
                  <p style={{ fontSize:'.875rem', color:'#6b7280', lineHeight:1.65, margin:0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="sec">
          <div className="w">
            <div style={{ textAlign:'center', marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'clamp(1.375rem,2.5vw,1.75rem)', fontWeight:800, color:'#0f172a', margin:'0 0 .5rem' }}>Platform Özellikleri</h2>
              <p style={{ fontSize:'.9375rem', color:'#6b7280', margin:0 }}>Hesap verebilirlik için ihtiyacın olan her şey</p>
            </div>
            <div className="g4">
              {[
                { title:'Kampanya Yönetimi', desc:'Kampanya oluştur, durumunu takip et ve güncellemeler ekle.' },
                { title:'Kanıt Ekleme', desc:'Belge, görsel ve bağlantı ekleyerek kampanyanı güçlendir.' },
                { title:'Süreç Takibi', desc:'Tüm gelişmeler zaman akışında şeffaf şekilde kayıt altına alınır.' },
                { title:'Kurum Yanıtları', desc:'Kurumlar resmi yanıt verebilir, yanıt sicili herkese açıktır.' },
              ].map(f => (
                <div key={f.title} className="card">
                  <div style={{ width:'2rem', height:'2rem', background:'#f0f4ff', borderRadius:'.45rem', marginBottom:'.875rem' }} />
                  <h3 style={{ fontSize:'.9375rem', fontWeight:700, color:'#0f172a', margin:'0 0 .375rem' }}>{f.title}</h3>
                  <p style={{ fontSize:'.8125rem', color:'#6b7280', lineHeight:1.6, margin:0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* URGENCY: Deadline yaklaşıyor */}
        {urgentCampaigns.length > 0 && (
          <section className="sec-g">
            <div className="w">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.125rem,2vw,1.375rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>Yanıt Süresi Doluyor</h2>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Bu kampanyalar için son günler</p>
                </div>
                <Link href="/campaigns?status=active" style={{ fontSize: '0.8125rem', color: '#1F2A44', fontWeight: 600, textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: '0.4rem', padding: '0.4rem 0.875rem' }}>
                  Tümünü gör
                </Link>
              </div>
              <div className="g3">
                {urgentCampaigns.map((c: any) => {
                  const sup = parseInt(String(c.support_count || 0)) || 0;
                  const deadline = new Date(c.response_deadline_date.replace(' ', 'T'));
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '0.875rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'border-color .15s,box-shadow .15s', height: '100%' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#f59e0b'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(245,158,11,.12)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#fde68a'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>{c.entity_name || 'Kurum'}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: daysLeft <= 2 ? '#fef2f2' : '#fffbeb', color: daysLeft <= 2 ? '#b91c1c' : '#92400e' }}>
                            {daysLeft === 0 ? 'Bugün son gün' : `${daysLeft} gün kaldı`}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #fef3c7', marginTop: 'auto' }}>
                          <div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>{fmt(sup)}</span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '0.3rem' }}>destek</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: '#b45309', fontWeight: 600 }}>Destekle →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* URGENCY: Kurumun görmezden geldiği */}
        {ignoredCampaigns.length > 0 && (
          <section className="sec">
            <div className="w">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.125rem,2vw,1.375rem)', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>Kurumun Görmezden Geldiği</h2>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Yanıt süresi doldu, kurum sessiz kaldı</p>
                </div>
                <Link href="/campaigns?status=no_response" style={{ fontSize: '0.8125rem', color: '#1F2A44', fontWeight: 600, textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: '0.4rem', padding: '0.4rem 0.875rem' }}>
                  Tümünü gör
                </Link>
              </div>
              <div className="g3">
                {ignoredCampaigns.map((c: any) => {
                  const sup = parseInt(String(c.support_count || 0)) || 0;
                  return (
                    <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: '0.875rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'border-color .15s,box-shadow .15s', height: '100%' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#f87171'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(239,68,68,.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#fca5a5'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>{c.entity_name || 'Kurum'}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#fef2f2', color: '#b91c1c' }}>Yanıt Yok</span>
                        </div>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #fee2e2', marginTop: 'auto' }}>
                          <div>
                            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>{fmt(sup)}</span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '0.3rem' }}>destek</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 600 }}>Baskı yap →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SOCIAL PROOF */}
        {campaigns.length > 0 && (
          <section className="sec-g">
            <div className="w">
              <div style={{ textAlign:'center', marginBottom:'3rem' }}>
                <h2 style={{ fontSize:'clamp(1.375rem,2.5vw,1.75rem)', fontWeight:800, color:'#0f172a', margin:'0 0 .5rem' }}>Topluluk Harekete Geçti</h2>
                <p style={{ fontSize:'.9375rem', color:'#6b7280', margin:0 }}>Gerçek kampanyalar, gerçek sonuçlar</p>
              </div>
              <div className="g3">
                {campaigns.map((c: any, i: number) => {
                  const sup = parseInt(String(c.support_count || 0)) || 0;
                  const st = ST[c.status] || { label: c.status, bg:'#f3f4f6', color:'#6b7280' };
                  const highlights = ['2 günde 120 destek', '7 günde sonuç alındı', 'Topluluk baskısıyla yanıt alındı'];
                  return (
                    <div key={c.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'.875rem', padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1rem', transition:'border-color .15s,box-shadow .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#9ca3af'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,.07)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#e5e7eb'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'.75rem', color:'#9ca3af', fontWeight:500 }}>{c.entity_name || 'Kurum'}</span>
                        <span style={{ fontSize:'.72rem', fontWeight:600, padding:'.2rem .6rem', borderRadius:'999px', background:st.bg, color:st.color }}>{st.label}</span>
                      </div>
                      <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a', margin:0, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.title}</h3>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'.375rem', background:'#f0fdf4', borderRadius:'.35rem', padding:'.3rem .625rem', alignSelf:'flex-start' }}>
                        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#16a34a' }} />
                        <span style={{ fontSize:'.72rem', fontWeight:600, color:'#15803d' }}>{highlights[i % highlights.length]}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'.75rem', borderTop:'1px solid #f3f4f6', marginTop:'auto' }}>
                        <div>
                          <span style={{ fontSize:'1.25rem', fontWeight:800, color:'#0f172a' }}>{fmt(sup)}</span>
                          <span style={{ fontSize:'.75rem', color:'#9ca3af', marginLeft:'.375rem' }}>destek</span>
                        </div>
                        <Link href="/auth/register" style={{ fontSize:'.8125rem', color:'#1F2A44', fontWeight:600, textDecoration:'none', border:'1px solid #e5e7eb', borderRadius:'.4rem', padding:'.35rem .75rem', transition:'background .15s' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background='#f9fafb')}
                          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background='transparent')}
                        >Detayları gör</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FINAL CTA */}
        <section className="sec-d">
          <div className="w" style={{ textAlign:'center' }}>
            <h2 style={{ fontSize:'clamp(1.625rem,3vw,2.375rem)', fontWeight:800, color:'#fff', margin:'0 0 .875rem', letterSpacing:'-.02em' }}>
              Değişimi başlatmak senin elinde
            </h2>
            <p style={{ fontSize:'1rem', color:'rgba(255,255,255,.6)', margin:'0 0 .375rem' }}>
              Ücretsiz hesap oluştur ve ilk kampanyanı başlat.
            </p>
            <p style={{ fontSize:'.8125rem', color:'rgba(255,255,255,.35)', margin:'0 0 2.5rem' }}>
              Kredi kartı gerekmez · Dakikalar içinde başla
            </p>
            <div className="ctab" style={{ display:'flex', gap:'.75rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/auth/register" className="bw">Kayıt Ol</Link>
              <Link href="/auth/login" className="bgw">Giriş Yap</Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding:'1.75rem 0', background:'#fff', borderTop:'1px solid #e5e7eb' }}>
          <div className="w">
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                <div style={{ width:'1.5rem', height:'1.5rem', background:'#1F2A44', borderRadius:'.3rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:'.7rem' }}>E</span>
                </div>
                <span style={{ fontWeight:700, color:'#0f172a', fontSize:'.875rem' }}>EQUA</span>
              </div>
              <p style={{ color:'#9ca3af', fontSize:'.75rem', margin:0 }}>&copy; 2026 EQUA</p>
              <div style={{ display:'flex', gap:'1.25rem' }}>
                {['Gizlilik','Şartlar'].map(l => (
                  <Link key={l} href="#" style={{ color:'#9ca3af', fontSize:'.75rem', textDecoration:'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color='#6b7280')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color='#9ca3af')}
                  >{l}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
