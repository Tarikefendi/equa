'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { api } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  company: 'Şirket',
  government: 'Kamu Kurumu',
  organization: 'Sivil Toplum',
  person: 'Kişi',
  other: 'Diğer',
};

function EntityCard({ entity: e }: { entity: any }) {
  const [hovered, setHovered] = useState(false);
  const [actionHovered, setActionHovered] = useState(false);

  const campaignCount = parseInt(e.campaign_count) || 0;
  const totalSupport = parseInt(e.total_support) || 0;
  const followerCount = parseInt(e.follower_count) || 0;

  const metaParts: React.ReactNode[] = [];
  if (e.type) metaParts.push(
    <span key="type" style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '0.1rem 0.45rem', borderRadius: '0.25rem' }}>
      {TYPE_LABELS[e.type] || e.type}
    </span>
  );
  if (campaignCount > 0) metaParts.push(
    <span key="campaigns" style={{ fontSize: '0.72rem', color: '#6b7280' }}>
      <span style={{ fontWeight: 600, color: '#374151' }}>{campaignCount}</span> kampanya
    </span>
  );
  if (totalSupport > 0) metaParts.push(
    <span key="support" style={{ fontSize: '0.72rem', color: '#6b7280' }}>
      <span style={{ fontWeight: 600, color: '#374151' }}>{totalSupport.toLocaleString('tr-TR')}</span> destek
    </span>
  );
  if (followerCount > 0) metaParts.push(
    <span key="followers" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
      {followerCount} takipçi
    </span>
  );

  return (
    <Link href={`/entities/${e.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          border: `1px solid ${hovered ? '#9ca3af' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          padding: '1rem 1.125rem',
          background: hovered ? '#f9fafb' : '#fff',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left: content */}
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Name + verified badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{e.name}</span>
            {e.verified && (
              <span style={{
                fontSize: '0.65rem', color: '#6b7280', background: '#f3f4f6',
                border: '1px solid #e5e7eb', padding: '0.05rem 0.35rem',
                borderRadius: '0.2rem', fontWeight: 400, letterSpacing: '0.01em',
              }}>
                Doğrulandı
              </span>
            )}
          </div>

          {/* Description */}
          {e.description && (
            <p style={{
              fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.375rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '32rem',
            }}>
              {e.description}
            </p>
          )}

          {/* Metadata row */}
          {metaParts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {metaParts.map((part, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {i > 0 && <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>·</span>}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: action */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: actionHovered ? '#0f172a' : '#374151',
            textDecoration: actionHovered ? 'underline' : 'none',
            whiteSpace: 'nowrap',
            transition: 'color 0.12s',
          }}
          onMouseEnter={() => setActionHovered(true)}
          onMouseLeave={() => setActionHovered(false)}
        >
          Kampanyaları Gör
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

const inp: React.CSSProperties = {
  width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '9px 14px', background: '#f9fafb', boxSizing: 'border-box',
  outline: 'none', color: '#1F2A44',
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    (api.searchEntities('') as Promise<any>)
      .then((res: any) => setEntities(res.data || []))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter(e => {
    if (!e.name?.trim()) return false;
    const lower = q.toLowerCase();
    return (
      e.name?.toLowerCase().includes(lower) ||
      e.description?.toLowerCase().includes(lower)
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />

      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Kurumlar</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Kurumları incele, kampanyaları gör ve aksiyon al
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Kurum adı ara (örn: Türk Telekom)"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...inp, paddingLeft: 36, borderColor: focused ? '#9ca3af' : '#e5e7eb', transition: 'border-color 0.15s' }}
          />
        </div>

        {/* Count */}
        {!loading && (
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 1rem' }}>
            {filtered.length} kurum listeleniyor
          </p>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem 1.125rem', background: '#f9fafb' }}>
                <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '30%', marginBottom: 8 }} />
                <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
              {q ? `"${q}" için kurum bulunamadı.` : 'Henüz kurum eklenmemiş.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filtered.map((e: any) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
