'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [pendingLawyers, setPendingLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'reports' | 'users' | 'lawyers'>('overview');

  useEffect(() => {
    // Check if user is admin or moderator
    if (user && user.role !== 'admin' && user.role !== 'moderator') {
      router.push('/');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, router]);

  const loadData = async () => {
    try {
      const [statsRes, campaignsRes, reportsRes, lawyersRes]: any = await Promise.all([
        api.getAdminDashboardStats(),
        api.getPendingCampaigns(10),
        api.getPendingReports(10),
        api.getPendingLawyers(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (campaignsRes.success) setPendingCampaigns(campaignsRes.data);
      if (reportsRes.success) setPendingReports(reportsRes.data);
      if (lawyersRes.success) setPendingLawyers(lawyersRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCampaign = async (campaignId: string) => {
    if (!confirm('Bu kampanyayı onaylamak istediğinizden emin misiniz?')) return;

    try {
      await api.approveCampaign(campaignId);
      alert('Kampanya onaylandı!');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Kampanya onaylanamadı');
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    const reason = prompt('Red sebebini girin:');
    if (!reason) return;

    try {
      await api.rejectCampaign(campaignId, reason);
      alert('Kampanya reddedildi!');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Kampanya reddedilemedi');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const resolution = prompt('Çözüm notunu girin:');
    if (!resolution) return;

    try {
      await api.updateReportStatus(reportId, 'resolved', resolution);
      alert('Rapor çözüldü!');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Rapor güncellenemedi');
    }
  };

  const handleVerifyLawyer = async (lawyerId: string) => {
    if (!confirm('Bu avukatı doğrulamak istediğinizden emin misiniz?')) return;

    try {
      await api.verifyLawyer(lawyerId);
      alert('Avukat doğrulandı!');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Avukat doğrulanamadı');
    }
  };

  const handleRejectLawyer = async (lawyerId: string) => {
    if (!confirm('Bu avukatı reddetmek istediğinizden emin misiniz?')) return;

    try {
      await api.rejectLawyer(lawyerId);
      alert('Avukat reddedildi!');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Avukat reddedilemedi');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Yetkisiz Erişim</h1>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-gray-600">Platform yönetim paneli</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '📊 Genel Bakış' },
              { id: 'campaigns', label: '📋 Kampanyalar', badge: pendingCampaigns.length },
              { id: 'reports', label: '🚨 Raporlar', badge: pendingReports.length },
              { id: 'users', label: '👥 Kullanıcılar' },
              { id: 'lawyers', label: '⚖️ Avukatlar', badge: pendingLawyers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm relative
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Toplam Kullanıcı</div>
                <div className="text-3xl font-bold text-gray-900">{stats.users.total_users}</div>
                <div className="text-xs text-green-600 mt-2">
                  +{stats.users.new_users_week} bu hafta
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Aktif Kampanya</div>
                <div className="text-3xl font-bold text-blue-600">{stats.campaigns.active_campaigns}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {stats.campaigns.pending_campaigns} onay bekliyor
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Bekleyen Rapor</div>
                <div className="text-3xl font-bold text-red-600">{stats.reports.pending_reports}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {stats.reports.reviewing_reports} inceleniyor
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Toplam Oy</div>
                <div className="text-3xl font-bold text-purple-600">{stats.engagement.total_votes}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {stats.engagement.total_signatures} imza
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Son 24 Saat Aktivite</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activity.campaigns_created}</div>
                  <div className="text-sm text-gray-600">Yeni Kampanya</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activity.campaigns_shared}</div>
                  <div className="text-sm text-gray-600">Paylaşım</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activity.campaigns_viewed}</div>
                  <div className="text-sm text-gray-600">Görüntülenme</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activity.total_activities}</div>
                  <div className="text-sm text-gray-600">Toplam Aktivite</div>
                </div>
              </div>
            </div>

            {/* Campaign Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Kampanya Dağılımı</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Aktif</span>
                    <span className="text-sm font-bold text-green-600">{stats.campaigns.active_campaigns}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.campaigns.active_campaigns / stats.campaigns.total_campaigns * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Onay Bekliyor</span>
                    <span className="text-sm font-bold text-yellow-600">{stats.campaigns.pending_campaigns}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.campaigns.pending_campaigns / stats.campaigns.total_campaigns * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Sonuçlandı</span>
                    <span className="text-sm font-bold text-gray-600">{stats.campaigns.concluded_campaigns}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.campaigns.concluded_campaigns / stats.campaigns.total_campaigns * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Kullanıcı Büyümesi</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Bu Hafta</span>
                    <span className="text-sm font-bold text-blue-600">+{stats.users.new_users_week}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.users.new_users_week / stats.users.total_users * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Bu Ay</span>
                    <span className="text-sm font-bold text-purple-600">+{stats.users.new_users_month}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.users.new_users_month / stats.users.total_users * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Doğrulanmış</span>
                    <span className="text-sm font-bold text-green-600">{stats.users.verified_users}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(stats.users.verified_users / stats.users.total_users * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Onay Bekleyen Kampanyalar</h3>
            </div>
            {pendingCampaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Onay bekleyen kampanya yok
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {campaign.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👤 {campaign.creator_username}</span>
                          <span>⭐ {campaign.creator_reputation} itibar</span>
                          <span>📅 {new Date(campaign.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApproveCampaign(campaign.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          ✓ Onayla
                        </button>
                        <button
                          onClick={() => handleRejectCampaign(campaign.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          ✗ Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Bekleyen Raporlar</h3>
            </div>
            {pendingReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Bekleyen rapor yok
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            {report.entity_type}
                          </span>
                          <span className="text-sm text-gray-600">
                            Rapor eden: {report.reporter_username}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Sebep: {report.reason}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {report.description}
                        </p>
                        <div className="text-sm text-gray-500">
                          📅 {new Date(report.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          ✓ Çöz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Kullanıcı Yönetimi</h3>
            <p className="text-gray-600">Kullanıcı yönetimi özellikleri yakında eklenecek...</p>
          </div>
        )}

        {/* Lawyers Tab */}
        {activeTab === 'lawyers' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Avukat Doğrulama</h3>
            
            {pendingLawyers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Doğrulama bekleyen avukat bulunmuyor
              </p>
            ) : (
              <div className="space-y-4">
                {pendingLawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {lawyer.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              Av. {lawyer.username}
                            </h4>
                            <p className="text-sm text-gray-600">{lawyer.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-500">Baro Numarası:</span>
                            <p className="font-medium text-gray-900">{lawyer.bar_number}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Şehir:</span>
                            <p className="font-medium text-gray-900">{lawyer.city}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Uzmanlık:</span>
                            <p className="font-medium text-gray-900">{lawyer.specialization}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Deneyim:</span>
                            <p className="font-medium text-gray-900">{lawyer.experience_years} yıl</p>
                          </div>
                        </div>

                        {lawyer.bio && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-500">Biyografi:</span>
                            <p className="text-gray-700 mt-1">{lawyer.bio}</p>
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          📅 Başvuru Tarihi: {new Date(lawyer.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleVerifyLawyer(lawyer.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium whitespace-nowrap"
                        >
                          ✓ Onayla
                        </button>
                        <button
                          onClick={() => handleRejectLawyer(lawyer.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium whitespace-nowrap"
                        >
                          ✗ Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
