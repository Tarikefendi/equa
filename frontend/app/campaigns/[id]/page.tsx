'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import CampaignStatusUpdates from '@/components/CampaignStatusUpdates';
import { useAuth } from '@/lib/auth-context';
import { getFingerprint } from '@/lib/use-fingerprint';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [signatureCount, setSignatureCount] = useState(0);
  const [userSignature, setUserSignature] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [orgResponses, setOrgResponses] = useState<any[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      loadCampaign();
      loadSignatures();
      loadOrgResponses();
      loadStatusUpdates();
      if (user) {
        loadUserSignature();
      }
    }
  }, [params.id, user]);

  const loadCampaign = async () => {
    try {
      const response: any = await api.getCampaignById(params.id as string);
      if (response.success && response.data) {
        if (response.data.evidence && typeof response.data.evidence === 'string') {
          response.data.evidence = JSON.parse(response.data.evidence);
        }
        setCampaign(response.data);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignatures = async () => {
    try {
      const [signaturesRes, countRes]: any = await Promise.all([
        api.getCampaignSignatures(params.id as string),
        api.getSignatureCount(params.id as string),
      ]);
      if (signaturesRes.success) setSignatures(signaturesRes.data || []);
      if (countRes.success) setSignatureCount(countRes.data?.count || 0);
    } catch (error) {
      console.error('Failed to load signatures:', error);
    }
  };

  const loadUserSignature = async () => {
    try {
      const response: any = await api.getUserSignature(params.id as string);
      if (response.success && response.data) {
        setUserSignature(response.data);
      }
    } catch (error) {
      // User hasn't signed yet
    }
  };

  const loadOrgResponses = async () => {
    try {
      const response: any = await api.getCampaignResponses(params.id as string);
      if (response.success) setOrgResponses(response.data || []);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  };

  const loadStatusUpdates = async () => {
    try {
      const response: any = await api.getStatusUpdates(params.id as string);
      if (response.success) setStatusUpdates(response.data || []);
    } catch (error) {
      console.error('Failed to load status updates:', error);
    }
  };

  const handleAddSignature = async () => {
    if (!user) {
      alert('İmza atmak için giriş yapmalısınız');
      router.push('/auth/login');
      return;
    }

    setSignatureLoading(true);
    try {
      const deviceFingerprint = await getFingerprint();
      await api.addSignature(
        params.id as string,
        signatureMessage,
        isAnonymous,
        deviceFingerprint
      );
      alert('✅ İmzanız eklendi!');
      setShowSignatureModal(false);
      setSignatureMessage('');
      setIsAnonymous(false);
      loadSignatures();
      loadUserSignature();
    } catch (error: any) {
      alert(error.message || 'İmza eklenemedi');
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!confirm('İmzanızı geri çekmek istediğinizden emin misiniz?')) return;

    try {
      await api.removeSignature(params.id as string);
      alert('İmzanız geri çekildi');
      setUserSignature(null);
      loadSignatures();
    } catch (error: any) {
      alert(error.message || 'İmza geri çekilemedi');
    }
  };

  // Generate file number based on campaign ID and date
  const generateFileNumber = () => {
    if (!campaign) return '';
    const year = new Date(campaign.created_at).getFullYear();
    const shortId = campaign.id.substring(0, 4).toUpperCase();
    return `EQ-${year}-${shortId}`;
  };

  // Calculate remaining days
  const calculateRemainingDays = () => {
    if (!campaign?.response_deadline_days) return null;
    
    let deadline: Date;
    
    // If response_deadline_date exists, use it
    if (campaign.response_deadline_date) {
      const isoDate = campaign.response_deadline_date.replace(' ', 'T');
      deadline = new Date(isoDate);
    } 
    // Otherwise calculate from created_at + response_deadline_days
    else {
      const createdAt = new Date(campaign.created_at);
      deadline = new Date(createdAt);
      deadline.setDate(deadline.getDate() + campaign.response_deadline_days);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-bg-secondary rounded w-1/2"></div>
            <div className="h-32 bg-bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Kampanya bulunamadı</h1>
          <Link href="/campaigns" className="btn-primary">
            Kampanyalara Dön
          </Link>
        </div>
      </div>
    );
  }

  const evidence = campaign.evidence || { links: [] };
  const deadlineDate = campaign.response_deadline_date
    ? new Date(campaign.response_deadline_date).toLocaleDateString('tr-TR')
    : null;
  const remainingDays = calculateRemainingDays();
  const fileNumber = generateFileNumber();
  const isCreator = user && campaign.creator_id === user.id;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header - Institutional */}
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Denetim Dosyası</p>
          <h1 className="text-3xl font-semibold text-[#1F2A44] mb-4 tracking-tight leading-tight">{campaign.title}</h1>
          
          {/* Meta Info - Subtle Dividers */}
          <div className="flex items-center gap-6 text-sm border-l-2 border-gray-300 pl-4">
            <span className="text-gray-500">Dosya No: <span className="font-mono font-semibold text-gray-900">{fileNumber}</span></span>
            <span className="text-gray-300 opacity-40">|</span>
            <span className="text-gray-500">Kategori: <span className="font-semibold text-gray-900">{campaign.category}</span></span>
            <span className="text-gray-300 opacity-40">|</span>
            <span className="text-gray-500">Durum: <span className="font-semibold text-gray-900">
              {campaign.status === 'active' ? 'Aktif' : campaign.status === 'concluded' ? 'Sonuçlandı' : 'İncelemede'}
            </span></span>
            {remainingDays !== null && (
              <>
                <span className="text-gray-300 opacity-40">|</span>
                <span className="text-gray-500">Kalan Süre: <span className="font-semibold text-gray-900">{remainingDays} Gün</span></span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* V2 Fields - Priority Content */}
            {(campaign.standard_reference || campaign.demanded_action) && (
              <div className="bg-white border border-[#E5E7EB] rounded-md p-6">
                <div className="space-y-5">
                  {campaign.demanded_action && (
                    <div className="bg-[#FAFBFD] p-4 rounded-md border-l-3 border-l-[3px] border-[#1F2A44]">
                      <h3 className="text-base font-semibold text-[#1F2A44] mb-3 tracking-tight pb-2 border-b border-gray-200">
                        Talep Edilen Aksiyon
                      </h3>
                      <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">
                        {campaign.demanded_action}
                      </p>
                    </div>
                  )}

                  {campaign.standard_reference && (
                    <div className="pt-5 border-t border-gray-200">
                      <h3 className="text-base font-semibold text-[#1F2A44] mb-2 tracking-tight">
                        Dayanılan İlke / Standart
                      </h3>
                      <p className="text-[15px] text-gray-700">{campaign.standard_reference}</p>
                      {campaign.standard_reference_other && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {campaign.standard_reference_other}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white border border-[#E5E7EB] rounded-md p-6">
              <h2 className="text-base font-semibold text-[#1F2A44] mb-3 tracking-tight">İddia Özeti</h2>
              <div className="text-[15px] text-gray-700 leading-relaxed space-y-3">
                {campaign.description.split('\n').map((paragraph: string, index: number) => (
                  <p key={index}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Evidence - Compact */}
            {evidence.links && evidence.links.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-md p-6">
                <h2 className="text-base font-semibold text-[#1F2A44] mb-3 tracking-tight">Kanıtlar</h2>
                <div className="space-y-1.5">
                  {evidence.links.map((link: string, index: number) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-[#F5F7FA] rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <span className="text-gray-500 text-sm">↗</span>
                      <span className="text-sm text-gray-700 truncate flex-1">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status Updates */}
            {statusUpdates.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">📊 Durum Güncellemeleri</h2>
                <CampaignStatusUpdates 
                  campaignId={params.id as string}
                  isCreator={user?.id === campaign.creator_id}
                />
              </div>
            )}

            {/* Support Section - Bottom */}
            <div className="bg-white border border-[#E5E7EB] rounded-md p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2 font-medium">Toplam Destek</p>
                <p className="text-3xl font-semibold text-[#1F2A44] mb-1">{signatureCount}</p>
                <p className="text-sm text-gray-500 mb-2">kişi</p>
                <p className="text-xs text-gray-400 mb-6">Bu dosyayı destekleyen kişi sayısı</p>
                
                <div className="flex justify-center">
                  {userSignature ? (
                    <button
                      onClick={handleRemoveSignature}
                      className="px-8 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Desteği Geri Çek
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSignatureModal(true)}
                      className="px-8 py-2.5 bg-[#1F2A44] text-white text-sm font-medium rounded-md hover:bg-[#2A3654] transition-colors"
                      disabled={campaign.status !== 'active'}
                    >
                      Destekle
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Responses */}
            {orgResponses.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">💬 Kurum Yanıtları</h2>
                <div className="space-y-4">
                  {orgResponses.map((response: any) => (
                    <div key={response.id} className="bg-bg-secondary p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text-primary">
                          {response.organization_name}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(response.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm">{response.response_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Lighter Background */}
          <div className="space-y-6 bg-[#F8FAFC] p-4 rounded-md">
            {/* File Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-md p-5">
              <h3 className="text-sm font-semibold text-[#1F2A44] mb-4 tracking-tight">Dosya Bilgileri</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Dosya No</span>
                  <p className="font-mono font-medium text-[#1F2A44] mt-1">{fileNumber}</p>
                </div>
                <div className="pt-3.5 border-t border-gray-50">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Durum</span>
                  <p className="font-medium text-[#1F2A44] mt-1">
                    {campaign.status === 'active'
                      ? 'Aktif'
                      : campaign.status === 'concluded'
                      ? 'Sonuçlandı'
                      : 'İncelemede'}
                  </p>
                </div>
                <div className="pt-3.5 border-t border-gray-50">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Kategori</span>
                  <p className="font-medium text-[#1F2A44] mt-1">{campaign.category}</p>
                </div>
                {remainingDays !== null && (
                  <div className="pt-3.5 border-t border-gray-50">
                    <span className="text-gray-600 text-xs uppercase tracking-wide">Kalan Süre</span>
                    <p className="font-medium text-[#1F2A44] mt-1">{remainingDays} Gün</p>
                  </div>
                )}
              </div>
            </div>

            {/* Target Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-md p-5">
              <h3 className="text-sm font-semibold text-[#1F2A44] mb-4 tracking-tight">Hedef Kuruluş</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Kuruluş</span>
                  <p className="font-medium text-[#1F2A44] mt-1">{campaign.target_entity}</p>
                </div>
                <div className="pt-3.5 border-t border-gray-50">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Tip</span>
                  <p className="font-medium text-[#1F2A44] mt-1">
                    {campaign.target_type === 'company'
                      ? 'Şirket'
                      : campaign.target_type === 'brand'
                      ? 'Marka'
                      : 'Hükümet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Supporters */}
            {signatures.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-md p-5">
                <h3 className="text-sm font-semibold text-[#1F2A44] mb-4 tracking-tight">Son Destekleyenler</h3>
                <div className="space-y-3">
                  {signatures.slice(0, 5).map((sig: any) => (
                    <div key={sig.id} className="flex items-center gap-2.5 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                        {sig.is_anonymous ? '?' : sig.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1F2A44] font-medium truncate text-sm">
                          {sig.is_anonymous ? 'Anonim' : sig.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sig.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">✍️ Kampanyayı İmzala</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Mesaj (Opsiyonel)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Neden bu kampanyayı destekliyorsunuz?"
                  value={signatureMessage}
                  onChange={(e) => setSignatureMessage(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="anonymous" className="text-sm text-text-secondary">
                  Anonim olarak imzala
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="btn-outline flex-1"
                  disabled={signatureLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSignature}
                  className="btn-primary flex-1"
                  disabled={signatureLoading}
                >
                  {signatureLoading ? '⏳ İmzalanıyor...' : '✍️ İmzala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
