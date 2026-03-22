'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  campaignId: string;
  updateId: number;
  onClose: () => void;
}

export default function EditHistoryModal({ campaignId, updateId, onClose }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (api.getCampaignUpdateHistory(campaignId, updateId) as Promise<any>)
      .then((res: any) => { if (res.success) setHistory(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId, updateId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-md border border-[#E5E7EB] w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#1F2A44]">📝 Düzenleme Geçmişi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Yükleniyor...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Düzenleme geçmişi bulunamadı.</p>
          ) : (
            history.map((h, i) => (
              <div key={h.id} className="border border-[#E5E7EB] rounded-md p-4 bg-[#FAFBFD]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1F2A44]">Versiyon {i + 1}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(h.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
                    })}
                  </span>
                </div>
                {h.old_title && (
                  <p className="text-xs font-semibold text-gray-700 mb-1">{h.old_title}</p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{h.old_content}</p>
                {h.old_source_url && (
                  <a
                    href={h.old_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline mt-1 inline-block truncate max-w-full"
                  >
                    {h.old_source_url}
                  </a>
                )}
                {h.reason && (
                  <p className="text-xs text-gray-400 mt-2 italic">Düzenleme notu: {h.reason}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
