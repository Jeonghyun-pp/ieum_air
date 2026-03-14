'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, GripVertical, Calendar, User, Loader2 } from 'lucide-react';
import { useAdminApi, useAdminMutation } from '@/hooks/useAdminApi';

/* ── types ─────────────────────────────────────────────────────── */
type ColumnKey = 'backlog' | 'progress' | 'review' | 'done';

type ContentItem = {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  type: string;          // raw API type: 'instagram' | 'blog' | 'tiktok' | …
  status: string;        // raw API status
  date: string;
  month?: string;
  column: ColumnKey;     // derived locally for kanban
  displayType: string;   // mapped Korean label
};

/* ── API → column mapping ──────────────────────────────────────── */
const apiStatusToColumn: Record<string, ColumnKey> = {
  backlog: 'backlog',
  in_progress: 'progress',
  review: 'review',
  completed: 'done',
};

const columnToApiStatus: Record<ColumnKey, string> = {
  backlog: 'backlog',
  progress: 'in_progress',
  review: 'review',
  done: 'completed',
};

/* ── content type → display label ──────────────────────────────── */
const typeDisplayMap: Record<string, string> = {
  instagram: '인스타 릴스',
  blog: '블로그',
  tiktok: 'TikTok',
};

function mapTypeLabel(raw: string): string {
  return typeDisplayMap[raw] ?? raw;
}

/* ── constants ─────────────────────────────────────────────────── */
const columns = [
  { key: 'backlog' as const, label: '대기', color: 'bg-gray-500' },
  { key: 'progress' as const, label: '제작중', color: 'bg-blue-500' },
  { key: 'review' as const, label: '검토', color: 'bg-orange-500' },
  { key: 'done' as const, label: '완료', color: 'bg-emerald-500' },
];

const typeColors: Record<string, string> = {
  '인스타 릴스': 'bg-pink-500/10 text-pink-400',
  '블로그': 'bg-green-500/10 text-green-400',
  'TikTok': 'bg-cyan-500/10 text-cyan-400',
  '번역': 'bg-amber-500/10 text-amber-400',
};

/* ── helper: normalise API response into flat ContentItem[] ───── */
function normaliseApiData(
  apiData: Record<string, any[]>
): ContentItem[] {
  const result: ContentItem[] = [];

  for (const [apiStatus, items] of Object.entries(apiData)) {
    const column = apiStatusToColumn[apiStatus];
    if (!column || !Array.isArray(items)) continue;

    for (const raw of items) {
      const displayType = mapTypeLabel(raw.type);
      result.push({
        id: raw.id,
        propertyId: raw.propertyId,
        propertyName: raw.propertyName,
        title: raw.title,
        type: raw.type,
        status: raw.status,
        date: raw.date ?? '',
        month: raw.month,
        column,
        displayType,
      });
    }
  }

  return result;
}

/* ── component ─────────────────────────────────────────────────── */
export default function AdminContentPage() {
  /* ---- data fetching ---- */
  const { data: apiData, isLoading, error, refetch } = useAdminApi<any>({ endpoint: 'content' });
  const { mutate } = useAdminMutation();

  /* ---- local optimistic state ---- */
  const [items, setItems] = useState<ContentItem[]>([]);
  const [dragItem, setDragItem] = useState<string | null>(null);

  // Sync local state when API data arrives / refreshes
  useEffect(() => {
    if (apiData) {
      setItems(normaliseApiData(apiData));
    }
  }, [apiData]);

  /* ---- drag-drop handler (optimistic + API) ---- */
  const moveItem = useCallback(
    async (itemId: string, toColumn: ColumnKey) => {
      const item = items.find((i) => i.id === itemId);
      if (!item || item.column === toColumn) return;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, column: toColumn } : i))
      );

      // Persist via API
      const newStatus = columnToApiStatus[toColumn];
      await mutate(`properties/${item.propertyId}/content/${item.id}`, 'PATCH', {
        status: newStatus,
      });

      // Refetch to ensure consistency
      refetch();
    },
    [items, mutate, refetch]
  );

  /* ---- loading state ---- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ---- error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-red-400 text-sm">데이터를 불러오지 못했습니다.</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-foreground/70 hover:text-foreground underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">콘텐츠 관리</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gradient text-white text-sm font-medium">
          <Plus className="w-4 h-4" />
          콘텐츠 추가
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.column === col.key);
          return (
            <div
              key={col.key}
              className="rounded-2xl bg-dark-elevated p-4 min-h-[400px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragItem) {
                  moveItem(dragItem, col.key);
                  setDragItem(null);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{colItems.length}</span>
              </div>
              <div className="space-y-2">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragItem(item.id)}
                    className="p-3 rounded-xl bg-dark-highlight hover:bg-dark-highlight/80 cursor-grab active:cursor-grabbing transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium mb-1.5">{item.title}</div>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${typeColors[item.displayType] ?? 'bg-foreground/10 text-foreground/60'}`}>
                          {item.displayType}
                        </span>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.propertyName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
