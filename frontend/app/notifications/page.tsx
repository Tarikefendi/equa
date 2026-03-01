'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response: any = await api.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      campaign_update: '📢',
      new_comment: '💬',
      new_vote: '👍',
      badge_earned: '🏆',
      milestone_reached: '🎯',
      organization_response: '🏢',
      campaign_approved: '✅',
      campaign_rejected: '❌',
      lawyer_verified: '⚖️',
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          {/* Header */}
          <div className="border-b border-border-color p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-text-primary">
                Bildirimler
                {unreadCount > 0 && (
                  <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-accent-danger rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-accent-primary hover:underline font-medium"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                Tümü ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filter === 'unread'
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                Okunmamış ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-border-color">
            {loading ? (
              <div className="p-12 text-center text-text-secondary">Yükleniyor...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <p className="text-text-secondary">
                  {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-bg-hover transition cursor-pointer ${
                    !notification.is_read ? 'bg-accent-primary bg-opacity-5' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.entity_type === 'campaign' && notification.entity_id) {
                      router.push(`/campaigns/${notification.entity_id}`);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-text-secondary mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {new Date(notification.created_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-accent-primary rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
