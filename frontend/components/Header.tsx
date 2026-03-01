'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Header() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response: any = await api.getNotifications();
      if (response.success && response.data) {
        const unread = response.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await api.resendVerification();
      alert('Doğrulama emaili gönderildi! Lütfen email kutunuzu kontrol edin.');
    } catch (error: any) {
      alert(error.message || 'Email gönderilemedi');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-bg-primary border-r border-border-color z-50 transform transition-transform duration-300 ease-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-color">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setShowSidebar(false)}>
              <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-gradient">Boykot</span>
            </Link>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 rounded-full hover:bg-bg-hover transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-border-color">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-semibold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{user.username}</p>
                  <p className="text-sm text-text-secondary truncate">{user.email}</p>
                </div>
              </div>
              {!user.is_verified && (
                <div className="px-3 py-2 rounded-lg bg-accent-warning bg-opacity-10 border border-accent-warning border-opacity-20">
                  <p className="text-xs text-accent-warning font-medium">⚠️ Email doğrulanmadı</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {user ? (
              <>
                <SidebarLink href="/" icon="🏠" onClick={() => setShowSidebar(false)}>
                  Ana Sayfa
                </SidebarLink>
                <SidebarLink href="/campaigns" icon="📢" onClick={() => setShowSidebar(false)}>
                  Kampanyalar
                </SidebarLink>
                <SidebarLink href="/campaigns/new" icon="➕" onClick={() => setShowSidebar(false)}>
                  Yeni Kampanya
                </SidebarLink>
                
                <div className="my-2 mx-4 border-t border-border-color" />
                
                <SidebarLink href="/profile" icon="👤" onClick={() => setShowSidebar(false)}>
                  Profil
                </SidebarLink>
                <SidebarLink href="/notifications" icon="🔔" badge={unreadCount} onClick={() => setShowSidebar(false)}>
                  Bildirimler
                </SidebarLink>
                
                {user.is_admin && (
                  <>
                    <div className="my-2 mx-4 border-t border-border-color" />
                    <SidebarLink href="/admin" icon="🛡️" onClick={() => setShowSidebar(false)}>
                      Admin Panel
                    </SidebarLink>
                  </>
                )}
                
                <div className="my-2 mx-4 border-t border-border-color" />
                
                <button
                  onClick={() => {
                    logout();
                    setShowSidebar(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors flex items-center space-x-3 text-accent-danger"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-medium">Çıkış Yap</span>
                </button>
              </>
            ) : (
              <>
                <SidebarLink href="/" icon="🏠" onClick={() => setShowSidebar(false)}>
                  Ana Sayfa
                </SidebarLink>
                <SidebarLink href="/campaigns" icon="📢" onClick={() => setShowSidebar(false)}>
                  Kampanyalar
                </SidebarLink>
                
                <div className="my-2 mx-4 border-t border-border-color" />
                
                <SidebarLink href="/auth/login" icon="🔑" onClick={() => setShowSidebar(false)}>
                  Giriş Yap
                </SidebarLink>
                <SidebarLink href="/auth/register" icon="✨" onClick={() => setShowSidebar(false)}>
                  Kayıt Ol
                </SidebarLink>
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Top Header - Minimal */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-bg-primary/80 border-b border-border-color">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2.5 rounded-full hover:bg-bg-hover transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">Boykot</span>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className="p-2.5 rounded-full hover:bg-bg-hover transition-colors relative"
                    title="Bildirimler"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-accent-danger rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* New Campaign Button */}
                  <Link
                    href="/campaigns/new"
                    className="btn-primary hidden sm:inline-flex"
                  >
                    ➕ Yeni Kampanya
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2">
                    Giriş Yap
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Email Verification Banner */}
      {user && !user.is_verified && (
        <div className="bg-accent-warning bg-opacity-10 border-b border-accent-warning border-opacity-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-accent-warning text-xl">⚠️</span>
                <p className="text-sm" style={{ color: 'var(--accent-warning)' }}>
                  <span className="font-medium">Email adresiniz doğrulanmadı.</span> Bazı özellikler kısıtlı olabilir.
                </p>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="text-sm font-medium hover:opacity-80 underline disabled:opacity-50 transition-opacity"
                style={{ color: 'var(--accent-warning)' }}
              >
                {sendingVerification ? 'Gönderiliyor...' : 'Doğrulama Emaili Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SidebarLink({ 
  href, 
  icon, 
  children, 
  badge, 
  onClick 
}: { 
  href: string; 
  icon: string; 
  children: React.ReactNode; 
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <span className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
          {children}
        </span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[20px] h-5 px-2 bg-accent-danger rounded-full flex items-center justify-center text-white text-xs font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
