'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FilterTab = 'all' | 'unread' | 'support' | 'update' | 'response';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function groupByDate(notifications: any[]): { label: string; items: any[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, any[]> = { 'Bugün': [], 'Dün': [], 'Bu Hafta': [], 'Daha Önce': [] };

  notifications.forEach(n => {
    const d = new Date(n.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups['Bugün'].push(n);
    else if (day >= yesterday) groups['Dün'].push(n);
    else if (day >= weekAgo) groups['Bu Hafta'].push(n);
    else groups['Daha Önce'].push(n);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  organization_response: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    color: '#1e40af', bg: '#dbeafe',
  },
  campaign_update: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    color: '#6d28d9', bg: '#ede9fe',
  },
  campaign_approved: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>,
    color: '#15803d', bg: '#dcfce7',
  },
  campaign_rejected: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    color: '#b91c1c', bg: '#fee2e2',
  },
  milestone_reached: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    color: '#b45309', bg: '#fef3c7',
  },
  new_signature: {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    color: '#0369a1', bg: '#e0f2fe',
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || {
    icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    color: '#374151', bg: '#f3f4f6',
  };
}

function isTypeInFilter(type: string, filter: FilterTab): boolean {
  if (filter === 'all') return true;
  if (filter === 'response') return type === 'organization_response';
  if (filter === 'update') return type === 'campaign_update';
  if (filter === 'support') return type === 'new_signature' || type === 'milestone_reached';
  return true;
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '60%', marginBottom: 8 }} />
          <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '85%', marginBottom: 8 }} />
          <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '40%' }} />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    loadNotifications();
  }, [user, authLoading]);

  const loadNotifications = async () => {
    try {
      const response: any = await api.getNotifications();
      if (response.success && response.data) setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (readingId) return;
    setReadingId(id);
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
    finally { setReadingId(null); }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
    finally { setMarkingAll(false); }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) markAsRead(n.id);
  };

  const getCampaignLink = (n: any) => {
    if (n.entity_type === 'campaign' && n.entity_id) return `/campaigns/${n.entity_id}`;
    return null;
  };

  if (authLoading) return null;
  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const last24h = notifications.filter(n => Date.now() - new Date(n.created_at).getTime() < 86400000).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return isTypeInFilter(n.type, filter);
  });

  const groups = groupByDate(filtered);

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'Tümü', count: notifications.length },
    { key: 'unread', label: 'Okunmamış', count: unreadCount },
    { key: 'support', label: 'Desteklerim' },
    { key: 'update', label: 'Güncellemeler' },
    { key: 'response', label: 'Kurum Yanıtları' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Bildirimler</h1>
            {last24h > 0 && (
              <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                Son 24 saatte {last24h} yeni gelişme
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              style={{ fontSize: 13, color: '#1F2A44', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 500, opacity: markingAll ? 0.5 : 1 }}
            >
              {markingAll ? 'İşaretleniyor...' : 'Tümünü okundu işaretle'}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 20 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: filter === tab.key ? 'none' : '1px solid #e5e7eb',
                background: filter === tab.key ? '#1F2A44' : '#fff',
                color: filter === tab.key ? '#fff' : '#374151',
                fontSize: 13,
                fontWeight: filter === tab.key ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: filter === tab.key ? 'rgba(255,255,255,0.2)' : (tab.key === 'unread' ? '#fee2e2' : '#f3f4f6'),
                  color: filter === tab.key ? '#fff' : (tab.key === 'unread' ? '#b91c1c' : '#6b7280'),
                  borderRadius: 9999,
                  padding: '1px 6px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
              {filter === 'unread' ? 'Tüm bildirimler okundu.' : 'Bir kampanyayı desteklediğinde burada gözükecek.'}
            </p>
            <Link href="/campaigns"
              style={{ fontSize: 13, fontWeight: 600, padding: '9px 20px', background: '#1F2A44', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
              Kampanyaları keşfet
            </Link>
          </div>
        ) : (
          <div>
            {groups.map(group => (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  {group.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(n => {
                    const cfg = getTypeConfig(n.type);
                    const link = getCampaignLink(n);
                    const isUnread = !n.is_read;
                    return (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        cfg={cfg}
                        link={link}
                        isUnread={isUnread}
                        onRead={() => markAsRead(n.id)}
                        onNavigate={() => { handleNotificationClick(n); if (link) router.push(link); }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({ notification: n, cfg, link, isUnread, onRead, onNavigate }: {
  notification: any;
  cfg: { icon: React.ReactNode; color: string; bg: string };
  link: string | null;
  isUnread: boolean;
  onRead: () => void;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isUnread ? '#f8faff' : '#fff',
        border: `1px solid ${isUnread ? '#c7d7f5' : '#e5e7eb'}`,
        borderRadius: 10,
        padding: '16px 18px',
        transition: 'box-shadow 0.15s, transform 0.15s',
        boxShadow: hovered ? '0 4px 14px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: isUnread ? 700 : 500, color: isUnread ? '#0f172a' : '#374151', lineHeight: 1.4 }}>
              {n.title || n.message}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {isUnread && (
                <span style={{ fontSize: 10, fontWeight: 700, background: '#1F2A44', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>Yeni</span>
              )}
              <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</span>
            </div>
          </div>

          {n.title && n.message && (
            <p style={{ fontSize: 13, color: isUnread ? '#475569' : '#9ca3af', lineHeight: 1.5, marginBottom: 10 }}>
              {n.message}
            </p>
          )}

          {/* Campaign link */}
          {link && n.campaign_title && (
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              Kampanya:{' '}
              <Link href={link} style={{ color: '#1F2A44', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
                onClick={e => { e.stopPropagation(); if (!n.is_read) onRead(); }}>
                {n.campaign_title}
              </Link>
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {link && (
              <button
                onClick={onNavigate}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 14px',
                  background: '#1F2A44', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                Detaya Git
              </button>
            )}
            {isUnread && (
              <button
                onClick={e => { e.stopPropagation(); onRead(); }}
                style={{
                  fontSize: 12, color: '#6b7280', background: 'none',
                  border: '1px solid #e5e7eb', borderRadius: 6,
                  padding: '5px 12px', cursor: 'pointer',
                }}
              >
                Okundu işaretle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
