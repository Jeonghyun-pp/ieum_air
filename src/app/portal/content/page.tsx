'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, MessageCircle, Sparkles, Copy, Check } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import type { ContentSuggestions } from '@/types/strategy';

type ContentType = 'all' | 'instagram' | 'tiktok' | 'blog';
type ContentStatus = 'completed' | 'in_progress' | 'review';
type ViewTab = 'content' | 'suggestions';

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
  const [viewTab, setViewTab] = useState<ViewTab>('content');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [suggestions, setSuggestions] = useState<ContentSuggestions | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Phase 3 콘텐츠 제안 fetch
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const params = new URLSearchParams({ month: currentMonth });
        const res = await fetch(`/api/portal/content-suggestions?${params}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSuggestions(json.data as ContentSuggestions);
        }
      } catch {
        // ignore
      }
    }
    if (activeProperty) fetchSuggestions();
  }, [activeProperty, currentMonth]);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const contentItems = data?.content || [];
  const filtered = activeTab === 'all' ? contentItems : contentItems.filter((c) => c.type === activeTab);

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">콘텐츠</h1>
        <p className="text-[#B3B3B3]">이번 달 제작된 콘텐츠를 확인하세요</p>
      </div>

      {/* View toggle: 콘텐츠 / AI 제안 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewTab('content')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            viewTab === 'content'
              ? 'bg-white text-black'
              : 'bg-dark-highlight text-[#B3B3B3] hover:text-white'
          }`}
        >
          콘텐츠
        </button>
        <button
          onClick={() => setViewTab('suggestions')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
            viewTab === 'suggestions'
              ? 'bg-white text-black'
              : 'bg-dark-highlight text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI 개선 제안
          {suggestions && suggestions.titleSuggestions.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center">
              {suggestions.titleSuggestions.length}
            </span>
          )}
        </button>
      </div>

      {viewTab === 'content' ? (
        <>
          {/* Content type tabs */}
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.value
                    ? 'bg-dark-highlight text-white'
                    : 'text-[#6A6A6A] hover:text-[#B3B3B3]'
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
        </>
      ) : (
        /* AI 제안 탭 */
        <div className="space-y-6">
          {!suggestions || (suggestions.titleSuggestions.length === 0 && suggestions.descriptionImprovements.length === 0) ? (
            <div className="text-center py-16 rounded-2xl bg-dark-elevated">
              <Sparkles className="w-8 h-8 text-[#6A6A6A] mx-auto mb-3" />
              <p className="text-[#B3B3B3]">AI 개선 제안이 아직 없습니다</p>
              <p className="text-sm text-[#6A6A6A] mt-1">진단이 완료되면 자동으로 제안이 생성됩니다.</p>
            </div>
          ) : (
            <>
              {/* Title suggestions */}
              {suggestions.titleSuggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">제목 대안</h3>
                  <div className="space-y-3">
                    {suggestions.titleSuggestions.map((s, i) => (
                      <div key={i} className="p-4 rounded-xl bg-dark-elevated">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white mb-1">&ldquo;{s.suggested}&rdquo;</div>
                            <p className="text-xs text-[#B3B3B3]">{s.reason}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-purple-400 font-bold">{s.score}점</span>
                            <button
                              onClick={() => handleCopy(s.suggested, i)}
                              className="p-1.5 rounded-lg bg-dark-highlight hover:bg-dark-surface transition-colors"
                            >
                              {copiedIdx === i
                                ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                : <Copy className="w-3.5 h-3.5 text-[#6A6A6A]" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description improvements */}
              {suggestions.descriptionImprovements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">설명 보강 제안</h3>
                  <div className="space-y-3">
                    {suggestions.descriptionImprovements.map((d, i) => (
                      <div key={i} className="p-4 rounded-xl bg-dark-elevated">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            d.currentCoverage
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {d.currentCoverage ? '포함됨' : '누락'}
                          </span>
                          <span className="text-sm font-medium">{d.topic}</span>
                        </div>
                        <p className="text-xs text-[#6A6A6A] mb-2">{d.reason}</p>
                        {d.suggestedText && (
                          <div className="p-3 rounded-lg bg-dark-highlight">
                            <p className="text-sm text-[#B3B3B3] leading-relaxed">{d.suggestedText}</p>
                            <button
                              onClick={() => handleCopy(d.suggestedText, 100 + i)}
                              className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              {copiedIdx === 100 + i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              복사
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

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
