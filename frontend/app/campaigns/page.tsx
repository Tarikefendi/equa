'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';

type SortMode = 'trending' | 'supported' | 'latest';
type StatusFilter = '' | 'active' | 'response_received' | 'under_review';

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  response_received: 'Yanit Alindi',
  no_response: 'Yanitsiz',
  resolved: 'Cozuldu',
  closed: 'Kapatildi',
  archived: 'Arsiv',
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active: { background: '#dcfce7', color: '#15803d' },
  response_received: { background: '#dbeafe', color: '#1e40af' },
  no_response: { background: '#fee2e2', color: '#991b1b' },
  resolved: { background: '#f0fdf4', color: '#166534' },
  closed: { background: '#f3f4f6', color: '#6b7280' },
  archived: { background: '#f3f4f6', color: '#6b7280' },
};

const categories = ['Insan Haklari', 'Cevre', 'Hayvan Haklari', 'Ekonomik Adalet', 'Saglik', 'Egitim', 'Tuketici Haklari', 'Calisma Haklari', 'Diger'];

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'B';
  return String(n);
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => { loadCampaigns(); }, [sortMode, selectedCategory, selectedStatus]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (sortMode === 'trending' && !selectedStatus) {
        const res: any = await api.getTrendingCampaigns();
        data = res.data || res || [];
        if (selectedCategory) data = data.filter((c: any) => c.category === selectedCategory);
      } else {
        const params: any = { category: selectedCategory || undefined, sort_by: sortMode === 'supported' ? 'signatures' : 'created_at', sort_order: 'DESC', limit: 50, ...(selectedStatus ? { status: selectedStatus } : {}) };
        const res: any = await api.getCampaigns(params);
        data = res.data || [];
      }
      setCampaigns(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = campaigns.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.target_entity?.toLowerCase().includes(q);
  });

  const hasActiveFilters = selectedCategory || selectedStatus;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Header />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>Kampanyalar</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>Aktif kampanyalari kesf et ve destek ol</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <input type="text" placeholder="Kampanya ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {([{ key: 'trending' as SortMode, label: 'Trend' }, { key: 'supported' as SortMode, label: 'En Desteklenen' }, { key: 'latest' as SortMode, label: 'En Yeni' }]).map(({ key, label }) => (
              <button key={key} onClick={() => setSortMode(key)} style={{ padding: '7px 14px', borderRadius: 6, border: sortMode === key ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: sortMode === key ? '#1F2A44' : '#fff', color: sortMode === key ? '#fff' : '#374151' }}>{label}</button>
            ))}
          </div>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}>
            <option value="">Tum Durumlar</option>
            <option value="active">Aktif</option>
            <option value="response_received">Yanit Alindi</option>
            <option value="resolved">Cozuldu</option>
            <option value="under_review">Incelemede</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <button onClick={() => setSelectedCategory('')} style={{ padding: '4px 12px', borderRadius: 4, border: selectedCategory === '' ? '1px solid #1F2A44' : '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: selectedCategory === '' ? '#1F2A44' : '#fff', color: selectedCategory === '' ? '#fff' : '#374151' }}>Tumu</button>
          {categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '4px 12px', borderRadius: 4, border: selectedCategory === cat ? '1px solid #1F2A44' : '1px solid #e5e7eb', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: selectedCategory === cat ? '#1F2A44' : '#fff', color: selectedCategory === cat ? '#fff' : '#374151' }}>{cat}</button>))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}><span style={{ fontWeight: 700, color: '#0f172a' }}>{filtered.length}</span> kampanya</p>
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedCategory && (<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '3px 10px', color: '#374151' }}>{selectedCategory}<button onClick={() => setSelectedCategory('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0 }}>x</button></span>)}
              {selectedStatus && (<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '3px 10px', color: '#374151' }}>{STATUS_LABEL[selectedStatus] || selectedStatus}<button onClick={() => setSelectedStatus('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0 }}>x</button></span>)}
              <button onClick={() => { setSelectedCategory(''); setSelectedStatus(''); }} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Filtreleri temizle</button>
            </div>
          )}
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (<div key={i} style={{ background: '#fff', borderRadius: 10, padding: 24, border: '1px solid #e5e7eb' }}><div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, marginBottom: 12, width: '40%' }} /><div style={{ height: 20, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 56, background: '#f3f4f6', borderRadius: 4 }} /></div>))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Kampanya bulunamadi</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasActiveFilters && (<button onClick={() => { setSelectedCategory(''); setSelectedStatus(''); setSearch(''); }} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}>Filtreleri Sifirla</button>)}
              <Link href="/campaigns/new" style={{ padding: '9px 18px', borderRadius: 6, background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Yeni Kampanya Olustur</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((campaign, index) => {
              const isTop3 = index < 3 && !search;
              const supportCount = campaign.support_count || campaign.signature_count || 0;
              const statusStyle = STATUS_STYLE[campaign.status] || { background: '#f3f4f6', color: '#6b7280' };
              const isHovered = hoveredId === campaign.id;
              const isUrgent = campaign.status === 'no_response';
              const microProof = supportCount > 0 ? (supportCount >= 20 ? 'Gundemde' : 'Destek almaya devam ediyor') : 'Ilk destekci sen ol';
              const microColor = supportCount > 0 ? '#16a34a' : '#94a3b8';
              return (
                <Link key={campaign.id} href={'/campaigns/' + campaign.id} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div onMouseEnter={() => setHoveredId(campaign.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: '#fff', borderRadius: 10, padding: '18px 20px 14px', border: isTop3 ? (isHovered ? '1.5px solid #1d4ed8' : '1.5px solid #bfdbfe') : (isHovered ? '1px solid #93c5fd' : '1px solid #e5e7eb'), height: '100%', boxSizing: 'border-box', boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s', transform: isHovered ? 'translateY(-3px)' : 'none', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {isTop3 && (<div style={{ position: 'absolute', top: -1, right: 12, background: '#1d4ed8', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: '0 0 6px 6px', letterSpacing: '0.06em' }}>ONE CIKAN</div>)}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {campaign.category && (<span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#94a3b8', fontWeight: 500 }}>{campaign.category}</span>)}
                        {isUrgent && (<span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#fef2f2', color: '#dc2626' }}>Acil</span>)}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap', ...statusStyle }}>{STATUS_LABEL[campaign.status] || campaign.status}</span>
                    </div>
                    <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11, color: '#94a3b8' }}>Hedef: </span><span style={{ fontSize: 11, color: '#1F2A44', fontWeight: 600 }}>{campaign.target_entity || '-'}</span></div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{campaign.title}</h3>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{campaign.description || 'Detaylar icin tiklayin.'}</p>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{formatCount(supportCount)}</span><span style={{ fontSize: 12, color: '#94a3b8' }}>destek</span></div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isHovered ? '#1d4ed8' : '#cbd5e1', transition: 'color 0.2s' }}>Destek ver</span>
                      </div>
                      <p style={{ fontSize: 11, color: microColor, margin: '4px 0 0', fontWeight: 500 }}>{microProof}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}