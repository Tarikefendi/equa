'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Campaign } from '@/types';
import Header from '@/components/Header';

import Link from 'next/link';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  const categories = ['İnsan Hakları', 'Çevre', 'Hayvan Hakları', 'Ekonomik Adalet', 'Sağlık', 'Eğitim', 'Diğer'];

  useEffect(() => {
    loadCampaigns();
  }, [selectedCategory, selectedStatus]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response: any = await api.getCampaigns({
        status: selectedStatus,
        category: selectedCategory,
        limit: 50,
      });
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      campaign.title.toLowerCase().includes(searchLower) ||
      campaign.description.toLowerCase().includes(searchLower) ||
      campaign.target_entity.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Kampanyalar</h1>
          <p className="text-text-secondary">Aktif kampanyaları keşfet ve destek ol</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Kampanya ara..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="concluded">Sonuçlandı</option>
              <option value="under_review">İncelemede</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-text-secondary">
          <span className="font-semibold text-text-primary">{filteredCampaigns.length}</span> kampanya bulundu
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse-slow">
                <div className="skeleton h-6 w-24 mb-4"></div>
                <div className="skeleton h-8 w-full mb-3"></div>
                <div className="skeleton h-20 w-full mb-4"></div>
                <div className="skeleton h-4 w-32"></div>
              </div>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Kampanya bulunamadı</h3>
            <p className="text-text-secondary mb-6">Farklı filtreler deneyin veya yeni bir kampanya oluşturun</p>
            <Link href="/campaigns/new" className="btn-primary inline-block">
              ➕ Yeni Kampanya Oluştur
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="card card-interactive group"
              >
                {/* Category & Status */}
                <div className="flex items-center justify-between mb-4">
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

                {/* Title */}
                <h3 className="text-xl font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-accent-primary transition-colors">
                  {campaign.title}
                </h3>

                {/* Description */}
                <p className="text-text-secondary mb-4 line-clamp-3 text-sm leading-relaxed">
                  {campaign.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-text-tertiary border-t border-border-color pt-4">
                  <div className="flex items-center space-x-2">
                    <span>🎯</span>
                    <span className="truncate">{campaign.target_entity}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👍</span>
                    <span className="font-semibold">{campaign.vote_count || 0}</span>
                  </div>
                </div>

                {/* Creator */}
                <div className="flex items-center space-x-2 mt-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold">
                    {campaign.creator_username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-text-secondary">{campaign.creator_username}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
