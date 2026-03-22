'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    // Always show success — don't reveal if email exists
    setSubmitted(true);
    setLoading(false);
  };

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

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Şifre Sıfırlama</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
          Kayıtlı e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
        </p>

        {submitted ? (
          <div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#15803d', margin: 0, lineHeight: 1.55 }}>
                Eğer bu email kayıtlıysa, sana bir sıfırlama bağlantısı gönderdik.
              </p>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
              Test modunda: sıfırlama linki backend console'una yazdırılıyor.
            </p>
            <Link href="/auth/login" style={{ display: 'block', textAlign: 'center', fontSize: 14, color: '#1F2A44', fontWeight: 600, textDecoration: 'none' }}>
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                E-posta
              </label>
              <input
                type="email"
                required
                placeholder="ornek@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inp}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px 0', background: '#1F2A44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama linki gönder'}
            </button>

            <Link href="/auth/login" style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
              Giriş sayfasına dön
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
