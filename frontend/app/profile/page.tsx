'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePageV2() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [campaignsRes, signaturesRes]: any = await Promise.all([
        api.getMyCampaigns(),
        api.getMySignatures(),
      ]);

      if (campaignsRes.success) setCampaigns(campaignsRes.data || []);
      if (signaturesRes.success) setSignatures(signaturesRes.data || []);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-3xl font-bold">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-1">{user.username}</h1>
                <p className="text-text-secondary">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user.is_verified ? (
                    <span className="badge badge-success">✅ Doğrulanmış</span>
                  ) : (
                    <span className="badge badge-warning">⏳ Doğrulanmamış</span>
                  )}
                  {user.role === 'admin' && (
                    <span className="badge badge-primary">👑 Admin</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-outline">
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-6 text-center">
            <div className="text-4xl font-bold text-accent-primary mb-2">
              {campaigns.length}
            </div>
            <div className="text-sm text-text-secondary">Oluşturduğum Kampanyalar</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl font-bold text-accent-secondary mb-2">
              {signatures.length}
            </div>
            <div className="text-sm text-text-secondary">İmzaladığım Kampanyalar</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">
              {campaigns.reduce((sum, c) => sum + (c.vote_count || 0), 0)}
            </div>
            <div className="text-sm text-text-secondary">Toplam Destek</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Campaigns */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">📢 Kampanyalarım</h2>
              <Link href="/campaigns/new" className="btn-primary text-sm">
                ➕ Yeni
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📢</div>
                <p className="text-text-secondary mb-4">Henüz kampanya oluşturmadınız</p>
                <Link href="/campaigns/new" className="btn-primary">
                  İlk Kampanyanı Oluştur
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="block p-4 bg-bg-secondary rounded-xl hover:bg-bg-hover transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text-primary line-clamp-1 flex-1">
                        {campaign.title}
                      </h3>
                      <span
                        className={`badge ml-2 ${
                          campaign.status === 'active'
                            ? 'badge-success'
                            : campaign.status === 'concluded'
                            ? 'badge-secondary'
                            : 'badge-warning'
                        }`}
                      >
                        {campaign.status === 'active'
                          ? '🟢'
                          : campaign.status === 'concluded'
                          ? '✅'
                          : '⏳'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>👍 {campaign.vote_count || 0} destek</span>
                      <span>📅 {new Date(campaign.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Signatures */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">✍️ İmzalarım</h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : signatures.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✍️</div>
                <p className="text-text-secondary mb-4">Henüz kampanya imzalamadınız</p>
                <Link href="/campaigns" className="btn-primary">
                  Kampanyaları Keşfet
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {signatures.map((signature) => (
                  <Link
                    key={signature.id}
                    href={`/campaigns/${signature.campaign_id}`}
                    className="block p-4 bg-bg-secondary rounded-xl hover:bg-bg-hover transition-colors"
                  >
                    <h3 className="font-semibold text-text-primary line-clamp-1 mb-2">
                      {signature.campaign_title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span>
                        {signature.is_anonymous ? '🔒 Anonim' : '👤 Açık'}
                      </span>
                      <span>📅 {new Date(signature.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {signature.message && (
                      <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                        "{signature.message}"
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin Link */}
        {user.role === 'admin' && (
          <div className="card p-6 mt-6 bg-gradient-to-r from-accent-primary to-accent-secondary">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">👑 Admin Paneli</h3>
                <p className="text-white text-opacity-90 text-sm">
                  Kampanyaları yönet, kullanıcıları kontrol et
                </p>
              </div>
              <Link href="/admin" className="btn-outline bg-white text-accent-primary hover:bg-opacity-90">
                Panele Git →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
