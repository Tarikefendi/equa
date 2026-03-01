'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';

export default function CampaignV2Preview() {
  const params = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaign();
  }, [params.id]);

  const loadCampaign = async () => {
    try {
      const response: any = await api.getCampaignById(params.id as string);
      if (response.success && response.data) {
        setCampaign(response.data);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-secondary rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-bg-secondary rounded w-1/2 mb-8"></div>
            <div className="h-32 bg-bg-secondary rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Kampanya bulunamadı</h1>
          <Link href="/campaigns" className="btn-primary">
            Kampanyalara Dön
          </Link>
        </div>
      </div>
    );
  }

  const evidence = campaign.evidence ? JSON.parse(campaign.evidence) : { links: [] };
  const deadlineDate = campaign.response_deadline_date 
    ? new Date(campaign.response_deadline_date).toLocaleDateString('tr-TR')
    : 'Belirtilmemiş';

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-primary">{campaign.category}</span>
            <span className={`badge ${
              campaign.status === 'active' ? 'badge-success' :
              campaign.status === 'concluded' ? 'badge-secondary' :
              'badge-warning'
            }`}>
              {campaign.status === 'active' ? '🟢 Aktif' :
               campaign.status === 'concluded' ? '✅ Sonuçlandı' :
               '⏳ İncelemede'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>🎯 {campaign.target_entity}</span>
            <span>👤 {campaign.creator_username}</span>
            <span>📅 {new Date(campaign.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* V2 NEW FIELDS - Highlighted */}
        <div className="card p-6 mb-6 border-2 border-accent-primary">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">🆕</span>
            V2 Yeni Özellikler
          </h2>

          <div className="space-y-4">
            {/* Standard Reference */}
            <div className="bg-bg-secondary p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔎</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1">
                    Dayanılan İlke / Standart
                  </h3>
                  <p className="text-text-secondary">
                    {campaign.standard_reference}
                    {campaign.standard_reference_other && (
                      <span className="block mt-1 text-sm italic">
                        → {campaign.standard_reference_other}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Demanded Action */}
            <div className="bg-bg-secondary p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1">
                    Talep Edilen Aksiyon
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {campaign.demanded_action}
                  </p>
                </div>
              </div>
            </div>

            {/* Response Deadline */}
            <div className="bg-bg-secondary p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1">
                    Yanıt Süresi
                  </h3>
                  <p className="text-text-secondary">
                    {campaign.response_deadline_days} gün
                    <span className="block mt-1 text-sm">
                      Son Tarih: <span className="font-semibold text-accent-primary">{deadlineDate}</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">📝 Açıklama</h2>
          <div className="prose prose-sm max-w-none text-text-secondary">
            {campaign.description.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Evidence */}
        {evidence.links && evidence.links.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">📎 Kanıtlar</h2>
            <div className="space-y-2">
              {evidence.links.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-bg-secondary rounded-xl hover:bg-bg-hover transition-colors"
                >
                  <span className="text-accent-primary">🔗</span>
                  <span className="text-sm text-text-primary truncate flex-1">{link}</span>
                  <span className="text-xs text-text-tertiary">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Target Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">🎯 Hedef Kuruluş</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">İsim:</span>
              <span className="font-semibold text-text-primary">{campaign.target_entity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Tip:</span>
              <span className="font-semibold text-text-primary">
                {campaign.target_type === 'company' ? 'Şirket' :
                 campaign.target_type === 'brand' ? 'Marka' : 'Hükümet/Devlet'}
              </span>
            </div>
            {campaign.target_email && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Email:</span>
                <span className="font-semibold text-text-primary">{campaign.target_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/campaigns" className="btn-outline flex-1">
            ← Kampanyalara Dön
          </Link>
          <Link href={`/campaigns/${campaign.id}`} className="btn-primary flex-1">
            Tam Detayları Gör →
          </Link>
        </div>
      </div>
    </div>
  );
}
