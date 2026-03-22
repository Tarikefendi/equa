'use client';

// Bu dosya kampanya detay sayfasının basitleştirilmiş modern versiyonudur
// Orijinal dosya çok uzun olduğu için yeni bir dosya oluşturdum
// Kullanmak için: [id]/page.tsx dosyasını silin ve bu dosyayı page.tsx olarak yeniden adlandırın

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Campaign } from '@/types';
import Header from '@/components/Header';
import ReputationBadge from '@/components/ReputationBadge';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      loadCampaign();
      loadVoteStats();
      loadComments();
      if (user) {
        loadFollowStatus();
      }
      loadFollowerCount();
    }
  }, [params.id, user]);

  const loadCampaign = async () => {
    try {
      const response: any = await api.getCampaignById(params.id as string);
      if (response.success && response.data) {
        setCampaign(response.data);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoteStats = async () => {
    try {
      const response: any = await api.getVoteStats(params.id as string);
      if (response.success && response.data) {
        setVoteStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load vote stats:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response: any = await api.getComments(params.id as string);
      if (response.success && response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadFollowStatus = async () => {
    try {
      const response: any = await api.isFollowingCampaign(params.id as string);
      if (response.success && response.data) {
        setIsFollowing(response.data.isFollowing);
      }
    } catch (error) {
      console.error('Failed to load follow status:', error);
    }
  };

  const loadFollowerCount = async () => {
    try {
      const response: any = await api.getFollowerCount(params.id as string);
      if (response.success && response.data) {
        setFollowerCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to load follower count:', error);
    }
  };

  const handleVote = async (choice: 'support' | 'oppose' | 'neutral') => {
    if (!user) {
      alert('Oy vermek için giriş yapmalısınız');
      return;
    }

    setVoting(true);
    try {
      await api.castVote(params.id as string, choice);
      await loadVoteStats();
      alert('✅ Oyunuz kaydedildi!');
    } catch (error: any) {
      alert(error.message || 'Oy verme başarısız');
    } finally {
      setVoting(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Takip etmek için giriş yapmalısınız');
      return;
    }

    try {
      if (isFollowing) {
        await api.unfollowCampaign(params.id as string);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await api.followCampaign(params.id as string);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await api.createComment(params.id as string, newComment);
      setNewComment('');
      loadComments();
    } catch (error: any) {
      alert(error.message || 'Yorum gönderilemedi');
    } finally {
      setCommentLoading(false);
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = `${campaign?.title} - EQUA`;
    
    const urls: any = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="card animate-pulse-slow">
            <div className="skeleton h-8 w-3/4 mb-4"></div>
            <div className="skeleton h-32 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Kampanya bulunamadı</h2>
          <Link href="/campaigns" className="btn-primary inline-block mt-4">
            ← Kampanyalara Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Campaign Header */}
        <div className="card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="badge badge-primary">{campaign.category}</span>
            <span className={`badge ${
              campaign.status === 'active' ? 'badge-success' :
              campaign.status === 'concluded' ? 'badge-secondary' :
              'badge-warning'
            }`}>
              {campaign.status === 'active' ? '🟢 Aktif' :
               campaign.status === 'concluded' ? '✅ Sonuçlandı' :
               '⏳ İncelemede'}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-text-primary mb-6">
            {campaign.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border-color">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold">
                {campaign.creator_username?.[0]?.toUpperCase()}
              </div>
              <span>{campaign.creator_username}</span>
              {campaign.creator_reputation_points !== undefined && (
                <ReputationBadge 
                  points={campaign.creator_reputation_points}
                  level={campaign.creator_reputation_level}
                  compact={true}
                />
              )}
            </div>
            <span>•</span>
            <span>🎯 {campaign.target_entity}</span>
            <span>•</span>
            <span>📅 {new Date(campaign.created_at).toLocaleDateString('tr-TR')}</span>
            <span>•</span>
            <button
              onClick={handleFollowToggle}
              className={`flex items-center space-x-1 font-medium ${
                isFollowing ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
              }`}
            >
              <span>{isFollowing ? '⭐' : '☆'}</span>
              <span>{followerCount} takipçi</span>
            </button>
          </div>

          {/* Description */}
          <p className="text-text-primary whitespace-pre-wrap leading-relaxed mb-6">
            {campaign.description}
          </p>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => shareOnSocial('twitter')} className="btn-secondary">
              🐦 Twitter
            </button>
            <button onClick={() => shareOnSocial('facebook')} className="btn-secondary">
              📘 Facebook
            </button>
            <button onClick={() => shareOnSocial('whatsapp')} className="btn-secondary">
              💬 WhatsApp
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('✅ Link kopyalandı!');
              }}
              className="btn-secondary"
            >
              🔗 Linki Kopyala
            </button>
          </div>
        </div>

        {/* Vote Section */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Oy Ver</h2>
          
          {voteStats && (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">Toplam Katılım</span>
                  <span className="text-sm font-bold text-text-primary">
                    {voteStats.support + voteStats.oppose + voteStats.neutral} oy
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-accent-secondary"
                      style={{
                        width: `${((voteStats.support / (voteStats.support + voteStats.oppose + voteStats.neutral || 1)) * 100)}%`
                      }}
                    ></div>
                    <div
                      className="bg-accent-danger"
                      style={{
                        width: `${((voteStats.oppose / (voteStats.support + voteStats.oppose + voteStats.neutral || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Vote Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-accent-secondary bg-opacity-10 rounded-xl">
                  <div className="text-3xl font-bold" style={{ color: 'var(--accent-secondary)' }}>
                    {voteStats.support || 0}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">Destekleyen</div>
                </div>
                <div className="text-center p-4 bg-accent-danger bg-opacity-10 rounded-xl">
                  <div className="text-3xl font-bold" style={{ color: 'var(--accent-danger)' }}>
                    {voteStats.oppose || 0}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">Karşı</div>
                </div>
                <div className="text-center p-4 bg-bg-tertiary rounded-xl">
                  <div className="text-3xl font-bold text-text-secondary">
                    {voteStats.neutral || 0}
                  </div>
                  <div className="text-sm text-text-tertiary mt-1">Nötr</div>
                </div>
              </div>
            </>
          )}

          {/* Vote Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleVote('support')}
              disabled={voting}
              className="btn-primary"
            >
              👍 Destekle
            </button>
            <button
              onClick={() => handleVote('oppose')}
              disabled={voting}
              className="btn-outline"
            >
              👎 Karşıyım
            </button>
            <button
              onClick={() => handleVote('neutral')}
              disabled={voting}
              className="btn-secondary"
            >
              🤷 Nötr
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Yorumlar ({comments.length})
          </h2>

          {/* Comment Form */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                className="input-field mb-3"
                rows={3}
                placeholder="Yorumunuzu yazın..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="btn-primary"
              >
                {commentLoading ? '⏳ Gönderiliyor...' : '💬 Yorum Yap'}
              </button>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                Henüz yorum yok. İlk yorumu siz yapın!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-bg-secondary rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold">
                      {comment.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-text-primary">{comment.username}</span>
                    <span className="text-xs text-text-tertiary">
                      {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-text-secondary">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
