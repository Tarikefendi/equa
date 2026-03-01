'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useRecaptcha } from '@/lib/use-recaptcha';
import { getFingerprint } from '@/lib/use-fingerprint';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { setLanguage } = useLanguage();
  const { executeRecaptcha } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'tr' | 'en'>('tr');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }

    setLoading(true);

    try {
      const captchaToken = await executeRecaptcha('register');
      const deviceFingerprint = await getFingerprint();
      
      const response: any = await api.register(email, username, password, captchaToken, deviceFingerprint);
      if (response.success) {
        setLanguage(selectedLanguage);
        const loginCaptchaToken = await executeRecaptcha('login');
        await login(email, password, loginCaptchaToken);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-accent-secondary/5 to-transparent"></div>
      
      <div className="relative max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <span className="text-2xl font-bold text-gradient">Boykot</span>
        </Link>

        {/* Card */}
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Aramıza Katıl</h1>
            <p className="text-text-secondary">Ücretsiz hesap oluştur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-accent-danger bg-opacity-10 border border-accent-danger border-opacity-20 text-accent-danger px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                E-posta
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Şifre
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Şifre Tekrar
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Şifreyi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Dil / Language
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('tr')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedLanguage === 'tr'
                      ? 'border-accent-primary bg-accent-primary bg-opacity-10 text-accent-primary'
                      : 'border-border-color text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  🇹🇷 Türkçe
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedLanguage === 'en'
                      ? 'border-accent-primary bg-accent-primary bg-opacity-10 text-accent-primary'
                      : 'border-border-color text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '⏳ Kayıt yapılıyor...' : '🚀 Kayıt Ol'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Zaten hesabın var mı?{' '}
              <Link href="/auth/login" className="text-accent-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
