'use client';

import { useState } from 'react';
import { Download, Eye, MessageCircle } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';

type ContentType = 'all' | 'instagram' | 'tiktok' | 'blog';
type ContentStatus = 'completed' | 'in_progress' | 'review';

interface ContentItem {
  id: string;
  title: string;
  type: 'instagram' | 'tiktok' | 'blog';
  status: ContentStatus;
  date: string;
  thumbnail: string;
}

interface ContentData {
  content: ContentItem[];
}

const tabs: { label: string; value: ContentType }[] = [
  { label: '전체', value: 'all' },
  { label: '인스타그램', value: 'instagram' },
  { label: 'TikTok', value: 'tiktok' },
  { label: '블로그', value: 'blog' },
];

const statusConfig: Record<ContentStatus, { label: string; color: string; bg: string }> = {
  completed: { label: '완료', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  in_progress: { label: '제작중', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  review: { label: '검토요청', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const typeLabel: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  blog: '블로그',
};

export default function ContentPage() {
  const { activeProperty, currentMonth } = usePortal();
  const { data, isLoading } = usePortalData<ContentData>({
    endpoint: 'content',
    propertyId: activeProperty?.id,
    month: currentMonth,
  });

  const [activeTab, setActiveTab] = useState<ContentType>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const contentItems = data?.content || [];
  const filtered = activeTab === 'all' ? contentItems : contentItems.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">콘텐츠</h1>
        <p className="text-[#B3B3B3]">이번 달 제작된 콘텐츠를 확인하세요</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.value
                ? 'bg-white text-black'
                : 'bg-dark-highlight text-[#B3B3B3] hover:text-white hover:bg-dark-highlight/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const status = statusConfig[item.status];
          return (
            <button
              key={item.id}
              onClick={() => setSelectedContent(item)}
              className="group p-4 rounded-xl bg-dark-elevated hover:bg-dark-highlight transition-all duration-200 text-left"
            >
              <div className="aspect-square rounded-lg bg-dark-highlight flex items-center justify-center text-4xl mb-4">
                {item.thumbnail}
              </div>
              <div className="text-sm font-semibold mb-1 truncate">{item.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6A6A6A]">{typeLabel[item.type]}</span>
                <span className="text-[#6A6A6A]">·</span>
                <span className={`text-xs ${status.color}`}>{status.label}</span>
              </div>
              <div className="text-xs text-[#6A6A6A] mt-1">{item.date}</div>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedContent(null)}
        >
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl bg-dark-elevated border border-dark-highlight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video rounded-xl bg-dark-highlight flex items-center justify-center text-6xl mb-6">
              {selectedContent.thumbnail}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedContent.title}</h3>
                <div className="flex items-center gap-2 text-sm text-[#6A6A6A]">
                  <span>{typeLabel[selectedContent.type]}</span>
                  <span>·</span>
                  <span>{selectedContent.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedContent.status].bg} ${statusConfig[selectedContent.status].color}`}>
                  {statusConfig[selectedContent.status].label}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-accent-gradient text-white text-sm font-medium">
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
                <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-dark-highlight text-sm text-[#B3B3B3] hover:text-white transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-dark-highlight text-sm text-[#B3B3B3] hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
