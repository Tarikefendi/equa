'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, color: '#0f172a', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 2500);
      } else {
        setError(data.message || 'Bağlantı geçersiz veya süresi dolmuş.');
      }
    } catch {
      setError('Bir hata oluştu. Tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 16 }}>Geçersiz sıfırlama bağlantısı.</p>
        <Link href="/auth/forgot-password" style={{ fontSize: 14, color: '#1F2A44', fontWeight: 600, textDecoration: 'none' }}>
          Yeni link talep et
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Yeni Şifre Belirle</h1>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>En az 8 karakter kullan.</p>

      {success ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 16px' }}>
          <p style={{ fontSize: 14, color: '#15803d', margin: 0 }}>
            Şifren başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsun...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Yeni Şifre
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Şifre Tekrar
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={inp}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px 0', background: '#1F2A44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, color: '#0f172a', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '32px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, background: '#1F2A44', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>E</span>
          </div>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, letterSpacing: '.04em' }}>EQUA</span>
        </Link>

        <Suspense fallback={<p style={{ fontSize: 14, color: '#6b7280' }}>Yükleniyor...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
