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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '24rem' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', textDecoration: 'none' }}>
          <div style={{ width: '2rem', height: '2rem', background: '#1F2A44', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>E</span>
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>EQUA</span>
        </Link>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.375rem' }}>Aramıza Katıl</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Ücretsiz hesap oluştur</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>E-posta</label>
              <input
                type="email"
                required
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#9ca3af')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Kullanıcı Adı</label>
              <input
                type="text"
                required
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#9ca3af')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Şifre</label>
              <input
                type="password"
                required
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#9ca3af')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Şifre Tekrar</label>
              <input
                type="password"
                required
                placeholder="Şifreyi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#9ca3af')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Dil / Language</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {(['tr', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      border: selectedLanguage === lang ? '2px solid #1F2A44' : '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: selectedLanguage === lang ? '#f0f2f5' : '#fff',
                      color: selectedLanguage === lang ? '#1F2A44' : '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: selectedLanguage === lang ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {lang === 'tr' ? 'Türkçe' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.6rem 1rem', background: loading ? '#9ca3af' : '#1F2A44', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: '0.25rem' }}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Zaten hesabın var mı?{' '}
              <Link href="/auth/login" style={{ color: '#1F2A44', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
              >
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link href="/" style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#6b7280')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af')}
          >
            Ana Sayfaya Don
          </Link>
        </div>
      </div>
    </div>
  );
}
