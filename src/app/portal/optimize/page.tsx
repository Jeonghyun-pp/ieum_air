'use client';

import { useEffect, useState } from 'react';
import { usePortal } from '@/contexts/PortalContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { HealthScoreGauge } from '@/components/portal/HealthScoreGauge';
import { DiagnosisCategoryBars } from '@/components/portal/DiagnosisCategoryBars';
import { ReviewTab } from '@/components/portal/diagnosis/ReviewTab';
import { PhotoTab } from '@/components/portal/diagnosis/PhotoTab';
import { ContentTab } from '@/components/portal/diagnosis/ContentTab';
import type { DiagnosisResult } from '@/types/diagnosis';

type TabKey = 'overview' | 'reviews' | 'photos' | 'content';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '종합' },
  { key: 'reviews', label: '리뷰' },
  { key: 'photos', label: '사진' },
  { key: 'content', label: '콘텐츠' },
];

export default function OptimizePage() {
  const { isLoading, activeProperty } = usePortal();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchDiagnosis() {
      try {
        const res = await fetch('/api/portal/diagnosis');
        const json = await res.json();
        if (json.success && json.data) {
          setDiagnosis(json.data as DiagnosisResult);
        }
      } catch {
        // ignore
      } finally {
        setFetchLoading(false);
      }
    }
    if (!isLoading && activeProperty) {
      fetchDiagnosis();
    } else if (!isLoading) {
      setFetchLoading(false);
    }
  }, [isLoading, activeProperty]);

  if (isLoading || fetchLoading) {
    return <PortalSkeleton />;
  }

  if (!diagnosis) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">최적화</h1>
        <div className="text-center py-16 rounded-2xl bg-dark-elevated">
          <p className="text-[#B3B3B3] text-lg">진단 데이터가 아직 없습니다</p>
          <p className="text-[#6A6A6A] text-sm mt-2">
            비교군 구성이 완료되면 자동으로 리스팅 진단이 실행됩니다.
          </p>
        </div>
      </div>
    );
  }

  const { enhancedScorecard, reviewDiagnosis, photoDiagnosis, contentDiagnosis } = diagnosis;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">최적화</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-dark-elevated">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-accent-purple text-white'
                : 'text-[#6A6A6A] hover:text-[#B3B3B3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-dark-elevated p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <HealthScoreGauge
                score={enhancedScorecard.overallScore}
                grade={enhancedScorecard.overallGrade}
                size="lg"
                label="종합 경쟁력"
              />
              <div className="flex-1 text-sm text-[#B3B3B3]">
                <p>
                  {enhancedScorecard.totalInCompSet}개 경쟁 숙소 중{' '}
                  <span className="text-white font-semibold">{enhancedScorecard.rank}위</span>
                </p>
              </div>
            </div>
            <DiagnosisCategoryBars categories={enhancedScorecard.categories} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewTab diagnosis={reviewDiagnosis} />
        )}

        {activeTab === 'photos' && (
          <PhotoTab diagnosis={photoDiagnosis} />
        )}

        {activeTab === 'content' && (
          <ContentTab diagnosis={contentDiagnosis} />
        )}
      </div>
    </div>
  );
}
