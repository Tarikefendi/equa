'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'equa_onboarding_seen';

export default function OnboardingModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setVisible(false);
  };

  const go = (path: string) => {
    dismiss();
    router.push(path);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: '36px 32px',
          maxWidth: 480, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, background: '#1F2A44', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>E</span>
          </div>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, letterSpacing: '.04em' }}>EQUA</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.25 }}>
          EQUA'ya hoş geldin
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: '0 0 28px' }}>
          Burası bir şikayet platformu değil. Kurumların hesap vermesini sağlayan bir sistem.
        </p>

        {/* Steps */}
        <div style={{ marginBottom: 28 }}>
          {[
            { n: '01', text: 'Kampanya oluştur' },
            { n: '02', text: 'Destek topla' },
            { n: '03', text: 'Kurumdan yanıt al' },
            { n: '04', text: 'Gerekirse hukuki sürece taşı' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '.06em', minWidth: 22 }}>{s.n}</span>
              <span style={{ fontSize: 14, color: '#374151' }}>{s.text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <button
            onClick={() => go('/campaigns/new')}
            style={{ width: '100%', padding: '13px 0', background: '#1F2A44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            İlk kampanyanı oluştur
          </button>
          <button
            onClick={() => go('/campaigns')}
            style={{ width: '100%', padding: '12px 0', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Önce kampanyaları keşfet
          </button>
        </div>

        {/* Intent selector */}
        <div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Ne yapmak istiyorsun?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Kampanya başlatmak', path: '/campaigns/new' },
              { label: 'Destek vermek', path: '/campaigns' },
              { label: 'Kurumları incelemek', path: '/entities' },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => go(opt.path)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13, color: '#374151', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#9ca3af'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          style={{ display: 'block', margin: '18px auto 0', background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Şimdi değil
        </button>
      </div>
    </div>
  );
}
