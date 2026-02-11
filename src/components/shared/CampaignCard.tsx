'use client';

import { useRouter } from 'next/navigation';
import { memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Campaign } from '@/contexts';
import { Badge } from '@/components/ui/badge';

// ============================================
// Types
// ============================================

interface CampaignCardProps {
  campaign: Campaign;
  variant?: 'default' | 'compact';
  showStatus?: boolean;
  showAdvertiser?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================
// Design Tokens
// ============================================

// 상태 배지 설정
const statusConfig: Record<string, { label: string; className: string }> = {
  'OPEN': { label: '모집중', className: 'bg-green-500 text-white' },
  'IN_PROGRESS': { label: '진행중', className: 'bg-blue-500 text-white' },
  'RUNNING': { label: '진행중', className: 'bg-blue-500 text-white' },
  'COMPLETED': { label: '완료', className: 'bg-gray-400 text-white' },
  'CANCELLED': { label: '취소됨', className: 'bg-red-400 text-white' },
};

// 카테고리별 placeholder 색상
const categoryPlaceholders: Record<string, string> = {
  '카페': 'bg-amber-100',
  '음식점': 'bg-orange-100',
  '바/주점': 'bg-purple-100',
  '뷰티/미용': 'bg-pink-100',
  '패션/의류': 'bg-rose-100',
  '스포츠/피트니스': 'bg-green-100',
  '페스티벌/행사': 'bg-violet-100',
  '서포터즈': 'bg-blue-100',
  '리뷰/체험단': 'bg-teal-100',
  '기타': 'bg-gray-100',
};

// 채널 아이콘
const ChannelIcon = ({ channel }: { channel: string }) => {
  const channelLower = channel?.toLowerCase() || '';

  if (channelLower.includes('instagram')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    );
  }

  if (channelLower.includes('youtube')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  if (channelLower.includes('tiktok')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
};

// ============================================
// CampaignCard Component
// ============================================

export const CampaignCard = memo(function CampaignCard({
  campaign,
  variant = 'default',
  showStatus = true,
  showAdvertiser = false,
  onClick,
  className = '',
}: CampaignCardProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/campaigns/${campaign.id}`);
    }
  }, [onClick, router, campaign.id]);

  const status = useMemo(() => statusConfig[campaign.status] || statusConfig['OPEN'], [campaign.status]);
  const placeholderColor = useMemo(() => categoryPlaceholders[campaign.category] || categoryPlaceholders['기타'], [campaign.category]);

  // 마감일 포맷팅
  const formatDeadline = useCallback((deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '마감됨';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays <= 7) return `D-${diffDays}`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  // ============================================
  // Compact Variant (리스트용 - Notion 스타일)
  // ============================================
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={`
          cursor-pointer
          flex items-center gap-4 flex-1
          ${className}
        `}
      >
        {/* 썸네일 */}
        <div className="w-16 h-16 overflow-hidden flex-shrink-0 relative">
          {campaign.imageUrl ? (
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-lg text-muted-foreground">📷</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showStatus && (
              <Badge className={`${status.className} text-xs`}>
                {status.label}
              </Badge>
            )}
            <h3 className="text-base font-medium text-foreground truncate">{campaign.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {campaign.description || '캠페인 상세 내용을 확인해보세요.'}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ChannelIcon channel={campaign.channel} />
              <span>{campaign.channel}</span>
            </div>
            <span>•</span>
            <span>{formatDeadline(campaign.deadline)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Default Variant (그리드 카드)
  // ============================================
  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-lg border border-gray-200
        overflow-hidden cursor-pointer
        hover:shadow-lg hover:border-gray-300
        transition-all duration-200
        flex flex-col h-full
        ${className}
      `}
    >
      {/* 썸네일 이미지 */}
      <div className="relative w-full h-48 overflow-hidden">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div className={`w-full h-full ${placeholderColor} flex items-center justify-center`}>
            <span className="text-4xl text-gray-300">📷</span>
          </div>
        )}

        {/* 상태 배지 (좌상단) */}
        {showStatus && (
          <div className="absolute top-3 left-3">
            <Badge className={status.className}>
              {status.label}
            </Badge>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 p-4 flex flex-col">
        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {campaign.title}
        </h3>

        {/* 한 줄 요약 (1-2줄) */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
          {campaign.description || '캠페인 상세 내용을 확인해보세요.'}
        </p>

        {/* 메타 정보 (한 줄) - 예산 OR 채널 중 하나만 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ChannelIcon channel={campaign.channel} />
            <span>{campaign.channel}</span>
          </div>

          {/* 일정 정보 */}
          <span className="text-sm text-gray-500">
            {formatDeadline(campaign.deadline)}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Status Badge (Standalone)
// ============================================

export function CampaignStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig['OPEN'];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
