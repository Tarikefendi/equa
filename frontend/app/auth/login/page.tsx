'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRecaptcha } from '@/lib/use-recaptcha';
import { getFingerprint } from '@/lib/use-fingerprint';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const { executeRecaptcha } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const captchaToken = await executeRecaptcha('login');
      const deviceFingerprint = await getFingerprint();
      await login(email, password, captchaToken, deviceFingerprint);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-wrap { display: flex; min-height: 100vh; background: #fff; }
        .login-left {
          flex: 0 0 46%;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
        }
        .login-bullets { display: flex; flex-direction: column; gap: 1.25rem; }
        .login-right {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 2.5rem 1.5rem;
          background: #fafafa;
        }
        .login-card {
          width: 100%; max-width: 21rem;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 2.25rem 2rem;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }
        .login-input {
          width: 100%; padding: 0.575rem 0.75rem;
          border: 1px solid #e5e7eb; border-radius: 0.5rem;
          font-size: 0.875rem; color: #0f172a; background: #fff;
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .login-input:focus {
          border-color: #1e293b;
          box-shadow: 0 0 0 2px rgba(30,41,59,0.1);
        }
        .login-btn {
          width: 100%; padding: 0.65rem 1rem;
          background: #1F2A44; color: #fff; border: none;
          border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .login-btn:hover:not(:disabled) {
          background: #2d3d5c;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .login-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        @media (max-width: 768px) {
          .login-left { flex: none; padding: 2rem 1.5rem; }
          .login-bullets { display: none; }
          .login-wrap { flex-direction: column; }
          .login-right { background: #fff; padding: 2rem 1.25rem; }
          .login-card { box-shadow: none; border: none; padding: 0; }
        }
      `}</style>

      <div className="login-wrap">

        {/* LEFT */}
        <div className="login-left">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: '1.875rem', height: '1.875rem', background: '#fff', borderRadius: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#1F2A44', fontWeight: 800, fontSize: '0.875rem' }}>E</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em' }}>EQUA</span>
          </Link>

          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem' }}>
              Topluluk gücüyle
            </p>
            <h1 style={{ fontSize: 'clamp(1.625rem, 2.5vw, 2.125rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 1rem' }}>
              Kurumları hesap vermeye zorla
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: '24rem' }}>
              Şeffaflık için kampanya başlat, toplulukla birlikte değişim yarat.
            </p>

            <div className="login-bullets">
              {[
                { title: 'Kampanya oluştur', desc: 'Sorunu belgele, hedef kurumu belirle' },
                { title: 'Kanıt ekle', desc: 'Belge ve bağlantılarla kampanyanı güçlendir' },
                { title: 'Sonuçları takip et', desc: 'Kurum yanıtlarını şeffaf şekilde izle' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.15rem' }}>{item.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            &copy; 2026 EQUA
          </p>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="login-card">
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.375rem' }}>Giriş Yap</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Hesabına eriş</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.7rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>
                    Şifre
                  </label>
                  <Link href="/auth/forgot-password" style={{ fontSize: '0.75rem', color: '#6b7280', textDecoration: 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#1F2A44')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#6b7280')}
                  >
                    Şifreni mi unuttun?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>

              <div style={{ marginTop: '0.25rem' }}>
                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? 'Giriş yapılıyor...' : 'Hesaba Giriş Yap'}
                </button>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', margin: '0.625rem 0 0' }}>
                  Güvenli giriş · Verilerin korunur · Şifrelenmiş bağlantı
                </p>
              </div>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.875rem', textAlign: 'center' }}>
                Hesabın yok mu?{' '}
                <Link href="/auth/register" style={{ color: '#1F2A44', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
                >
                  Kayıt Ol
                </Link>
              </p>
              <div style={{ textAlign: 'center' }}>
                <Link href="/" style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#6b7280')}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af')}
                >
                  Ana sayfaya don
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
