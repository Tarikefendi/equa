'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import EditHistoryModal from '@/components/EditHistoryModal';
import { useAuth } from '@/lib/auth-context';
import EvidenceCredibilityBadge from '@/components/EvidenceCredibilityBadge';
import { getFingerprint } from '@/lib/use-fingerprint';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const updateRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'genel' | 'kanitlar' | 'zaman'>('genel');

  const [signatures, setSignatures] = useState<any[]>([]);
  const [signatureCount, setSignatureCount] = useState(0);
  const [userSignature, setUserSignature] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);

  const [copySuccess, setCopySuccess] = useState(false);
  const [structuredEvidence, setStructuredEvidence] = useState<any[]>([]);
  const [pendingEvidence, setPendingEvidence] = useState<any[]>([]);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState('link');
  const [evidenceCredibilityType, setEvidenceCredibilityType] = useState('user_submission');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [flaggingEvidenceId, setFlaggingEvidenceId] = useState<string | null>(null);

  const [campaignUpdates, setCampaignUpdates] = useState<any[]>([]);
  const [updateContent, setUpdateContent] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateSourceUrl, setUpdateSourceUrl] = useState('');
  const [updateSubtype, setUpdateSubtype] = useState('general');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateTypeFilter, setUpdateTypeFilter] = useState('all');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [historyModalUpdateId, setHistoryModalUpdateId] = useState<number | null>(null);
  const [highlightedUpdateId, setHighlightedUpdateId] = useState<number | null>(null);
  const [copiedUpdateId, setCopiedUpdateId] = useState<number | null>(null);

  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusDescription, setStatusDescription] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [dailyChangesRemaining, setDailyChangesRemaining] = useState<number | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [userReport, setUserReport] = useState<any>(null);

  const [showShareCard, setShowShareCard] = useState(false);
  const [entityMetrics, setEntityMetrics] = useState<any>(null);
  const [investigationSummary, setInvestigationSummary] = useState<any>(null);
  const [investigationToggling, setInvestigationToggling] = useState(false);
  const [transparencyScore, setTransparencyScore] = useState<any>(null);
  const [victoryData, setVictoryData] = useState<any>(null);
  const [momentum, setMomentum] = useState<any>(null);
  const [legalStatus, setLegalStatus] = useState<any>(null);
  const [legalRequesting, setLegalRequesting] = useState(false);
  const [milestone, setMilestone] = useState<any>(null);

  const STATUS_LABELS: Record<string, string> = {
    active: 'Yanıt Bekliyor',
    response_received: 'Yanıt Alındı',
    no_response: 'Kurum Yanıt Vermedi',
    resolved: 'Çözüldü',
    closed_unresolved: 'Çözümsüz Kapandı',
    closed: 'Kapatıldı',
    archived: 'Arşivlendi',
  };

  const OWNER_TRANSITIONS: Record<string, string[]> = {
    active: ['response_received', 'resolved', 'closed_unresolved', 'archived'],
    response_received: ['resolved', 'closed_unresolved', 'archived'],
    resolved: ['archived'],
    closed_unresolved: ['archived'],
    archived: [],
  };

  useEffect(() => {
    if (params.id) {
      loadCampaign();
      loadSignatures();
      loadStatusUpdates();
      loadCampaignUpdates();
      loadFollowStatus();
      loadStructuredEvidence();
      loadStatusHistory();
      if (user) {
        loadUserSignature();
        loadPendingEvidence();
        loadUserReport();
      }
    }
  }, [params.id, user]);

  const loadVictory = async () => {
    try {
      const res: any = await api.getCampaignVictory(params.id as string);
      if (res.success && res.data?.is_victory) setVictoryData(res.data);
    } catch {}
  };

  const loadMomentum = async () => {
    try {
      const res: any = await api.getCampaignMomentum(params.id as string);
      if (res.success) setMomentum(res.data);
    } catch {}
  };

  const loadMilestone = async () => {
    try {
      const res: any = await api.getCampaignMilestone(params.id as string);
      if (res.success) setMilestone(res.data);
    } catch {}
  };

  const loadLegalStatus = async () => {
    try {
      const res: any = await api.getCampaignLegalStatus(params.id as string);
      if (res.success) setLegalStatus(res.data);
    } catch {}
  };

  const loadInvestigationSummary = async () => {
    try {
      const res: any = await api.getInvestigationSummary(params.id as string);
      if (res.success) setInvestigationSummary(res.data);
    } catch {}
  };

  const loadCampaign = async () => {
    try {
      const response: any = await api.getCampaignById(params.id as string);
      if (response.success && response.data) {
        if (response.data.evidence && typeof response.data.evidence === 'string') {
          response.data.evidence = JSON.parse(response.data.evidence);
        }
        setCampaign(response.data);
        api.recordCampaignView(params.id as string).catch(() => {});
        if (response.data.entity_slug) {
          (api.getEntityMetrics(response.data.entity_slug) as Promise<any>)
            .then((res: any) => { if (res.data?.metrics_available) setEntityMetrics(res.data); })
            .catch(() => {});
          (api.getEntityTransparencyScore(response.data.entity_slug) as Promise<any>)
            .then((res: any) => { if (res.data?.transparency_score != null) setTransparencyScore(res.data); })
            .catch(() => {});
        }
        if (response.data.investigation_mode) loadInvestigationSummary();
        if (response.data.status === 'resolved') loadVictory();
        loadMomentum();
        loadMilestone();
        loadLegalStatus();
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
    } catch {}
  };

  const loadUserSignature = async () => {
    try {
      const response: any = await api.getUserSignature(params.id as string);
      if (response.success && response.data) setUserSignature(response.data);
    } catch {}
  };

  const loadStructuredEvidence = async () => {
    try {
      const response: any = await api.getCampaignEvidence(params.id as string);
      if (response.success) setStructuredEvidence(response.data || []);
    } catch {}
  };

  const loadStatusHistory = async () => {
    try {
      const response: any = await api.getCampaignStatusHistory(params.id as string);
      if (response.success) setStatusHistory(response.data || []);
    } catch {}
  };

  const loadUserReport = async () => {
    try {
      const response: any = await api.getUserCampaignReport(params.id as string);
      if (response.success) setUserReport(response.data);
    } catch {}
  };

  const loadPendingEvidence = async () => {
    try {
      const response: any = await api.getPendingEvidence(params.id as string);
      if (response.success) setPendingEvidence(response.data || []);
    } catch {}
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadStatusUpdates = async () => { try { await api.getStatusUpdates(params.id as string); } catch {} };

  const loadCampaignUpdates = async () => {
    try {
      const response: any = await api.getCampaignUpdates(params.id as string);
      if (response.success) setCampaignUpdates(response.data || []);
    } catch {}
  };

  const loadFollowStatus = async () => {
    try {
      const response: any = await api.getFollowStatus(params.id as string);
      if (response.success) {
        setIsFollowing(response.data?.following || false);
        setFollowerCount(response.data?.count || 0);
      }
    } catch {}
  };

  const handleFollow = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowCampaign(params.id as string);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await api.followCampaign(params.id as string);
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const updateParam = searchParams.get('update');
    if (updateParam && campaignUpdates.length > 0) {
      const id = parseInt(updateParam);
      setHighlightedUpdateId(id);
      setActiveTab('zaman');
      setTimeout(() => {
        const el = updateRefs.current[id];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      setTimeout(() => setHighlightedUpdateId(null), 3000);
    }
  }, [searchParams, campaignUpdates]);

  const handleAddUpdate = async () => {
    if (!updateContent.trim()) return;
    const sourceRequired = updateSubtype === 'media' || updateSubtype === 'official';
    if (sourceRequired && !updateSourceUrl.trim()) {
      alert('Bu güncelleme türü için kaynak linki zorunludur.');
      return;
    }
    setUpdateLoading(true);
    try {
      await api.addCampaignUpdate(params.id as string, updateContent, updateTitle, updateSourceUrl);
      setUpdateContent(''); setUpdateTitle(''); setUpdateSourceUrl('');
      setUpdateSubtype('general'); setShowUpdateForm(false);
      loadCampaignUpdates();
    } catch (error: any) {
      alert(error.message || 'Güncelleme eklenemedi');
    } finally {
      setUpdateLoading(false);
    }
  };

  const startEditUpdate = (update: any) => {
    setEditingUpdateId(update.id);
    setEditTitle(update.title || '');
    setEditContent(update.content || '');
    setEditSourceUrl(update.source_url || '');
    setEditReason('');
  };

  const handleEditUpdate = async (updateId: number) => {
    if (!editContent.trim()) return;
    setEditLoading(true);
    try {
      await api.editCampaignUpdate(params.id as string, updateId, editContent, editTitle, editSourceUrl, editReason);
      setEditingUpdateId(null); setEditReason('');
      loadCampaignUpdates();
    } catch (error: any) {
      alert(error.message || 'Güncelleme düzenlenemedi');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!confirm('Bu güncellemeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteCampaignUpdate(params.id as string, updateId);
      loadCampaignUpdates();
    } catch (error: any) {
      alert(error.message || 'Güncelleme silinemedi');
    }
  };

  const handleTogglePin = async (updateId: number) => {
    try {
      await api.togglePinCampaignUpdate(params.id as string, updateId);
      loadCampaignUpdates();
    } catch (error: any) {
      alert(error.message || 'Pin işlemi başarısız');
    }
  };

  const handleShareUpdate = (updateId: number) => {
    const url = `${window.location.origin}/campaigns/${params.id}?update=${updateId}`;
    navigator.clipboard.writeText(url);
    setCopiedUpdateId(updateId);
    setTimeout(() => setCopiedUpdateId(null), 2000);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusUpdating(true); setStatusMessage(null);
    try {
      const res: any = await api.updateCampaignStatus(params.id as string, newStatus, statusDescription || undefined);
      await loadCampaign();
      loadCampaignUpdates();
      setPendingStatus(null); setStatusDescription('');
      if (res.data?.daily_changes_remaining !== undefined) setDailyChangesRemaining(res.data.daily_changes_remaining);
      setStatusMessage('Durum güncellendi.');
      setTimeout(() => setStatusMessage(null), 6000);
      loadStatusHistory();
    } catch (error: any) {
      alert(error.message || 'Durum güncellenemedi');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleArchive = async () => {
    setShowArchiveConfirm(false); setStatusUpdating(true);
    try {
      await api.updateCampaignStatus(params.id as string, 'archived', statusDescription || undefined);
      await loadCampaign(); loadCampaignUpdates(); setStatusDescription('');
      setStatusMessage('Kampanya arşivlendi. 24 saat içinde geri alabilirsiniz.');
      setTimeout(() => setStatusMessage(null), 8000);
    } catch (error: any) {
      alert(error.message || 'Arşivleme başarısız');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUnarchive = async () => {
    if (!confirm('Arşivlemeyi geri almak istediğinize emin misiniz?')) return;
    setStatusUpdating(true);
    try {
      await api.updateCampaignStatus(params.id as string, 'active');
      await loadCampaign(); loadCampaignUpdates();
      setStatusMessage('Arşivleme geri alındı.');
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (error: any) {
      alert(error.message || 'Geri alma başarısız');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddSignature = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setSignatureLoading(true);
    try {
      const deviceFingerprint = await getFingerprint();
      await api.addSignature(params.id as string, signatureMessage, isAnonymous, deviceFingerprint);
      setShowSignatureModal(false); setSignatureMessage(''); setIsAnonymous(false);
      loadSignatures(); loadUserSignature();
      setShowShareCard(true);
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız');
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!confirm('Desteğinizi geri çekmek istediğinizden emin misiniz?')) return;
    try {
      await api.removeSignature(params.id as string);
      setUserSignature(null); loadSignatures();
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
    api.recordCampaignShare(params.id as string, 'copy_link').catch(() => {});
    setCampaign((prev: any) => prev ? { ...prev, share_count: (prev.share_count || 0) + 1 } : prev);
  };

  const handleShare = (platform: string, url: string) => {
    api.recordCampaignShare(params.id as string, platform).catch(() => {});
    setCampaign((prev: any) => prev ? { ...prev, share_count: (prev.share_count || 0) + 1 } : prev);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReport = async () => {
    if (!reportReason) return;
    setReportLoading(true);
    try {
      await api.submitCampaignReport(params.id as string, reportReason, reportDescription || undefined);
      setUserReport({ id: 'submitted' }); setShowReportModal(false);
      setReportReason(''); setReportDescription('');
    } catch (error: any) {
      alert(error.message || 'Şikayet gönderilemedi');
    } finally {
      setReportLoading(false);
    }
  };

  const handleEvidenceStatus = async (evidenceId: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateEvidenceStatus(params.id as string, evidenceId, status);
      loadStructuredEvidence(); loadPendingEvidence();
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız');
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceTitle.trim()) return;
    if (!evidenceUrl.trim()) { alert('URL zorunludur.'); return; }
    setEvidenceLoading(true);
    try {
      await api.addCampaignEvidence(params.id as string, {
        type: evidenceType, title: evidenceTitle,
        description: evidenceDescription || undefined,
        url: evidenceUrl || undefined,
        credibility_type: evidenceCredibilityType,
      });
      setEvidenceTitle(''); setEvidenceDescription(''); setEvidenceUrl('');
      setEvidenceType('link'); setShowEvidenceForm(false);
      loadStructuredEvidence();
    } catch (error: any) {
      alert(error.message || 'Kanıt eklenemedi');
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('Bu kanıtı silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteCampaignEvidence(params.id as string, evidenceId);
      loadStructuredEvidence();
    } catch (error: any) {
      alert(error.message || 'Kanıt silinemedi');
    }
  };

  const handleFlagEvidence = async (evidenceId: string) => {
    if (!user) { router.push('/auth/login'); return; }
    setFlaggingEvidenceId(evidenceId);
    try {
      await api.flagEvidence(evidenceId);
      loadStructuredEvidence();
    } catch (error: any) {
      alert(error.message || 'İşaretleme başarısız');
    } finally {
      setFlaggingEvidenceId(null);
    }
  };

  const handleRequestLegal = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setLegalRequesting(true);
    try {
      await api.requestLegalSupport(params.id as string);
      loadLegalStatus();
    } catch (err: any) {
      alert(err.message || 'İşlem başarısız');
    } finally {
      setLegalRequesting(false);
    }
  };

  const handleToggleInvestigation = async (enabled: boolean) => {    setInvestigationToggling(true);
    try {
      await api.toggleInvestigationMode(params.id as string, enabled);
      setCampaign((prev: any) => prev ? { ...prev, investigation_mode: enabled } : prev);
      if (enabled) loadInvestigationSummary();
    } catch (err: any) {
      alert(err.message || 'İşlem başarısız');
    } finally {
      setInvestigationToggling(false);
    }
  };

  // Returns minutes remaining in lock period (>0 = still locked), 0 = free to change
  const getRemainingLockMinutes = (): number => {
    if (!campaign?.status_changed_at) return 0;
    const diffMinutes = (Date.now() - new Date(campaign.status_changed_at).getTime()) / 1000 / 60;
    const remaining = 10 - diffMinutes;
    return remaining > 0 ? Math.ceil(remaining) : 0;
  };

  const getArchiveRevertHoursRemaining = (): number | null => {
    if (!campaign?.archived_at) return null;
    const diffHours = (Date.now() - new Date(campaign.archived_at).getTime()) / 1000 / 3600;
    const remaining = 24 - diffHours;
    return remaining > 0 ? remaining : 0;
  };

  const calculateRemainingDays = () => {    if (!campaign?.response_deadline_days) return null;
    let deadline: Date;
    if (campaign.response_deadline_date) {
      deadline = new Date(campaign.response_deadline_date.replace(' ', 'T'));
    } else {
      deadline = new Date(campaign.created_at);
      deadline.setDate(deadline.getDate() + campaign.response_deadline_days);
    }
    const today = new Date(); today.setHours(0, 0, 0, 0); deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  // Share buttons component
  const ShareButtons = ({ size = 'md', postSupport = false }: { size?: 'md' | 'sm'; postSupport?: boolean }) => {
    const [tooltip, setTooltip] = useState<string | null>(null);
    const dim = size === 'sm' ? 36 : 42;
    const iconSize = size === 'sm' ? 16 : 18;

    const btn = (key: string, label: string, icon: React.ReactNode, onClick: () => void, active = false) => (
      <div key={key} style={{ position: 'relative' }}>
        <button
          onClick={onClick}
          onMouseEnter={() => setTooltip(key)}
          onMouseLeave={() => setTooltip(null)}
          style={{
            width: dim, height: dim,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: active ? '#f0fdf4' : '#f8fafc',
            color: active ? '#15803d' : '#374151',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.12s, background 0.12s, border-color 0.12s',
            flexShrink: 0,
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        >
          {icon}
        </button>
        {tooltip === key && (
          <div style={{
            position: 'absolute', bottom: dim + 6, left: '50%', transform: 'translateX(-50%)',
            background: '#1F2A44', color: '#fff', fontSize: 11, fontWeight: 500,
            padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
          }}>
            {label}
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1F2A44' }} />
          </div>
        )}
      </div>
    );

    return (
      <div>
        {postSupport && (
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Daha fazla kişiye ulaştırmak için paylaş</p>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {btn('copy', copySuccess ? 'Kopyalandı!' : 'Bağlantıyı kopyala',
            copySuccess
              ? <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
            handleCopyLink, copySuccess
          )}
          {btn('whatsapp', "WhatsApp'ta paylaş",
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>,
            () => handleShare('whatsapp', `https://wa.me/?text=${encodeURIComponent('Bu kampanyayı destekledim, sen de katıl: ' + shareText + ' ' + shareUrl)}`)
          )}
          {btn('x', "X'te paylaş",
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#000' }}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>,
            () => handleShare('x', `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)
          )}
          {btn('telegram', "Telegram'da paylaş",
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#229ED9' }}>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>,
            () => handleShare('telegram', `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <Header />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '30%' }} />
            <div style={{ height: 32, background: '#e5e7eb', borderRadius: 6, width: '70%' }} />
            <div style={{ height: 120, background: '#e5e7eb', borderRadius: 8, marginTop: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <Header />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1F2A44', marginBottom: 16 }}>Kampanya bulunamadı</h1>
          <Link href="/campaigns" style={{ padding: '10px 20px', background: '#1F2A44', color: '#fff', borderRadius: 6, fontSize: 14, textDecoration: 'none' }}>
            Kampanyalara Dön
          </Link>
        </div>
      </div>
    );
  }

  const evidence = campaign.evidence || { links: [] };
  const remainingDays = calculateRemainingDays();
  const isCreator = user && campaign.creator_id === user.id;
  const fileNumber = campaign.case_number || null;
  const isArchived = ['archived', 'draft', 'under_review'].includes(campaign.status);

  const timelineItems = [
    ...campaignUpdates.map((u: any) => ({ ...u, _kind: 'update' })),
    ...statusHistory.map((h: any) => ({ ...h, _kind: 'status', created_at: h.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredTimeline = timelineItems.filter((item: any) => {
    if (updateTypeFilter === 'all') return true;
    if (updateTypeFilter === 'update') return item._kind === 'update' && item.type !== 'official_response' && item.type !== 'status_change';
    if (updateTypeFilter === 'status') return item._kind === 'status' || item.type === 'status_change';
    if (updateTypeFilter === 'official_response') return item.type === 'official_response';
    return true;
  });

  const getGoal = (count: number) => {
    if (count < 100) return 100; if (count < 500) return 500; if (count < 1000) return 1000;
    if (count < 5000) return 5000; if (count < 10000) return 10000; if (count < 50000) return 50000;
    return 100000;
  };
  const goal = getGoal(signatureCount);
  const progress = Math.min((signatureCount / goal) * 100, 100);

  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    response_received: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    no_response: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    resolved: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    closed_unresolved: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
    closed: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
    archived: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  };
  const sc = statusColors[campaign.status] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = campaign.title;

  // Reusable support button
  const SupportButton = ({ size = 'lg', fullWidth = false }: { size?: 'lg' | 'sm'; fullWidth?: boolean }) => {
    const pad = size === 'lg' ? '13px 32px' : '9px 20px';
    const fs = size === 'lg' ? 15 : 13;
    if (isArchived) return null;
    if (userSignature) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: fullWidth ? 'stretch' : 'flex-start' }}>
        <div style={{ padding: pad, background: '#f0fdf4', color: '#15803d', borderRadius: 8, fontSize: fs, fontWeight: 700, border: '1px solid #86efac', textAlign: 'center' }}>
          Desteklediniz
        </div>
        <button onClick={handleRemoveSignature}
          style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, textAlign: 'left' }}>
          Desteği geri çek
        </button>
      </div>
    );
    return (
      <button
        onClick={() => setShowSignatureModal(true)}
        style={{
          padding: pad,
          background: '#1F2A44',
          color: '#fff',
          borderRadius: 8,
          fontSize: fs,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          width: fullWidth ? '100%' : 'auto',
          transition: 'opacity 0.15s',
        }}
      >
        Destek Ver
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <Header />

      {/* Sticky bottom bar (mobile CTA) */}
      {!isArchived && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{signatureCount.toLocaleString('tr-TR')}</span>
            <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 6 }}>destek</span>
            {momentum?.today_supporters > 0 && (
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginLeft: 8 }}>+{momentum.today_supporters} bugün</span>
            )}
          </div>
          <SupportButton size="sm" />
        </div>
      )}

      {/* Modals */}
      {historyModalUpdateId && (
        <EditHistoryModal campaignId={params.id as string} updateId={historyModalUpdateId} onClose={() => setHistoryModalUpdateId(null)} />
      )}

      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44', marginBottom: 16 }}>Kampanyayı Şikayet Et</h3>
            <select style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', marginBottom: 10, background: '#fff', color: '#374151' }}
              value={reportReason} onChange={e => setReportReason(e.target.value)}>
              <option value="">Sebep seçin...</option>
              <option value="misinformation">Yanlış bilgi / Dezenformasyon</option>
              <option value="spam">Spam</option>
              <option value="harassment">Taciz / Nefret söylemi</option>
              <option value="fake">Sahte kampanya</option>
              <option value="other">Diğer</option>
            </select>
            <textarea style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', resize: 'none', background: '#fff', color: '#374151' }}
              rows={3} placeholder="Açıklama (opsiyonel)" value={reportDescription} onChange={e => setReportDescription(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowReportModal(false)}
                style={{ fontSize: 13, padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>İptal</button>
              <button onClick={handleReport} disabled={reportLoading || !reportReason}
                style={{ fontSize: 13, padding: '8px 16px', background: '#dc2626', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: (!reportReason || reportLoading) ? 0.5 : 1 }}>
                {reportLoading ? 'Gönderiliyor...' : 'Şikayet Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44', marginBottom: 8 }}>Kampanyayı Arşivle</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Arşivlenen kampanyaya 24 saat içinde geri dönebilirsiniz.</p>
            <textarea style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', resize: 'none', marginBottom: 12 }}
              rows={2} placeholder="Arşivleme nedeni (opsiyonel)" value={statusDescription} onChange={e => setStatusDescription(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowArchiveConfirm(false); setStatusDescription(''); }}
                style={{ flex: 1, padding: '9px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>İptal</button>
              <button onClick={handleArchive} disabled={statusUpdating}
                style={{ flex: 1, padding: '9px', background: '#dc2626', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: statusUpdating ? 0.5 : 1 }}>
                {statusUpdating ? 'Arşivleniyor...' : 'Arşivle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1F2A44', marginBottom: 6 }}>Desteğiniz alındı</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: '#1F2A44' }}>{signatureCount.toLocaleString('tr-TR')} kişi</span> bu kampanyayı destekledi.
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Kampanyayı paylaşın</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <ShareButtons size="md" postSupport />
            </div>
            <button onClick={() => setShowShareCard(false)}
              style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Şimdi değil
            </button>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44', marginBottom: 6 }}>Kampanyayı Destekle</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Desteğiniz kamuya açık olarak kayıt altına alınacaktır.</p>
            <textarea style={{ width: '100%', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 12px', resize: 'none', marginBottom: 12, color: '#374151' }}
              rows={3} placeholder="Neden bu kampanyayı destekliyorsunuz? (opsiyonel)"
              value={signatureMessage} onChange={e => setSignatureMessage(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ width: 15, height: 15 }} />
              Anonim olarak imzala
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSignatureModal(false)} disabled={signatureLoading}
                style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>İptal</button>
              <button onClick={handleAddSignature} disabled={signatureLoading}
                style={{ flex: 1, padding: '10px', background: '#1F2A44', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: signatureLoading ? 0.5 : 1 }}>
                {signatureLoading ? 'İşleniyor...' : 'Destekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>

        {/* Victory Banner */}
        {victoryData && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: '#15803d' }}>✓</span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Kampanya Sonuçlandı</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#14532d', marginBottom: 4 }}>Bu kampanya hedefine ulaştı.</p>
              <p style={{ fontSize: 13, color: '#166534' }}>
                <span style={{ fontWeight: 700 }}>{(victoryData.supporters || 0).toLocaleString('tr-TR')} destekçi</span> bu sonucun gerçekleşmesini sağladı.
                {victoryData.victory_at && <span style={{ marginLeft: 8, color: '#4ade80' }}>{formatDate(victoryData.victory_at)}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Archived notice */}
        {campaign.status === 'archived' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Bu kampanya arşivlenmiştir.</p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Yeni destek verilemez ve güncelleme eklenemez.</p>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div>

            {/* ===== HERO ===== */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '32px 36px', marginBottom: 20 }}>

              {/* Breadcrumb meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {campaign.category && (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{campaign.category}</span>
                )}
                {campaign.category && <span style={{ fontSize: 11, color: '#e2e8f0' }}>·</span>}
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 4, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                  {STATUS_LABELS[campaign.status] || campaign.status}
                </span>
                {campaign.investigation_mode && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 4, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>Soruşturma</span>
                )}
                {fileNumber && <span style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace' }}>#{fileNumber}</span>}
              </div>

              {/* Institution */}
              {campaign.target_entity && (
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                  Hedef:{' '}
                  {campaign.entity_slug ? (
                    <Link href={`/entities/${campaign.entity_slug}`} style={{ fontWeight: 700, color: '#1F2A44', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      {campaign.entity_name || campaign.target_entity}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700, color: '#1F2A44' }}>{campaign.target_entity}</span>
                  )}
                </p>
              )}

              {/* Title */}
              <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: 24 }}>{campaign.title}</h1>

              {/* Social proof — BIG */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>
                    {signatureCount.toLocaleString('tr-TR')}
                  </span>
                  <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>kişi destekledi</span>
                </div>
                {momentum?.today_supporters > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 16 }}>
                    Son 24 saatte +{momentum.today_supporters} destek
                  </p>
                )}

                {/* Milestone badge */}
                {milestone?.current_milestone && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, padding: '4px 12px',
                      borderRadius: 20, background: '#fef9c3', color: '#854d0e',
                      border: '1px solid #fde68a',
                    }}>
                      <span>🏆</span>
                      {milestone.current_milestone.label}
                      {milestone.next_milestone && (
                        <span style={{ fontWeight: 400, color: '#a16207', marginLeft: 4 }}>
                          · Sonraki: {milestone.next_milestone.toLocaleString('tr-TR')} destek
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 9999, height: 6, marginBottom: 8 }}>
                    <div style={{ width: `${progress}%`, background: '#1F2A44', borderRadius: 9999, height: 6, transition: 'width 0.6s ease', minWidth: progress > 0 ? 6 : 0 }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>
                    Hedef: {goal.toLocaleString('tr-TR')} destek — {Math.round(progress)}% tamamlandı
                  </p>
                  {remainingDays !== null && (
                    <p style={{ fontSize: 12, color: remainingDays === 0 ? '#b91c1c' : '#94a3b8', marginTop: 2 }}>
                      {remainingDays === 0 ? 'Yanıt süresi doldu.' : `Yanıt süresine ${remainingDays} gün kaldı.`}
                    </p>
                  )}
                </div>

                {/* Primary CTA */}
                <SupportButton size="lg" />
              </div>

              {/* Share row */}
              {!isArchived && (
                <div style={{ borderTop: '1px solid #f8fafc', paddingTop: 16 }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>Paylaşarak daha fazla kişiye ulaştır</p>
                  <ShareButtons size="md" />
                </div>
              )}
            </div>

            {/* ===== SECONDARY CTA BLOCK (between hero and tabs) ===== */}
            {!isArchived && !userSignature && (
              <div style={{ background: '#1F2A44', borderRadius: 10, padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Senin desteğin bu kampanyayı büyütür</p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>Her imza kuruma gönderilen mesajı güçlendirir.</p>
                </div>
                <button onClick={() => setShowSignatureModal(true)}
                  style={{ padding: '11px 28px', background: '#fff', color: '#1F2A44', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  Destek Ver
                </button>
              </div>
            )}

            {/* ===== DEADLINE BLOCK ===== */}
            {campaign.status === 'active' && remainingDays !== null && (
              <div style={{
                background: remainingDays <= 3 ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${remainingDays <= 3 ? '#fca5a5' : '#fde68a'}`,
                borderRadius: 10, padding: '14px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>{remainingDays <= 3 ? '🔴' : '⏳'}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: remainingDays <= 3 ? '#b91c1c' : '#92400e', margin: 0 }}>
                    {remainingDays === 0
                      ? 'Yanıt süresi bugün doluyor'
                      : `Yanıt süresine ${remainingDays} gün kaldı`}
                  </p>
                  <p style={{ fontSize: 12, color: remainingDays <= 3 ? '#dc2626' : '#b45309', margin: '2px 0 0' }}>
                    Kurum yanıt vermezse kampanya "Yanıt Yok" durumuna geçecek.
                  </p>
                </div>
              </div>
            )}
            {campaign.status === 'no_response' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c', margin: 0 }}>Kurum belirtilen süre içinde yanıt vermedi</p>
                  <p style={{ fontSize: 12, color: '#dc2626', margin: '2px 0 0' }}>Bu kampanya hukuki destek için uygun olabilir.</p>
                </div>
              </div>
            )}

            {/* ===== TABS ===== */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {([
                { key: 'genel', label: 'Genel' },
                { key: 'kanitlar', label: `Kanıtlar${structuredEvidence.length > 0 ? ` (${structuredEvidence.length})` : ''}` },
                { key: 'zaman', label: 'Zaman Akışı' },
              ] as const).map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ flex: 1, padding: '13px 8px', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? '#1F2A44' : '#9ca3af', background: activeTab === tab.key ? '#f8fafc' : 'transparent', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #1F2A44' : '2px solid transparent', cursor: 'pointer' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: GENEL */}
            {activeTab === 'genel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {campaign.demanded_action && (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '22px 26px', borderLeft: '3px solid #1F2A44' }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: '#1F2A44', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Talep</h3>
                    <p style={{ fontSize: 15, color: '#1F2A44', lineHeight: 1.75, whiteSpace: 'pre-line', fontWeight: 500 }}>{campaign.demanded_action}</p>
                  </div>
                )}

                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '22px 26px' }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Ne Oldu?</h3>
                  <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
                    {campaign.description.split('\n').filter((l: string) => l.trim()).map((p: string, i: number) => (
                      <p key={i} style={{ marginBottom: 12 }}>{p}</p>
                    ))}
                  </div>
                </div>

                {campaign.standard_reference && (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '22px 26px' }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Dayanılan Standart</h3>
                    <p style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{campaign.standard_reference}</p>
                    {campaign.standard_reference_other && (
                      <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 6 }}>{campaign.standard_reference_other}</p>
                    )}
                    {campaign.standard_id && campaign.standard_source_url && (
                      <a href={campaign.standard_source_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'underline' }}>Kaynağa git</a>
                    )}
                    {!campaign.standard_id && (
                      <span style={{ fontSize: 11, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '2px 8px', display: 'inline-block' }}>Doğrulama Bekliyor</span>
                    )}
                  </div>
                )}

                {campaign.investigation_mode && investigationSummary && (
                  <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 10, padding: '18px 22px' }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Soruşturma Paneli</h3>
                    <p style={{ fontSize: 12, color: '#b45309', marginBottom: 14 }}>Bu kampanya topluluk soruşturmasına açıktır.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Toplam Kanıt', value: investigationSummary.evidence_submitted, color: '#1F2A44' },
                        { label: 'Doğrulandı', value: investigationSummary.evidence_verified, color: '#15803d' },
                        { label: 'İnceleniyor', value: investigationSummary.evidence_pending, color: '#d97706' },
                        { label: 'İşaretlendi', value: investigationSummary.evidence_flagged, color: '#dc2626' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: '#fefce8', borderRadius: 6, padding: '10px 12px', border: '1px solid #fde68a' }}>
                          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom CTA after story */}
                {!isArchived && !userSignature && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '24px 28px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Bu değişimin parçası ol</p>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>Bir destek, fark yaratır.</p>
                    <SupportButton size="lg" />
                  </div>
                )}
              </div>
            )}

            {/* TAB: KANITLAR */}
            {activeTab === 'kanitlar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {isCreator && pendingEvidence.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>Onay Bekleyen Kanıtlar ({pendingEvidence.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pendingEvidence.map((ev: any) => (
                        <div key={ev.id} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2A44' }}>{ev.title}</p>
                            {ev.url && <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'underline' }}>Kaynağa git</a>}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => handleEvidenceStatus(ev.id, 'approved')}
                              style={{ fontSize: 12, padding: '5px 12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Onayla</button>
                            <button onClick={() => handleEvidenceStatus(ev.id, 'rejected')}
                              style={{ fontSize: 12, padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Reddet</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user && !isArchived && (
                  <div>
                    <button onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                      style={{ fontSize: 13, padding: '8px 16px', background: showEvidenceForm ? '#f3f4f6' : '#1F2A44', color: showEvidenceForm ? '#6b7280' : '#fff', borderRadius: 6, border: showEvidenceForm ? '1px solid #e5e7eb' : 'none', cursor: 'pointer', fontWeight: 500, marginBottom: showEvidenceForm ? 12 : 0 }}>
                      {showEvidenceForm ? 'İptal' : '+ Kanıt Ekle'}
                    </button>
                    {showEvidenceForm && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <select value={evidenceType} onChange={e => setEvidenceType(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', background: '#fff', color: '#374151' }}>
                          <option value="link">Bağlantı</option>
                          <option value="document">Belge</option>
                          <option value="image">Görsel</option>
                        </select>
                        <select value={evidenceCredibilityType} onChange={e => setEvidenceCredibilityType(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', background: '#fff', color: '#374151' }}>
                          <option value="user_submission">Kullanıcı Gönderimi</option>
                          <option value="news_source">Haber Kaynağı</option>
                          <option value="official_document">Resmi Belge</option>
                          <option value="government_record">Devlet Kaydı</option>
                          <option value="company_statement">Şirket Açıklaması</option>
                          <option value="academic_source">Akademik Kaynak</option>
                        </select>
                        <input type="text" placeholder="Başlık (zorunlu)" value={evidenceTitle} onChange={e => setEvidenceTitle(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', color: '#374151' }} />
                        <input type="url" placeholder="URL (zorunlu)" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', color: '#374151' }} />
                        <textarea rows={2} placeholder="Açıklama (opsiyonel)" value={evidenceDescription} onChange={e => setEvidenceDescription(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', resize: 'none', color: '#374151' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={handleAddEvidence} disabled={evidenceLoading || !evidenceTitle.trim() || !evidenceUrl.trim()}
                            style={{ fontSize: 13, padding: '8px 20px', background: '#1F2A44', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: (evidenceLoading || !evidenceTitle.trim() || !evidenceUrl.trim()) ? 0.5 : 1 }}>
                            {evidenceLoading ? 'Ekleniyor...' : 'Ekle'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {structuredEvidence.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {structuredEvidence.map((ev: any) => (
                      <div key={ev.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{ev.type === 'link' ? '↗' : ev.type === 'document' ? '□' : '▣'}</span>
                            {ev.url ? (
                              <a href={ev.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 14, fontWeight: 600, color: '#1F2A44', textDecoration: 'underline', textUnderlineOffset: 2 }}>{ev.title}</a>
                            ) : (
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2A44' }}>{ev.title}</p>
                            )}
                          </div>
                          {ev.description && <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{ev.description}</p>}
                          <EvidenceCredibilityBadge credibilityType={ev.credibility_type} status={ev.status} verificationSource={ev.verification_source} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {user && !isCreator && ev.status !== 'flagged' && (
                            <button onClick={() => handleFlagEvidence(ev.id)} disabled={flaggingEvidenceId === ev.id}
                              style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Şikayet</button>
                          )}
                          {isCreator && (
                            <button onClick={() => handleDeleteEvidence(ev.id)}
                              style={{ fontSize: 12, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>Sil</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '40px 32px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Henüz kanıt eklenmemiş</p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>İlk kanıtı ekleyerek kampanyayı güçlendirebilirsiniz.</p>
                    {user && !isArchived && (
                      <button onClick={() => setShowEvidenceForm(true)}
                        style={{ fontSize: 13, padding: '8px 20px', background: '#1F2A44', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Kanıt Ekle
                      </button>
                    )}
                  </div>
                )}

                {evidence.links && evidence.links.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {evidence.links.map((link: string, i: number) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', textDecoration: 'none' }}>
                        <span style={{ color: '#9ca3af' }}>↗</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ZAMAN AKIŞI */}
            {activeTab === 'zaman' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2A44', marginBottom: 2 }}>Zaman Akışı</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Bu kampanyada neler oldu?</p>
                </div>

                {isCreator && !isArchived && (
                  <div style={{ marginBottom: 16 }}>
                    <button onClick={() => setShowUpdateForm(!showUpdateForm)}
                      style={{ fontSize: 12, padding: '7px 16px', background: '#f9fafb', color: '#6b7280', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                      {showUpdateForm ? 'İptal' : '+ Güncelleme Ekle'}
                    </button>
                    {showUpdateForm && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <select value={updateSubtype} onChange={e => setUpdateSubtype(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', background: '#fff', color: '#374151' }}>
                          <option value="general">Genel Güncelleme</option>
                          <option value="media">Medya Haberi (kaynak zorunlu)</option>
                          <option value="official">Resmi Gelişme (kaynak zorunlu)</option>
                        </select>
                        <input type="text" placeholder="Başlık (opsiyonel)" value={updateTitle} onChange={e => setUpdateTitle(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', color: '#374151' }} />
                        <textarea rows={3} placeholder="Güncelleme yaz..." value={updateContent} onChange={e => setUpdateContent(e.target.value)}
                          style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', resize: 'none', color: '#374151' }} />
                        <input type="url"
                          placeholder={(updateSubtype === 'media' || updateSubtype === 'official') ? 'Kaynak linki (zorunlu)' : 'Kaynak linki (opsiyonel)'}
                          value={updateSourceUrl} onChange={e => setUpdateSourceUrl(e.target.value)}
                          style={{ fontSize: 13, border: `1px solid ${(updateSubtype === 'media' || updateSubtype === 'official') && !updateSourceUrl.trim() ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 6, padding: '8px 12px', color: '#374151' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={handleAddUpdate} disabled={updateLoading || !updateContent.trim()}
                            style={{ fontSize: 13, padding: '8px 20px', background: '#1F2A44', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: (updateLoading || !updateContent.trim()) ? 0.5 : 1 }}>
                            {updateLoading ? 'Paylaşılıyor...' : 'Paylaş'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { value: 'all', label: 'Tümü' },
                    { value: 'update', label: 'Güncellemeler' },
                    { value: 'status', label: 'Durum' },
                    { value: 'official_response', label: 'Resmi Yanıt' },
                  ].map(f => (
                    <button key={f.value} onClick={() => setUpdateTypeFilter(f.value)}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 4, border: '1px solid', borderColor: updateTypeFilter === f.value ? '#1F2A44' : '#e5e7eb', background: updateTypeFilter === f.value ? '#1F2A44' : '#fff', color: updateTypeFilter === f.value ? '#fff' : '#6b7280', cursor: 'pointer', fontWeight: updateTypeFilter === f.value ? 600 : 400 }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredTimeline.length === 0 ? (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>Henüz kayıt yok.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {filteredTimeline.map((item: any, idx: number) => {
                      const isLast = idx === filteredTimeline.length - 1;

                      if (item._kind === 'status') {
                        const labels: Record<string, string> = { active: 'Aktif', response_received: 'Yanıt Alındı', no_response: 'Kurum Yanıt Vermedi', resolved: 'Çözüldü', closed_unresolved: 'Çözümsüz Kapandı', closed: 'Kapatıldı', archived: 'Arşivlendi' };
                        return (
                          <div key={`status-${item.id}`} style={{ display: 'flex', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', marginTop: 5, flexShrink: 0 }} />
                              {!isLast && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                            </div>
                            <div style={{ paddingBottom: 20, flex: 1 }}>
                              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{formatDate(item.created_at)}</p>
                              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px' }}>
                                <p style={{ fontSize: 13, color: '#374151' }}>
                                  <span style={{ color: '#9ca3af' }}>{labels[item.old_status] || item.old_status}</span>
                                  <span style={{ margin: '0 8px', color: '#d1d5db' }}>→</span>
                                  <span style={{ fontWeight: 700, color: '#1F2A44' }}>{labels[item.new_status] || item.new_status}</span>
                                </p>
                                {item.reason && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>{item.reason}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'lawyer_matched') {
                        return (
                          <div key={`upd-${item.id}`} style={{ display: 'flex', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F2A44', marginTop: 5, flexShrink: 0 }} />
                              {!isLast && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                            </div>
                            <div style={{ paddingBottom: 20, flex: 1 }}>
                              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{formatDate(item.created_at)}</p>
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px', borderLeft: '3px solid #1F2A44' }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1F2A44', marginBottom: 4 }}>Hukuki Değerlendirme</p>
                                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{item.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'official_response') {
                        return (
                          <div key={`upd-${item.id}`} ref={(el) => { updateRefs.current[item.id] = el; }}
                            style={{ display: 'flex', gap: 14, background: highlightedUpdateId === item.id ? '#fefce8' : 'transparent', borderRadius: 6, transition: 'background 0.5s' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                              {!isLast && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                            </div>
                            <div style={{ paddingBottom: 20, flex: 1 }}>
                              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{formatDate(item.created_at)}</p>
                              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resmi Yanıt</span>
                                  {item.entity_name && (
                                    <span style={{ fontSize: 11, color: '#3b82f6', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 4, padding: '2px 8px' }}>{item.entity_name}</span>
                                  )}
                                </div>
                                {item.title && item.title !== `${item.entity_name} Resmi Yanıtı` && (
                                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>{item.title}</p>
                                )}
                                <p style={{ fontSize: 14, color: '#1e40af', lineHeight: 1.65 }}>{item.content}</p>
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: 12, color: '#2563eb', textDecoration: 'underline', marginTop: 8, display: 'inline-block' }}>Kaynak</a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={`upd-${item.id}`} ref={(el) => { updateRefs.current[item.id] = el; }}
                          style={{ display: 'flex', gap: 14, background: highlightedUpdateId === item.id ? '#fefce8' : 'transparent', borderRadius: 6, transition: 'background 0.5s' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', marginTop: 5, flexShrink: 0 }} />
                            {!isLast && <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 4 }} />}
                          </div>
                          <div style={{ paddingBottom: 20, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <p style={{ fontSize: 11, color: '#9ca3af' }}>
                                {item.is_pinned && <span style={{ marginRight: 4, color: '#1F2A44', fontWeight: 600 }}>Sabitlendi ·</span>}
                                {formatDate(item.created_at)}
                              </p>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => handleShareUpdate(item.id)}
                                  style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  {copiedUpdateId === item.id ? 'Kopyalandı' : 'Paylaş'}
                                </button>
                                {isCreator && editingUpdateId !== item.id && (
                                  <>
                                    <button onClick={() => handleTogglePin(item.id)}
                                      style={{ fontSize: 11, color: item.is_pinned ? '#1F2A44' : '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                      {item.is_pinned ? 'Sabitleme Kaldır' : 'Sabitle'}
                                    </button>
                                    <button onClick={() => startEditUpdate(item)}
                                      style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Düzenle</button>
                                    <button onClick={() => handleDeleteUpdate(item.id)}
                                      style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Sil</button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingUpdateId === item.id ? (
                              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input type="text" placeholder="Başlık (opsiyonel)" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                  style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', color: '#374151' }} />
                                <textarea rows={3} value={editContent} onChange={e => setEditContent(e.target.value)}
                                  style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', resize: 'none', color: '#374151' }} />
                                <input type="url" placeholder="Kaynak linki (opsiyonel)" value={editSourceUrl} onChange={e => setEditSourceUrl(e.target.value)}
                                  style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', color: '#374151' }} />
                                <input type="text" placeholder="Düzenleme notu (opsiyonel)" value={editReason} onChange={e => setEditReason(e.target.value)}
                                  style={{ fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', color: '#374151' }} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                  <button onClick={() => setEditingUpdateId(null)}
                                    style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 6, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>İptal</button>
                                  <button onClick={() => handleEditUpdate(item.id)} disabled={editLoading || !editContent.trim()}
                                    style={{ fontSize: 12, padding: '6px 14px', background: '#1F2A44', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: (editLoading || !editContent.trim()) ? 0.5 : 1 }}>
                                    {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 14px' }}>
                                {item.title && <p style={{ fontSize: 13, fontWeight: 700, color: '#1F2A44', marginBottom: 6 }}>{item.title}</p>}
                                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{item.content}</p>
                                {item.source_url && (
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'underline', marginTop: 6, display: 'inline-block' }}>Kaynak</a>
                                )}
                                {item.updated_at && new Date(item.updated_at).getTime() !== new Date(item.created_at).getTime() && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>son düzenleme: {formatDate(item.updated_at)}</p>
                                    {parseInt(item.history_count) > 0 && (
                                      <button onClick={() => setHistoryModalUpdateId(item.id)}
                                        style={{ fontSize: 11, color: '#1F2A44', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {item.history_count} revizyon
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Final CTA */}
            {!isArchived && !userSignature && (
              <div style={{ background: '#1F2A44', borderRadius: 12, padding: '32px 36px', marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Bu değişimin parçası ol</p>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Bir destek, fark yaratır.</p>
                <button onClick={() => setShowSignatureModal(true)}
                  style={{ padding: '13px 40px', background: '#fff', color: '#1F2A44', borderRadius: 8, fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  Destek Ver
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sticky support card */}
            {!isArchived && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '22px 22px', position: 'sticky', top: 80 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{signatureCount.toLocaleString('tr-TR')}</span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>destek</span>
                </div>
                {momentum?.today_supporters > 0 && (
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 12 }}>Son 24 saatte +{momentum.today_supporters}</p>
                )}
                <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 9999, height: 5, marginBottom: 16 }}>
                  <div style={{ width: `${progress}%`, background: '#1F2A44', borderRadius: 9999, height: 5, minWidth: progress > 0 ? 5 : 0 }} />
                </div>
                <SupportButton size="lg" fullWidth />

                {/* Share */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Paylaş</p>
                  <ShareButtons size="sm" />
                </div>
              </div>
            )}

            {/* Hedef Kurum */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Hedef Kurum</h3>
              <div style={{ marginBottom: 14 }}>
                {campaign.entity_slug ? (
                  <Link href={`/entities/${campaign.entity_slug}`} style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {campaign.entity_name || campaign.target_entity}
                  </Link>
                ) : (
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1F2A44' }}>{campaign.target_entity}</p>
                )}
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                  {campaign.target_type === 'company' ? 'Şirket' : campaign.target_type === 'brand' ? 'Marka' : 'Hükümet'}
                </p>
              </div>

              {transparencyScore && transparencyScore.transparency_score != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', borderRadius: 6, marginBottom: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1F2A44', lineHeight: 1 }}>{transparencyScore.transparency_score}</span>
                    <span style={{ fontSize: 8, color: '#9ca3af' }}>/100</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1F2A44' }}>
                      {transparencyScore.transparency_score >= 70 ? 'Şeffaf' : transparencyScore.transparency_score >= 40 ? 'Kısmen Şeffaf' : 'Düşük Şeffaflık'}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>Şeffaflık Skoru</p>
                  </div>
                </div>
              )}

              {entityMetrics && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Yanıt Oranı', value: `%${Math.round((entityMetrics.response_rate || 0) * 100)}` },
                    { label: 'Ort. Yanıt Süresi', value: entityMetrics.avg_response_time_days != null ? `${entityMetrics.avg_response_time_days} gün` : '—' },
                    { label: 'Toplam Kampanya', value: entityMetrics.campaign_count },
                    { label: 'Yanıtsız Kalan', value: entityMetrics.no_response_count, danger: true },
                  ].map(({ label, value, danger }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: danger ? '#dc2626' : '#1F2A44' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {campaign.entity_slug && (
                <Link href={`/entities/${campaign.entity_slug}`}
                  style={{ fontSize: 12, color: '#6b7280', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  Kurum sayfasına git
                </Link>
              )}
            </div>

            {/* Takip */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                {followerCount > 0 ? `${followerCount} kişi takip ediyor` : 'Henüz takipçi yok'}
              </p>
              <button onClick={handleFollow} disabled={followLoading}
                style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: isFollowing ? '1px solid #e5e7eb' : 'none', background: isFollowing ? '#fff' : '#1F2A44', color: isFollowing ? '#374151' : '#fff', cursor: 'pointer', opacity: followLoading ? 0.5 : 1 }}>
                {followLoading ? '...' : isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
              </button>
            </div>

            {/* Owner controls */}
            {isCreator && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Kampanya Yönetimi</h3>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                  Durum: <span style={{ fontWeight: 700, color: '#1F2A44' }}>{STATUS_LABELS[campaign.status] || campaign.status}</span>
                </p>

                {campaign.status === 'archived' ? (
                  (() => {
                    const hoursLeft = getArchiveRevertHoursRemaining();
                    return hoursLeft !== null && hoursLeft > 0 ? (
                      <div>
                        <p style={{ fontSize: 11, color: '#d97706', marginBottom: 6 }}>Geri alma: {hoursLeft < 1 ? `${Math.ceil(hoursLeft * 60)} dk` : `${Math.ceil(hoursLeft)} saat`} kaldı</p>
                        <button onClick={handleUnarchive} disabled={statusUpdating}
                          style={{ width: '100%', fontSize: 12, padding: '8px', border: '1px solid #fde68a', color: '#b45309', background: '#fffbeb', borderRadius: 6, cursor: 'pointer', opacity: statusUpdating ? 0.5 : 1 }}>
                          {statusUpdating ? '...' : 'Arşivlemeyi Geri Al'}
                        </button>
                      </div>
                    ) : <p style={{ fontSize: 11, color: '#9ca3af' }}>Geri alma süresi doldu.</p>;
                  })()
                ) : OWNER_TRANSITIONS[campaign.status]?.length > 0 && (() => {
                  const remaining = getRemainingLockMinutes();
                  if (remaining > 0) return (
                    <div>
                      <p style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>
                        Durum kilitli — {remaining} dakika sonra değiştirilebilir.
                      </p>
                      <div style={{ width: '100%', background: '#fee2e2', borderRadius: 9999, height: 3 }}>
                        <div style={{ width: `${((10 - remaining) / 10) * 100}%`, background: '#dc2626', borderRadius: 9999, height: 3, transition: 'width 1s linear' }} />
                      </div>
                    </div>
                  );
                  return (
                    <>
                      {pendingStatus ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontSize: 12, color: '#374151' }}>
                            <span style={{ color: '#9ca3af' }}>{STATUS_LABELS[campaign.status]}</span>
                            <span style={{ margin: '0 6px' }}>→</span>
                            <span style={{ fontWeight: 700, color: '#1F2A44' }}>{STATUS_LABELS[pendingStatus]}</span>
                          </p>
                          <textarea rows={2} placeholder="Açıklama (opsiyonel)" value={statusDescription} onChange={e => setStatusDescription(e.target.value)}
                            style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', resize: 'none', color: '#374151' }} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setPendingStatus(null); setStatusDescription(''); }}
                              style={{ flex: 1, fontSize: 12, padding: '7px', border: '1px solid #e5e7eb', borderRadius: 6, color: '#6b7280', background: '#fff', cursor: 'pointer' }}>İptal</button>
                            <button onClick={() => handleUpdateStatus(pendingStatus)} disabled={statusUpdating}
                              style={{ flex: 1, fontSize: 12, padding: '7px', background: '#1F2A44', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: statusUpdating ? 0.5 : 1 }}>
                              {statusUpdating ? '...' : 'Onayla'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select defaultValue="" onChange={e => { if (e.target.value) setPendingStatus(e.target.value); }}
                          style={{ width: '100%', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 10px', background: '#fff', color: '#374151' }}>
                          <option value="" disabled>Durumu değiştir...</option>
                          {OWNER_TRANSITIONS[campaign.status].map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                      {remaining !== null && remaining > 0 && !pendingStatus && (
                        <p style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>{remaining} dk içinde değiştirilebilir</p>
                      )}                      {dailyChangesRemaining !== null && !pendingStatus && (
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Bugün {dailyChangesRemaining} değişim hakkı kaldı</p>
                      )}
                      {statusMessage && !pendingStatus && (
                        <p style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>{statusMessage}</p>
                      )}
                    </>
                  );
                })()}

                {campaign.status !== 'archived' && !pendingStatus && (
                  <button onClick={() => setShowArchiveConfirm(true)} disabled={statusUpdating}
                    style={{ width: '100%', marginTop: 10, fontSize: 12, padding: '8px', border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', borderRadius: 6, cursor: 'pointer', opacity: statusUpdating ? 0.5 : 1 }}>
                    Arşivle
                  </button>
                )}

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 12 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    {campaign.investigation_mode ? 'Soruşturma modu açık.' : 'Soruşturma modunu etkinleştir.'}
                  </p>
                  <button onClick={() => handleToggleInvestigation(!campaign.investigation_mode)} disabled={investigationToggling}
                    style={{ width: '100%', fontSize: 12, padding: '8px', borderRadius: 6, border: campaign.investigation_mode ? '1px solid #fde68a' : 'none', background: campaign.investigation_mode ? '#fffbeb' : '#1F2A44', color: campaign.investigation_mode ? '#b45309' : '#fff', cursor: 'pointer', fontWeight: 600, opacity: investigationToggling ? 0.5 : 1 }}>
                    {investigationToggling ? '...' : campaign.investigation_mode ? 'Soruşturmayı Kapat' : 'Soruşturmayı Aç'}
                  </button>
                </div>
              </div>
            )}

            {/* Son destekleyenler — activity feed */}
            {signatures.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Son Destekleyenler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {signatures.slice(0, 8).map((sig: any) => {
                    const diffMs = Date.now() - new Date(sig.created_at).getTime();
                    const diffMin = Math.floor(diffMs / 60000);
                    const diffHr = Math.floor(diffMin / 60);
                    const diffDay = Math.floor(diffHr / 24);
                    const timeAgo = diffMin < 1 ? 'az önce' : diffMin < 60 ? `${diffMin} dk önce` : diffHr < 24 ? `${diffHr} sa önce` : `${diffDay} gün önce`;
                    const isRecent = diffMin < 60;
                    return (
                      <div key={sig.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isRecent ? '#f0fdf4' : '#f1f5f9', border: isRecent ? '1px solid #86efac' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isRecent ? '#15803d' : '#64748b', flexShrink: 0 }}>
                          {sig.is_anonymous ? '?' : sig.username?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2A44', margin: 0 }}>{sig.is_anonymous ? 'Anonim' : sig.username}</p>
                          {sig.message && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.message}</p>}
                        </div>
                        <span style={{ fontSize: 11, color: isRecent ? '#16a34a' : '#9ca3af', fontWeight: isRecent ? 600 : 400, flexShrink: 0 }}>{timeAgo}</span>
                      </div>
                    );
                  })}
                </div>
                {signatures.length > 8 && (
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
                    ve {(signatureCount - 8).toLocaleString('tr-TR')} kişi daha
                  </p>
                )}
              </div>
            )}

            {/* Hukuki Destek */}
            {legalStatus && (() => {
              const req = legalStatus.request;
              const isMatched = req?.status === 'matched';
              const isPending = req?.status === 'pending';
              const isReopened = req?.reopen_count > 0 && isPending;

              return (
                <div style={{ background: '#fff', border: `1px solid ${isMatched ? '#86efac' : '#e5e7eb'}`, borderRadius: 12, padding: '18px 20px' }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Hukuki Destek</h3>

                  {/* LOCKED — not eligible */}
                  {!legalStatus.is_eligible && !req && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Henüz uygun değil</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: legalStatus.has_min_support ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: legalStatus.has_min_support ? '#15803d' : '#9ca3af' }}>
                            {legalStatus.support_count} / {legalStatus.min_support_required} destek
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: legalStatus.deadline_passed ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: legalStatus.deadline_passed ? '#15803d' : '#9ca3af' }}>
                            {legalStatus.deadline_passed ? 'Yanıt süresi doldu' : 'Yanıt süresi bekleniyor'}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                        Bu otomatik hukuki işlem değildir. Koşullar sağlandığında kampanya sahibi avukat talebinde bulunabilir.
                      </p>
                    </div>
                  )}

                  {/* AVAILABLE — eligible but not yet requested, only creator can request */}
                  {legalStatus.is_eligible && !req && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1F2A44', flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2A44' }}>Hukuki destek uygun</p>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                        Bu kampanya hukuki inceleme için gerekli koşulları sağlıyor.
                      </p>
                      {isCreator ? (
                        <>
                          <button onClick={handleRequestLegal} disabled={legalRequesting}
                            style={{ width: '100%', padding: '10px', background: '#1F2A44', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: legalRequesting ? 0.5 : 1, marginBottom: 10 }}>
                            {legalRequesting ? 'Gönderiliyor...' : 'Avukat Talep Et'}
                          </button>
                          <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                            Bu otomatik hukuki işlem değildir. Avukat ve kullanıcı davayı birlikte değerlendirmelidir.
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                          Kampanya sahibi avukat talebinde bulunabilir.
                        </p>
                      )}
                    </div>
                  )}

                  {/* PENDING / REOPENED — waiting for lawyer */}
                  {isPending && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                          {isReopened ? 'Yeni avukat aranıyor' : 'Avukat bekleniyor'}
                        </p>
                      </div>
                      {isReopened ? (
                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                          Seçilen avukat ile iletişim kurulamadı. Kampanya tekrar diğer avukatlara açıldı.
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                          Talep avukatlara iletildi. Eşleşme gerçekleştiğinde bildirim alacaksınız.
                        </p>
                      )}
                    </div>
                  )}

                  {/* MATCHED — visible to everyone */}
                  {isMatched && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Hukuki değerlendirme aşamasında</p>
                      </div>

                      {/* Lawyer profile card */}
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '14px 16px', marginBottom: 14, border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: req.lawyer_bio ? 8 : 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1F2A44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                              {req.lawyer_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: '#1F2A44' }}>Av. {req.lawyer_name}</p>
                              {req.lawyer_verified && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, padding: '1px 6px' }}>Doğrulandı</span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: '#6b7280' }}>
                              {req.lawyer_expertise}{req.lawyer_city ? ` · ${req.lawyer_city}` : ''}
                            </p>
                          </div>
                        </div>
                        {req.lawyer_bio && (
                          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                            {req.lawyer_bio}
                          </p>
                        )}
                      </div>

                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
                        {req.lawyer_name} bu kampanyayla ilgileniyor. Kampanya hukuki değerlendirme aşamasında.
                      </p>
                      {isCreator && (
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
                          Avukat seninle iletişime geçebilir. İstersen aşağıdaki bilgiler üzerinden sen de ulaşabilirsin.
                        </p>
                      )}

                      {/* Disclaimer */}
                      <div style={{ background: '#f9fafb', borderRadius: 6, padding: '10px 12px', borderLeft: '2px solid #e5e7eb' }}>
                        <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>
                          EQUA hukuki sürecin tarafı değildir. Avukat ve kullanıcı arasındaki ilişki bağımsızdır.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Şikayet */}
            {user && !isCreator && (
              <button onClick={() => setShowReportModal(true)} disabled={!!userReport}
                style={{ width: '100%', fontSize: 12, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, color: userReport ? '#9ca3af' : '#6b7280', background: '#fff', cursor: userReport ? 'default' : 'pointer' }}>
                {userReport ? 'Şikayet Gönderildi' : 'Şikayet Et'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
