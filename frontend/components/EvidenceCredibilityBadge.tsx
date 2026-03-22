import React from 'react';

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  official_document:   { label: 'Resmi Belge',        color: '#166534', bg: '#dcfce7' },
  government_record:   { label: 'Devlet Kaydı',       color: '#1e40af', bg: '#dbeafe' },
  news_source:         { label: 'Haber Kaynağı',      color: '#1d4ed8', bg: '#eff6ff' },
  company_statement:   { label: 'Şirket Açıklaması',  color: '#92400e', bg: '#fef3c7' },
  academic_source:     { label: 'Akademik Kaynak',    color: '#5b21b6', bg: '#ede9fe' },
  user_submission:     { label: 'Kullanıcı Gönderisi',color: '#374151', bg: '#f3f4f6' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  approved: { label: 'Doğrulandı',       icon: '✓', color: '#166534' },
  pending:  { label: 'İnceleniyor',      icon: '⏳', color: '#92400e' },
  flagged:  { label: 'İşaretlendi',      icon: '⚠', color: '#b91c1c' },
  rejected: { label: 'Reddedildi',       icon: '✗', color: '#6b7280' },
};

interface Props {
  credibilityType?: string;
  status?: string;
  verificationSource?: string;
}

export default function EvidenceCredibilityBadge({ credibilityType = 'user_submission', status = 'pending', verificationSource }: Props) {
  const badge = BADGE_CONFIG[credibilityType] || BADGE_CONFIG.user_submission;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
        color: badge.color, backgroundColor: badge.bg,
      }}>
        {badge.label}
      </span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        fontSize: '11px', fontWeight: 500, color: statusCfg.color,
      }}>
        {statusCfg.icon} {statusCfg.label}
      </span>
      {verificationSource === 'campaign_owner' && status === 'approved' && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: '10px', color: '#6b7280', fontStyle: 'italic',
        }}>
          · kampanya sahibi
        </span>
      )}
    </div>
  );
}
