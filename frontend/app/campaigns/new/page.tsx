'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { getFingerprint } from '@/lib/use-fingerprint';

const DRAFT_KEY = 'equa_campaign_draft_v2';

const CATEGORIES = [
  'İnsan Hakları', 'Çevre', 'Hayvan Hakları', 'Ekonomik Adalet',
  'Sağlık', 'Eğitim', 'Tüketici Hakları', 'Çalışma Hakları', 'Diğer',
];

const inp: React.CSSProperties = {
  width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '11px 14px', background: '#fff', boxSizing: 'border-box', outline: 'none', color: '#1F2A44',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [entityQuery, setEntityQuery] = useState('');
  const [entityResults, setEntityResults] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [entityLoading, setEntityLoading] = useState(false);
  const [showNewEntityForm, setShowNewEntityForm] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', type: '', country: '', website: '', description: '' });
  const [similarCampaigns, setSimilarCampaigns] = useState<any[]>([]);

  const [description, setDescription] = useState('');
  const [demandedAction, setDemandedAction] = useState('');
  const [targetType, setTargetType] = useState('company');

  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [deadlineDays] = useState<number>(30);

  // AI suggestion state
  const [titleHint, setTitleHint] = useState<string | null>(null);
  const [descHint, setDescHint] = useState(false);
  const [categoryHint, setCategoryHint] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) { setTitle(d.title); setHasDraft(true); }
        if (d.category) setCategory(d.category);
        if (d.entityQuery) setEntityQuery(d.entityQuery);
        if (d.selectedEntity) setSelectedEntity(d.selectedEntity);
        if (d.description) setDescription(d.description);
        if (d.demandedAction) setDemandedAction(d.demandedAction);
        if (d.links) setLinks(d.links);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!title && !description) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, category, entityQuery, selectedEntity, description, demandedAction, links }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch {}
    }, 2000);
  }, [title, category, entityQuery, selectedEntity, description, demandedAction, links]);

  const handleEntitySearch = (q: string) => {
    setEntityQuery(q); setSelectedEntity(null); setShowNewEntityForm(false);
    if (entityTimer.current) clearTimeout(entityTimer.current);
    if (!q.trim()) { setEntityResults([]); setShowDropdown(false); return; }
    entityTimer.current = setTimeout(async () => {
      setEntityLoading(true);
      try {
        const res: any = await api.searchEntities(q);
        const results = res.data || [];
        setEntityResults(results);
        setShowDropdown(results.length > 0);
      } catch { setEntityResults([]); setShowDropdown(false); }
      finally { setEntityLoading(false); }
    }, 300);
  };

  const selectEntity = (e: any) => {
    setSelectedEntity(e); setEntityQuery(e.name); setShowDropdown(false); setShowNewEntityForm(false);
  };

  const handleCreateEntity = async () => {
    if (!newEntity.name.trim()) return;
    try {
      const res: any = await api.createEntity(newEntity);
      selectEntity(res.data); setShowNewEntityForm(false);
      setNewEntity({ name: '', type: '', country: '', website: '', description: '' });
    } catch (err: any) { setErrors(prev => ({ ...prev, entity: err.message || 'Kurum oluşturulamadı' })); }
  };

  const handleTitleChange = (v: string) => {
    setTitle(v);
    setTitleHint(null);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (v.trim().length < 3) { setSimilarCampaigns([]); return; }
    titleTimer.current = setTimeout(async () => {
      // AI title clarity hint
      if (v.trim().length >= 10) {
        const words = v.trim().split(/\s+/);
        const hasEntity = /[A-ZÇĞİÖŞÜ]/.test(v);
        const isVague = words.length < 4 || !hasEntity;
        if (isVague) {
          setTitleHint('Başlık daha spesifik olabilir. Kurum adı ve somut sorunu belirt. Örn: "Türk Telekom Haksız Fatura Uygulaması Durdurulsun"');
        }
      }
      try {
        const res: any = await api.getSimilarCampaigns(v.trim());
        setSimilarCampaigns(res.data || []);
      } catch { setSimilarCampaigns([]); }
    }, 400);
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (title.trim().length < 5) e.title = 'En az 5 karakter giriniz.';
      if (!selectedEntity && !entityQuery.trim()) e.entity = 'Hedef kurumu seçiniz.';
      if (!category) e.category = 'Kategori seçiniz.';
    }
    if (s === 2) {
      if (description.trim().length < 20) e.description = 'En az 20 karakter giriniz.';
      if (!demandedAction.trim()) e.demandedAction = 'Talebinizi yazınız.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };
  const handleBack = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setLoading(true);
    try {
      const deviceFingerprint = await getFingerprint();
      const campaignData = {
        title, description, demanded_action: demandedAction,
        target_entity: selectedEntity?.name || entityQuery,
        entity_id: selectedEntity?.id || undefined,
        target_type: selectedEntity?.type === 'government' ? 'government' : selectedEntity?.type === 'brand' ? 'brand' : targetType,
        category, visibility: 'public',
        response_deadline_days: deadlineDays,
        evidence: { links },
      };
      const response: any = await api.createCampaign(campaignData, deviceFingerprint);
      if (response.success) {
        const campaignId = response.data.id;
        for (const file of [...documents, ...images]) {
          try { await api.uploadFile(file, 'campaign', campaignId); } catch {}
        }
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/campaigns/${campaignId}`);
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Kampanya oluşturulamadı.' });
    } finally { setLoading(false); }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle(''); setCategory(''); setEntityQuery(''); setSelectedEntity(null);
    setDescription(''); setDemandedAction(''); setLinks([]);
    setHasDraft(false);
  };

  const addLink = () => {
    if (!newLink.trim()) return;
    setLinks(prev => [...prev, newLink.trim()]);
    setNewLink('');
  };

  const removeLink = (i: number) => setLinks(prev => prev.filter((_, idx) => idx !== i));

  // Preview modal
  const PreviewCard = () => {
    const summary = [title, description ? description.slice(0, 120) + (description.length > 120 ? '...' : '') : ''].filter(Boolean).join(' — ');
    return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Önizleme</p>
        {category && <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>{category}</span>}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>{title || 'Kampanya başlığı'}</h2>
        {(selectedEntity || entityQuery) && (
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Hedef: {selectedEntity?.name || entityQuery}</p>
        )}
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
          {description ? (description.length > 200 ? description.slice(0, 200) + '...' : description) : 'Açıklama girilmedi.'}
        </p>
        {/* AI summary */}
        {title && description && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Kampanya özeti</p>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.55 }}>{summary}</p>
          </div>
        )}
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>Bu şekilde görünecek.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowPreview(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}>Geri Dön</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: '#1F2A44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Yayınlanıyor...' : 'Yayınla'}
          </button>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Header />
      {showPreview && <PreviewCard />}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Kampanya Oluştur</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Adım {step} / 3</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, margin: '20px 0 28px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 9999, background: step >= n ? '#1F2A44' : '#e5e7eb', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Draft banner */}
        {hasDraft && step === 1 && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#475569' }}>Kaldığın yerden devam ediyorsun.</span>
            <button onClick={clearDraft} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Temizle</button>
          </div>
        )}
        {draftSaved && <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textAlign: 'right' }}>Taslak kaydedildi.</p>}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 24 }}>Temel Bilgiler</h2>

            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Kampanya Başlığı</label>
              <input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Kısa ve net yaz (örn: Türk Telekom haksız ücret alıyor)"
                style={{ ...inp, borderColor: errors.title ? '#ef4444' : '#e5e7eb' }}
                maxLength={120}
              />
              {errors.title && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.title}</p>}
              {titleHint && (
                <div style={{ marginTop: 8, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ fontSize: 12, color: '#0369a1', margin: 0, lineHeight: 1.5 }}>{titleHint}</p>
                  <button onClick={() => setTitleHint(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              )}
              {similarCampaigns.length > 0 && (
                <div style={{ marginTop: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, color: '#92400e', marginBottom: 6, fontWeight: 500 }}>Benzer kampanyalar mevcut:</p>
                  {similarCampaigns.slice(0, 3).map((c: any) => (
                    <a key={c.id} href={`/campaigns/${c.id}`} target="_blank" rel="noreferrer"
                      style={{ display: 'block', fontSize: 12, color: '#1d4ed8', marginBottom: 2, textDecoration: 'none' }}>
                      {c.title}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Entity */}
            <div style={{ marginBottom: 20, position: 'relative' }} ref={dropdownRef}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Hedef Kurum</label>
              <input
                value={entityQuery}
                onChange={e => handleEntitySearch(e.target.value)}
                placeholder="Kurum adı ara..."
                style={{ ...inp, borderColor: errors.entity ? '#ef4444' : '#e5e7eb' }}
              />
              {entityLoading && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Aranıyor...</p>}
              {errors.entity && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.entity}</p>}
              {showDropdown && entityResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, marginTop: 4 }}>
                  {entityResults.map((e: any) => (
                    <button key={e.id} onClick={() => selectEntity(e)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1F2A44', borderBottom: '1px solid #f3f4f6' }}>
                      {e.name}
                      {e.verified && <span style={{ fontSize: 11, color: '#059669', marginLeft: 6 }}>Doğrulandı</span>}
                    </button>
                  ))}
                  <button onClick={() => { setShowDropdown(false); setShowNewEntityForm(true); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
                    + Yeni kurum ekle
                  </button>
                </div>
              )}
              {!showDropdown && entityQuery.trim().length > 1 && !selectedEntity && !entityLoading && (
                <button onClick={() => setShowNewEntityForm(true)}
                  style={{ marginTop: 6, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Bulamadım, yeni kurum ekle
                </button>
              )}
              {selectedEntity && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Seçildi: {selectedEntity.name}</p>
              )}
            </div>

            {/* New entity form */}
            {showNewEntityForm && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 12 }}>Yeni Kurum</p>
                <input value={newEntity.name} onChange={e => setNewEntity(p => ({ ...p, name: e.target.value }))} placeholder="Kurum adı" style={{ ...inp, marginBottom: 8 }} />
                <select value={newEntity.type} onChange={e => setNewEntity(p => ({ ...p, type: e.target.value }))} style={{ ...inp, marginBottom: 8 }}>
                  <option value="">Tür seçin</option>
                  <option value="company">Şirket</option>
                  <option value="government">Devlet Kurumu</option>
                  <option value="ngo">STK</option>
                  <option value="other">Diğer</option>
                </select>
                <input value={newEntity.country} onChange={e => setNewEntity(p => ({ ...p, country: e.target.value }))} placeholder="Ülke (opsiyonel)" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCreateEntity} style={{ flex: 1, padding: '9px 0', background: '#1F2A44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Ekle</button>
                  <button onClick={() => setShowNewEntityForm(false)} style={{ flex: 1, padding: '9px 0', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Vazgeç</button>
                </div>
              </div>
            )}

            {/* Target Type — only show if no entity selected */}
            {!selectedEntity && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Kurum Türü</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ value: 'company', label: 'Şirket' }, { value: 'brand', label: 'Marka' }, { value: 'government', label: 'Kamu Kurumu' }].map(t => (
                    <button key={t.value} onClick={() => setTargetType(t.value)}
                      style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: targetType === t.value ? '1.5px solid #1F2A44' : '1px solid #e5e7eb', background: targetType === t.value ? '#1F2A44' : '#fff', color: targetType === t.value ? '#fff' : '#374151', transition: 'all 0.15s' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Kategori</label>              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => { setCategory(c); setCategoryHint(true); }}
                    style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', border: category === c ? '1.5px solid #1F2A44' : '1px solid #e5e7eb', background: category === c ? '#1F2A44' : '#fff', color: category === c ? '#fff' : '#374151', transition: 'all 0.15s' }}>
                    {c}
                  </button>
                ))}
              </div>
              {errors.category && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{errors.category}</p>}
              {categoryHint && category && (
                <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 12, color: '#15803d', margin: 0 }}>
                    Bu kampanya <strong>{category}</strong> kapsamında olabilir. Adım 2'de talebini net yaz — bu kategoride standart referanslar mevcut.
                  </p>
                  <button onClick={() => setCategoryHint(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 24 }}>Detay ve Talep</h2>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Sorun Açıklaması</label>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Sorunu net şekilde açıkla. Ne oluyor?</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => { if (description.trim().length > 0 && description.trim().length < 100) setDescHint(true); }}
                placeholder="Yaşanan sorunu detaylı anlat..."
                rows={6}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, borderColor: errors.description ? '#ef4444' : '#e5e7eb' }}
              />
              {errors.description && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.description}</p>}
              {descHint && description.trim().length < 100 && (
                <div style={{ marginTop: 8, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#0369a1', margin: '0 0 4px', fontWeight: 500 }}>Daha güçlü bir açıklama için şu soruları yanıtla:</p>
                    <p style={{ fontSize: 12, color: '#0369a1', margin: 0, lineHeight: 1.7 }}>• Sorun nedir?<br />• Kim etkileniyor?<br />• Ne talep ediliyor?</p>
                  </div>
                  <button onClick={() => setDescHint(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Talep</label>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Kurumdan tam olarak ne istiyorsun?</p>
              <textarea
                value={demandedAction}
                onChange={e => setDemandedAction(e.target.value)}
                placeholder="Örn: Haksız kesilen ücretlerin iade edilmesini talep ediyoruz."
                rows={4}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6, borderColor: errors.demandedAction ? '#ef4444' : '#e5e7eb' }}
              />
              {errors.demandedAction && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.demandedAction}</p>}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                Kurumun bu kampanyaya <span style={{ fontWeight: 600 }}>30 gün</span> içinde yanıt vermesi beklenir.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Kanıtlar</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Kanıt eklemek kampanyanın güvenilirliğini artırır. İstersen şimdi ekle, sonra da ekleyebilirsin.</p>

            {/* Link input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Bağlantı Ekle</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                  placeholder="https://..."
                  style={{ ...inp, flex: 1 }}
                />
                <button onClick={addLink} style={{ padding: '0 18px', background: '#1F2A44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Ekle</button>
              </div>
              {links.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {links.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{l}</span>
                      <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Belge veya Görsel</label>
              <label style={{ display: 'block', border: '2px dashed #e5e7eb', borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const imgs = files.filter(f => f.type.startsWith('image/'));
                    const docs = files.filter(f => !f.type.startsWith('image/'));
                    setImages(prev => [...prev, ...imgs]);
                    setDocuments(prev => [...prev, ...docs]);
                  }}
                />
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Dosya seç veya sürükle bırak</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>PDF, DOC, JPG, PNG</p>
              </label>
              {[...documents, ...images].length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {[...documents, ...images].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{f.name}</span>
                      <button onClick={() => {
                        setDocuments(prev => prev.filter(d => d !== f));
                        setImages(prev => prev.filter(img => img !== f));
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {links.length === 0 && documents.length === 0 && images.length === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>Henüz kanıt eklenmedi. Kanıt eklemek kampanyanın güvenilirliğini artırır.</p>
            )}
          </div>
        )}

        {/* Submit error */}
        {errors.submit && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{errors.submit}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button onClick={handleBack}
              style={{ flex: 1, padding: '12px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              Geri
            </button>
          )}
          {step < 3 && (
            <button onClick={handleNext}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderRadius: 8, background: '#1F2A44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Devam et
            </button>
          )}
          {step === 3 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setShowPreview(true)}
                style={{ width: '100%', padding: '12px 0', border: '1px solid #1F2A44', borderRadius: 8, background: '#fff', color: '#1F2A44', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Önizle
              </button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 8, background: '#1F2A44', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Yayınlanıyor...' : 'Kampanyayı Yayınla'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
