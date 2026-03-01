'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { getFingerprint } from '@/lib/use-fingerprint';

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_entity: '',
    target_type: 'company' as 'company' | 'brand' | 'government',
    category: '',
    target_email: '',
    standard_reference: '',
    standard_reference_other: '',
    demanded_action: '',
    response_deadline_days: 30,
  });

  const [evidence, setEvidence] = useState<{
    links: string[];
    documents: File[];
    images: File[];
  }>({
    links: [],
    documents: [],
    images: [],
  });

  const [newLink, setNewLink] = useState('');

  const categories = ['İnsan Hakları', 'Çevre', 'Hayvan Hakları', 'Ekonomik Adalet', 'Sağlık', 'Eğitim', 'Diğer'];

  const standardReferences = [
    'İnsan Hakları Evrensel Beyannamesi',
    'ILO Çalışma Standartları',
    'Tüketici Koruma Mevzuatı',
    'Çevresel Sürdürülebilirlik İlkeleri',
    'Kurumsal Şeffaflık İlkeleri',
    'Diğer'
  ];

  const responseDeadlines = [
    { value: 15, label: '15 gün' },
    { value: 30, label: '30 gün' },
    { value: 45, label: '45 gün' },
    { value: 60, label: '60 gün' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Kampanya oluşturmak için giriş yapmalısınız');
      router.push('/auth/login');
      return;
    }

    // V2 Validations
    if (!formData.standard_reference) {
      setError('Lütfen dayanılan ilke/standart seçiniz');
      return;
    }

    if (formData.standard_reference === 'Diğer' && !formData.standard_reference_other) {
      setError('Lütfen standart açıklamasını giriniz');
      return;
    }

    if (!formData.demanded_action || formData.demanded_action.length < 20) {
      setError('Talep edilen aksiyon en az 20 karakter olmalıdır');
      return;
    }

    if (evidence.links.length === 0 && evidence.documents.length === 0) {
      setError('En az 1 web linki veya belge eklemelisiniz');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const deviceFingerprint = await getFingerprint();
      const campaignData = {
        ...formData,
        evidence: { links: evidence.links }
      };

      const response: any = await api.createCampaign(campaignData, deviceFingerprint);
      if (response.success) {
        const campaignId = response.data.id;

        // Upload files
        if (evidence.documents.length > 0 || evidence.images.length > 0) {
          const allFiles = [...evidence.documents, ...evidence.images];
          for (const file of allFiles) {
            try {
              await api.uploadFile(file, 'campaign', campaignId);
            } catch (err) {
              console.error('File upload failed:', err);
            }
          }
        }

        alert('✅ Kampanya başarıyla oluşturuldu!');
        router.push(`/campaigns/${campaignId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Kampanya oluşturma başarısız');
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    if (newLink.trim()) {
      setEvidence({ ...evidence, links: [...evidence.links, newLink.trim()] });
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setEvidence({
      ...evidence,
      links: evidence.links.filter((_, i) => i !== index)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'documents' | 'images') => {
    const files = Array.from(e.target.files || []);
    setEvidence({ ...evidence, [type]: [...evidence[type], ...files] });
  };

  const removeFile = (index: number, type: 'documents' | 'images') => {
    setEvidence({
      ...evidence,
      [type]: evidence[type].filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Yeni Kampanya</h1>
          <p className="text-text-secondary">Haksızlığa karşı sesini yükselt</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && (
            <div className="bg-accent-danger bg-opacity-10 border border-accent-danger border-opacity-20 text-accent-danger px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Kampanya Başlığı *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={500}
              className="input-field"
              placeholder="Örn: Starbucks Boykotu - Filistin Desteği"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <p className="mt-1 text-xs text-text-tertiary">En az 5, en fazla 500 karakter</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Açıklama *
            </label>
            <textarea
              required
              minLength={20}
              rows={6}
              className="input-field"
              placeholder="Kampanyanızın detaylı açıklamasını yazın..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <p className="mt-1 text-xs text-text-tertiary">En az 20 karakter</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Hedef Kuruluş *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Örn: Starbucks"
                value={formData.target_entity}
                onChange={(e) => setFormData({ ...formData, target_entity: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Hedef Tipi *
              </label>
              <select
                required
                className="input-field"
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
              >
                <option value="company">Şirket</option>
                <option value="brand">Marka</option>
                <option value="government">Hükümet/Devlet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Kategori *
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData({ ...formData, category })}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    formData.category === category
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* V2: Standard Reference */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              🔎 Dayanılan İlke / Standart *
            </label>
            <select
              required
              className="input-field"
              value={formData.standard_reference}
              onChange={(e) => setFormData({ ...formData, standard_reference: e.target.value, standard_reference_other: '' })}
            >
              <option value="">Seçiniz...</option>
              {standardReferences.map((ref) => (
                <option key={ref} value={ref}>{ref}</option>
              ))}
            </select>
            {formData.standard_reference === 'Diğer' && (
              <input
                type="text"
                required
                className="input-field mt-2"
                placeholder="Lütfen standart açıklamasını giriniz"
                value={formData.standard_reference_other}
                onChange={(e) => setFormData({ ...formData, standard_reference_other: e.target.value })}
              />
            )}
            <p className="mt-1 text-xs text-text-tertiary">
              Kampanyanızın dayandığı hukuki veya etik standart
            </p>
          </div>

          {/* V2: Demanded Action */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              🎯 Talep Edilen Aksiyon *
            </label>
            <textarea
              required
              minLength={20}
              rows={4}
              className="input-field"
              placeholder="Bu kampanya sonucunda ilgili kurumdan hangi somut adımı talep ediyorsunuz?"
              value={formData.demanded_action}
              onChange={(e) => setFormData({ ...formData, demanded_action: e.target.value })}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              En az 20 karakter - Net ve somut bir talep belirtiniz
            </p>
          </div>

          {/* V2: Response Deadline */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              ⏳ Kurumdan Beklenen Yanıt Süresi *
            </label>
            <select
              required
              className="input-field"
              value={formData.response_deadline_days}
              onChange={(e) => setFormData({ ...formData, response_deadline_days: parseInt(e.target.value) })}
            >
              {responseDeadlines.map((deadline) => (
                <option key={deadline.value} value={deadline.value}>
                  {deadline.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-tertiary">
              Sistem otomatik timeline oluşturacak ve süre dolduğunda bildirim gönderecek
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Hedef Email (Opsiyonel)
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="info@company.com"
              value={formData.target_email}
              onChange={(e) => setFormData({ ...formData, target_email: e.target.value })}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Belirli imza sayısına ulaşınca otomatik email gönderilir
            </p>
          </div>

          {/* Evidence Section - NOW REQUIRED */}
          <div className="border-t border-border-color pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              📋 Kanıtlar *
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              En az 1 web linki veya belge eklemeniz zorunludur
            </p>

            {/* Links */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Web Linkleri
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  className="input-field flex-1"
                  placeholder="https://example.com/haber"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="btn-secondary"
                >
                  ➕ Ekle
                </button>
              </div>
              {evidence.links.length > 0 && (
                <div className="space-y-2">
                  {evidence.links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-bg-secondary rounded-xl">
                      <span className="flex-1 text-sm text-text-primary truncate">🔗 {link}</span>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="text-accent-danger hover:opacity-80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  📄 Belgeler
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => handleFileChange(e, 'documents')}
                  className="input-field"
                />
                {evidence.documents.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {evidence.documents.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-bg-secondary rounded-xl text-sm">
                        <span className="flex-1 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index, 'documents')}
                          className="text-accent-danger"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  🖼️ Görseller
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'images')}
                  className="input-field"
                />
                {evidence.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {evidence.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index, 'images')}
                          className="absolute -top-2 -right-2 bg-accent-danger text-white rounded-full w-6 h-6 flex items-center justify-center hover:opacity-80"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? '⏳ Oluşturuluyor...' : '🚀 Kampanya Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
