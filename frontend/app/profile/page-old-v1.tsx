'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'badges' | 'following'>('campaigns');
  const [badges, setBadges] = useState<any[]>([]);
  const [followedCampaigns, setFollowedCampaigns] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any>(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [campaignsRes, badgesRes, followedRes, reputationRes, phoneStatusRes]: any = await Promise.all([
        api.getMyCampaigns(),
        api.getUserBadges(),
        api.getMyFollowedCampaigns(),
        api.getMyReputation(),
        api.getPhoneVerificationStatus(),
      ]);

      if (campaignsRes.success) setMyCampaigns(campaignsRes.data);
      if (badgesRes.success) setBadges(badgesRes.data);
      if (followedRes.success) setFollowedCampaigns(followedRes.data);
      if (reputationRes.success) setReputation(reputationRes.data);
      if (phoneStatusRes.success) setPhoneVerified(phoneStatusRes.data.phoneVerified);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text-primary">{user.username}</h1>
              </div>
              <p className="text-text-secondary mb-4">{user.email}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm mb-4">
                <div>
                  <span className="text-2xl font-bold text-text-primary">{myCampaigns.length}</span>
                  <span className="text-text-secondary ml-2">Kampanya</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-text-primary">{badges.length}</span>
                  <span className="text-text-secondary ml-2">Rozet</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-text-primary">{followedCampaigns.length}</span>
                  <span className="text-text-secondary ml-2">Takip</span>
                </div>
              </div>

              {/* Reputation */}
              {reputation && (
                <div className="mb-4">
                  <ReputationBadge 
                    points={reputation.total_points}
                    level={reputation.level}
                    showProgress={true}
                  />
                </div>
              )}

              {/* Phone Verification Status */}
              <div className="mb-4">
                {phoneVerified ? (
                  <div className="inline-flex items-center space-x-2 bg-accent-success bg-opacity-10 border border-accent-success border-opacity-20 text-accent-success px-3 py-1.5 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Telefon Doğrulandı</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPhoneVerification(true)}
                    className="inline-flex items-center space-x-2 bg-accent-warning bg-opacity-10 border border-accent-warning border-opacity-20 text-accent-warning px-3 py-1.5 rounded-lg text-sm hover:bg-accent-warning hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Telefonu Doğrula</span>
                  </button>
                )}
              </div>

              <Link href="/settings/notifications" className="text-accent-primary hover:underline text-sm font-medium">
                ⚙️ Bildirim Ayarları →
              </Link>
            </div>
          </div>
        </div>

        {/* Phone Verification Modal */}
        {showPhoneVerification && (
          <PhoneVerificationModal
            onClose={() => setShowPhoneVerification(false)}
            onVerified={() => {
              setPhoneVerified(true);
              alert('Telefon numaranız başarıyla doğrulandı!');
              loadData(); // Refresh data
            }}
          />
        )}

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex border-b border-border-color">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'campaigns'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              📋 Kampanyalarım
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'following'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              ⭐ Takip Ettiklerim ({followedCampaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'badges'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              🏆 Rozetlerim ({badges.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'campaigns' && (
              loading ? (
                <div className="text-center py-12 text-text-secondary">Yükleniyor...</div>
              ) : myCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📢</div>
                  <p className="text-text-secondary mb-4">Henüz kampanya oluşturmadınız</p>
                  <Link href="/campaigns/new" className="btn-primary inline-block">
                    ➕ İlk Kampanyanı Oluştur
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myCampaigns.map((campaign) => (
                    <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="card card-interactive">
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge badge-primary">{campaign.category}</span>
                        <span className={`badge ${
                          campaign.status === 'active' ? 'badge-success' :
                          campaign.status === 'concluded' ? 'badge-secondary' :
                          'badge-warning'
                        }`}>
                          {campaign.status === 'active' ? 'Aktif' : 
                           campaign.status === 'concluded' ? 'Sonuçlandı' : 
                           'İncelemede'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-text-tertiary">
                        <span>🎯 {campaign.target_entity}</span>
                        <span>👍 {campaign.vote_count || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {activeTab === 'following' && (
              followedCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-text-secondary mb-4">Henüz kampanya takip etmiyorsunuz</p>
                  <Link href="/campaigns" className="btn-primary inline-block">
                    Kampanyaları Keşfet
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {followedCampaigns.map((campaign) => (
                    <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="card card-interactive">
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge badge-primary">{campaign.category}</span>
                        <span className="badge badge-success">Aktif</span>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span>⭐ {campaign.follower_count || 0} takipçi</span>
                        <span>✍️ {campaign.signature_count || 0} imza</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {activeTab === 'badges' && (
              badges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-text-secondary mb-2">Henüz rozet kazanmadınız</p>
                  <p className="text-sm text-text-tertiary">
                    Kampanya oluşturun, oy verin ve yorum yapın!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div key={badge.id} className="card text-center hover-lift">
                      <div className="text-4xl mb-3">{badge.badge_name.split(' ')[0]}</div>
                      <h3 className="font-bold text-text-primary mb-1 text-sm">
                        {badge.badge_name}
                      </h3>
                      <p className="text-xs text-text-secondary mb-2">
                        {badge.badge_description}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(badge.earned_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
