'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  response_received: 'Yanıt Alındı',
  disputed: 'İtiraz Edildi',
  resolved: 'Çözüldü',
  archived: 'Arşivlendi',
};

const SORT_OPTIONS = [
  { value: 'relevant', label: 'En ilgili' },
  { value: 'newest', label: 'En yeni' },
  { value: 'support', label: 'En çok destek alan' },
  { value: 'views', label: 'En çok görüntülenen' },
];

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />
      <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-400">Yükleniyor...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('relevant');

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    (api.searchCampaigns(q.trim(), sort) as Promise<any>)
      .then((res: any) => setResults(res.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, sort]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          {q ? (
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-[#1F2A44]">&quot;{q}&quot;</span> için{' '}
              {loading ? '...' : <span className="font-semibold text-[#1F2A44]">{results.length}</span>} sonuç bulundu
            </p>
          ) : (
            <p className="text-sm text-gray-500">Arama yapmak için bir kelime girin.</p>
          )}
        </div>
        {q && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs border border-[#E5E7EB] rounded-md px-3 py-1.5 bg-white text-[#1F2A44] focus:outline-none focus:border-[#1F2A44] cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-md p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length === 0 && q ? (
        <div className="bg-white border border-[#E5E7EB] rounded-md p-8 text-center">
          <p className="text-gray-400 text-sm">Sonuç bulunamadı.</p>
          <p className="text-gray-400 text-xs mt-1">Farklı bir kelime deneyin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((c: any) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <div className="bg-white border border-[#E5E7EB] rounded-md p-5 hover:border-[#1F2A44] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-[#1F2A44] mb-1 leading-snug">{c.title}</h2>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {c.entity_name && <span>{c.entity_name}</span>}
                  <span>{c.category}</span>
                  <span>{c.signature_count} destek</span>
                  {c.views > 0 && <span>👁 {c.views}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
