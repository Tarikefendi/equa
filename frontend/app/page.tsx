'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_campaigns: 0,
    active_campaigns: 0,
    total_votes: 0,
    total_users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // V2: Simplified stats - just count campaigns
      const response: any = await api.getCampaigns({ limit: 1000 });
      if (response.success && response.data) {
        const campaigns = response.data;
        setStats({
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter((c: any) => c.status === 'active').length,
          total_votes: campaigns.reduce((sum: number, c: any) => sum + (c.vote_count || 0), 0),
          total_users: 0, // Not available without separate endpoint
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section - Modern & Minimal */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-accent-secondary/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="text-text-primary">Birlikte</span>
              <br />
              <span className="text-gradient">Güçlüyüz</span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary mb-6 leading-relaxed">
              Haksızlıklara karşı sesini yükselt, değişimin parçası ol.
              Topluluk gücüyle gerçek etki yarat.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/campaigns" className="btn-primary">
                🚀 Kampanyaları Keşfet
              </Link>
              {user && (
                <Link href="/campaigns/new" className="btn-outline">
                  ➕ Kampanya Oluştur
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Modern Cards */}
      <section className="py-12 border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              value={loading ? '...' : stats.active_campaigns}
              label="Aktif Kampanya"
              icon="📢"
              color="from-accent-primary to-blue-500"
            />
            <StatCard
              value={loading ? '...' : stats.total_campaigns}
              label="Toplam Kampanya"
              icon="📊"
              color="from-accent-secondary to-green-500"
            />
            <StatCard
              value={loading ? '...' : stats.total_votes.toLocaleString()}
              label="Toplam Oy"
              icon="👍"
              color="from-purple-500 to-pink-500"
            />
            <StatCard
              value={loading ? '...' : stats.total_users}
              label="Kullanıcı"
              icon="👥"
              color="from-orange-500 to-red-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Modern Timeline */}
      <section className="py-16 border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-text-primary">
              Nasıl Çalışır?
            </h2>
            <p className="text-base text-text-secondary">
              Üç basit adımda değişimin parçası ol
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <StepCard
              number="1"
              title="Kampanya Oluştur"
              description="Haksızlık gördüğün bir durumu kampanyaya dönüştür. Kanıtlarını ekle, hedefini belirle."
              icon="✍️"
              gradient="from-accent-primary to-blue-500"
            />
            <StepCard
              number="2"
              title="Oy Ver & Paylaş"
              description="Kampanyaları destekle, yorum yap ve sosyal medyada paylaş. Topluluğu büyüt."
              icon="📣"
              gradient="from-accent-secondary to-green-500"
            />
            <StepCard
              number="3"
              title="Değişimi Gör"
              description="Birlikte hareket ederek gerçek değişim yarat. Sonuçları takip et."
              icon="🎯"
              gradient="from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border-color">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-text-secondary">
              Aktivizmi kolaylaştıran araçlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="📢"
              title="Kampanya Yönetimi"
              description="Kolayca kampanya oluştur, kanıt ekle ve hedefini belirle."
            />
            <FeatureCard
              icon="✍️"
              title="İmza Toplama"
              description="Kampanyalara destek topla, imza sayısını artır."
            />
            <FeatureCard
              icon="📊"
              title="Durum Takibi"
              description="Kampanya ilerlemesini takip et, güncellemeleri paylaş."
            />
            <FeatureCard
              icon="🔔"
              title="Bildirimler"
              description="Önemli gelişmelerden anında haberdar ol."
            />
            <FeatureCard
              icon="🛡️"
              title="Admin Onayı"
              description="Kaliteli içerik için moderasyon sistemi."
            />
            <FeatureCard
              icon="📧"
              title="Kurum İletişimi"
              description="Kampanyalarını hedef kurumlara ilet."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border-color">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="card p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Hazır mısın?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Hemen katıl ve sesini duyur. Değişim seninle başlıyor.
            </p>
            {user ? (
              <Link href="/campaigns/new" className="btn-primary text-lg px-8 py-4 inline-block">
                🚀 İlk Kampanyanı Oluştur
              </Link>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
                  Ücretsiz Kayıt Ol
                </Link>
                <Link href="/campaigns" className="btn-outline text-lg px-8 py-4">
                  Kampanyaları İncele
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-color py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="font-bold text-text-primary">Boykot Platform</span>
            </div>
            <p className="text-text-secondary text-sm">
              &copy; 2026 Boykot Platform. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center space-x-4 text-text-secondary">
              <Link href="/about" className="hover:text-text-primary transition-colors">Hakkında</Link>
              <Link href="/privacy" className="hover:text-text-primary transition-colors">Gizlilik</Link>
              <Link href="/terms" className="hover:text-text-primary transition-colors">Şartlar</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StatCard({ value, label, icon, color }: { value: string | number; label: string; icon: string; color: string }) {
  return (
    <div className="card p-4 text-center hover-lift">
      <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-xl`}>
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-text-primary mb-1">
        {value}
      </div>
      <div className="text-xs text-text-secondary font-medium">
        {label}
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon, gradient }: { number: string; title: string; description: string; icon: string; gradient: string }) {
  return (
    <div className="relative">
      <div className="card p-6 hover-lift h-full">
        <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className={`inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white text-sm font-bold mb-3`}>
          {number}
        </div>
        <h3 className="text-lg font-bold mb-2 text-text-primary">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card p-5 hover-lift">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-base font-bold mb-2 text-text-primary">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}
