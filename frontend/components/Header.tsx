'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close sidebar on every route change
  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  useEffect(() => {
    if (user) loadUnreadCount();
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response: any = await api.getNotifications();
      if (response.success && response.data) {
        setUnreadCount(response.data.filter((n: any) => !n.is_read).length);
      }
    } catch {}
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res: any = await api.searchCampaigns(val.trim());
        setSearchResults(res.data || []);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  };

  const handleResultClick = (id: string) => {
    setShowResults(false);
    setSearchQuery('');
    router.push(`/campaigns/${id}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Sidebar overlay */}
      {showSidebar && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: '17rem',
        background: '#fff', borderRight: '1px solid #e5e7eb', zIndex: 50,
        transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Sidebar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderBottom: '1px solid #e5e7eb' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }} onClick={() => setShowSidebar(false)}>
            <div style={{ width: '2rem', height: '2rem', background: '#1F2A44', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>E</span>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>EQUA</span>
          </Link>
          <button onClick={() => setShowSidebar(false)} style={{ padding: '0.35rem', borderRadius: '0.35rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User section */}
        {user && (
          <div style={{ padding: '0.875rem 1.1rem', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#1F2A44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
            </div>
            {!user.is_verified && (
              <p style={{ fontSize: '0.72rem', color: '#b45309', margin: '0.5rem 0 0', background: '#fef3c7', padding: '0.3rem 0.6rem', borderRadius: '0.3rem' }}>Email doğrulanmadı</p>
            )}
          </div>
        )}

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
          {user ? (
            <>
              {/* Main group */}
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 1.1rem', margin: '0 0 0.25rem' }}>Ana</p>
              <SidebarLink href="/" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}>
                Ana Sayfa
              </SidebarLink>
              <SidebarLink href="/campaigns" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}>
                Kampanyalar
              </SidebarLink>
              <SidebarLink href="/entities" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                Kurumlar
              </SidebarLink>
              <SidebarLink href="/lawyers" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}>
                Avukatlar
              </SidebarLink>

              {/* Action group */}
              <div style={{ margin: '0.75rem 1.1rem 0.5rem', borderTop: '1px solid #f3f4f6' }} />
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 1.1rem', margin: '0 0 0.25rem' }}>İşlem</p>
              <div style={{ padding: '0 0.75rem', marginBottom: '0.25rem' }}>
                <Link href="/campaigns/new" onClick={() => setShowSidebar(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '0.45rem', border: '1px solid #1F2A44', background: '#1F2A44', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>
                  Yeni Kampanya
                </Link>
              </div>

              {/* Account group */}
              <div style={{ margin: '0.75rem 1.1rem 0.5rem', borderTop: '1px solid #f3f4f6' }} />
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 1.1rem', margin: '0 0 0.25rem' }}>Hesap</p>
              <SidebarLink href="/profile" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
                Profil
              </SidebarLink>
              <SidebarLink href="/notifications" onClick={() => setShowSidebar(false)} badge={unreadCount}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}>
                Bildirimler
              </SidebarLink>
              {user.is_admin && (
                <SidebarLink href="/admin" onClick={() => setShowSidebar(false)}
                  icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}>
                  Admin Panel
                </SidebarLink>
              )}

              {/* Danger zone */}
              <div style={{ margin: '0.75rem 1.1rem 0.5rem', borderTop: '1px solid #f3f4f6' }} />
              <button
                onClick={() => { logout(); setShowSidebar(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1.1rem', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 1.1rem', margin: '0 0 0.25rem' }}>Ana</p>
              <SidebarLink href="/" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}>
                Ana Sayfa
              </SidebarLink>
              <SidebarLink href="/campaigns" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}>
                Kampanyalar
              </SidebarLink>
              <SidebarLink href="/entities" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                Kurumlar
              </SidebarLink>
              <SidebarLink href="/lawyers" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}>
                Avukatlar
              </SidebarLink>
              <div style={{ margin: '0.75rem 1.1rem 0.5rem', borderTop: '1px solid #f3f4f6' }} />
              <SidebarLink href="/auth/login" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}>
                Giriş Yap
              </SidebarLink>
              <SidebarLink href="/auth/register" onClick={() => setShowSidebar(false)}
                icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}>
                Kayıt Ol
              </SidebarLink>
            </>
          )}
        </nav>
      </aside>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: scrolled ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '3.5rem', gap: '0.75rem' }}>

            {/* Hamburger */}
            <button
              onClick={() => setShowSidebar(true)}
              style={{ padding: '0.4rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
              aria-label="Menu"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: '1.75rem', height: '1.75rem', background: '#1F2A44', borderRadius: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem' }}>E</span>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>EQUA</span>
            </Link>

            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '26rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#f9fafb',
                border: searchFocused ? '1px solid #9ca3af' : '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.7rem',
                transition: 'border-color 0.15s',
              }}>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => { setSearchFocused(true); searchResults.length > 0 && setShowResults(true); }}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Kampanya, kurum veya konu ara..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#0f172a', width: '100%' }}
                />
                {searchLoading && (
                  <div style={{ width: '0.75rem', height: '0.75rem', border: '1.5px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
                )}
              </div>

              {showResults && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden' }}>
                  {searchResults.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#9ca3af', padding: '0.75rem 1rem', margin: 0 }}>Sonuç bulunamadı.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {searchResults.map((c: any) => (
                        <li key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <button
                            onClick={() => handleResultClick(c.id)}
                            style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                            <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                              {c.entity_name && <span>{c.entity_name}</span>}
                              <span>· {c.category} · {c.signature_count} destek</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
              {user ? (
                <>
                  {/* Notification bell */}
                  <Link href="/notifications" title="Bildirimler"
                    style={{ position: 'relative', padding: '0.4rem', borderRadius: '0.4rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'background 0.15s, color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLAnchorElement).style.color = '#374151'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280'; }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: '3px', right: '3px', minWidth: '0.9rem', height: '0.9rem', background: '#e53e3e', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0 0.15rem' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* New campaign CTA */}
                  <Link href="/campaigns/new"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem', borderRadius: '0.4rem', background: '#1F2A44', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.8125rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#2d3d5c')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#1F2A44')}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Kampanya
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login"
                    style={{ padding: '0.4rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500, textDecoration: 'none', fontSize: '0.8125rem', background: 'transparent', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#9ca3af'; (e.currentTarget as HTMLAnchorElement).style.color = '#0f172a'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLAnchorElement).style.color = '#374151'; }}
                  >
                    Giriş Yap
                  </Link>
                  <Link href="/auth/register"
                    style={{ padding: '0.4rem 0.85rem', borderRadius: '0.4rem', background: '#1F2A44', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.8125rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#2d3d5c')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#1F2A44')}
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function SidebarLink({
  href, icon, children, badge, onClick
}: {
  href: string; icon: React.ReactNode; children: React.ReactNode; badge?: number; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 1.1rem', textDecoration: 'none', transition: 'background 0.1s', borderRadius: 0 }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>{children}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span style={{ minWidth: '1.1rem', height: '1.1rem', padding: '0 0.25rem', background: '#dc2626', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
