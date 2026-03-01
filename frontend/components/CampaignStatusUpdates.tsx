'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface StatusUpdate {
  id: string;
  campaign_id: string;
  user_id: string;
  status_type: string;
  title: string;
  description: string;
  documents: any;
  is_milestone: number;
  created_at: string;
  username: string;
}

interface Props {
  campaignId: string;
  isCreator: boolean;
}

const statusTypeLabels: { [key: string]: { label: string; icon: string; color: string } } = {
  in_progress: { label: 'Devam Ediyor', icon: '🔄', color: 'bg-blue-100 text-blue-800' },
  legal_action: { label: 'Hukuki İşlem', icon: '⚖️', color: 'bg-purple-100 text-purple-800' },
  court_filed: { label: 'Mahkemeye Başvuruldu', icon: '🏛️', color: 'bg-indigo-100 text-indigo-800' },
  hearing_scheduled: { label: 'Duruşma Tarihi', icon: '📅', color: 'bg-yellow-100 text-yellow-800' },
  won: { label: 'Kazanıldı', icon: '🎉', color: 'bg-green-100 text-green-800' },
  partially_won: { label: 'Kısmen Kazanıldı', icon: '✅', color: 'bg-teal-100 text-teal-800' },
  rejected: { label: 'Reddedildi', icon: '❌', color: 'bg-red-100 text-red-800' },
  settled: { label: 'Anlaşma Sağlandı', icon: '🤝', color: 'bg-emerald-100 text-emerald-800' },
  other: { label: 'Diğer', icon: '📌', color: 'bg-gray-100 text-gray-800' },
};

export default function CampaignStatusUpdates({ campaignId, isCreator }: Props) {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusType, setStatusType] = useState('in_progress');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStatusUpdates();
  }, [campaignId]);

  const loadStatusUpdates = async () => {
    try {
      const response: any = await api.getStatusUpdates(campaignId);
      if (response.success && response.data) {
        setStatusUpdates(response.data);
      }
    } catch (error) {
      console.error('Failed to load status updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Başlık gereklidir');
      return;
    }

    setSubmitting(true);
    try {
      await api.createStatusUpdate(campaignId, {
        statusType,
        title,
        description,
        isMilestone,
      });
      alert('Durum güncellemesi eklendi!');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setStatusType('in_progress');
      setIsMilestone(false);
      loadStatusUpdates();
    } catch (error: any) {
      alert(error.message || 'Durum güncellemesi eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!confirm('Bu güncellemeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.deleteStatusUpdate(updateId);
      alert('Güncelleme silindi');
      loadStatusUpdates();
    } catch (error: any) {
      alert(error.message || 'Güncelleme silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 Kampanya Durumu</h2>
          {isCreator && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Durum Ekle
            </button>
          )}
        </div>

        {statusUpdates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Henüz durum güncellemesi yok
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              {statusUpdates.map((update, index) => {
                const statusInfo = statusTypeLabels[update.status_type] || statusTypeLabels.other;
                return (
                  <div key={update.id} className="relative pl-8 pb-8">
                    {/* Timeline line */}
                    {index !== statusUpdates.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-300"></div>
                    )}
                    
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                      update.is_milestone ? 'bg-yellow-400 ring-4 ring-yellow-100' : 'bg-blue-500'
                    }`}>
                      {update.is_milestone ? '⭐' : ''}
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                            {update.is_milestone === 1 && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                ⭐ Önemli
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {update.title}
                          </h3>
                          {update.description && (
                            <p className="text-gray-700 mb-2">{update.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{update.username}</span>
                            <span>•</span>
                            <span>{new Date(update.created_at).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                        {isCreator && (
                          <button
                            onClick={() => handleDelete(update.id)}
                            className="text-red-600 hover:text-red-700 ml-4"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Status Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📊 Durum Güncellemesi Ekle</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum Tipi
                  </label>
                  <select
                    value={statusType}
                    onChange={(e) => setStatusType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(statusTypeLabels).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Mahkemeye başvuru yapıldı"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detaylı açıklama..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="milestone"
                    checked={isMilestone}
                    onChange={(e) => setIsMilestone(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="milestone" className="text-sm text-gray-700">
                    ⭐ Bu önemli bir kilometre taşı
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
