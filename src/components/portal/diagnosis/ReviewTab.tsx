'use client';

import type { ReviewDiagnosis } from '@/types/diagnosis';

interface ReviewTabProps {
  diagnosis: ReviewDiagnosis | null;
}

const SENTIMENT_CONFIG = {
  positive: { label: '긍정적', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  neutral: { label: '보통', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  negative: { label: '부정적', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export function ReviewTab({ diagnosis }: ReviewTabProps) {
  if (!diagnosis) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>리뷰 분석 데이터가 없습니다.</p>
        <p className="text-sm mt-1">비교군 구성 후 자동으로 분석됩니다.</p>
      </div>
    );
  }

  const sentimentConfig = SENTIMENT_CONFIG[diagnosis.sentiment];

  return (
    <div className="space-y-6">
      {/* 감성 요약 */}
      <div className="flex items-center gap-4">
        <div className={`px-4 py-2 rounded-xl ${sentimentConfig.bg}`}>
          <span className={`text-lg font-bold ${sentimentConfig.color}`}>
            {sentimentConfig.label}
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{diagnosis.score}점</div>
          <div className="text-sm text-muted-foreground">{diagnosis.reviewCount}개 리뷰 분석</div>
        </div>
      </div>

      {/* 토픽 */}
      {diagnosis.topics.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">주요 토픽</h4>
          <div className="flex flex-wrap gap-2">
            {diagnosis.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 text-xs rounded-full bg-dark-highlight text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 칭찬 */}
      {diagnosis.topPraises.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-500 mb-2">자주 칭찬받는 점</h4>
          <ul className="space-y-2">
            {diagnosis.topPraises.map((praise, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-emerald-500 shrink-0">+</span>
                {praise}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 불만 */}
      {diagnosis.topComplaints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-500 mb-2">개선 필요 사항</h4>
          <ul className="space-y-2">
            {diagnosis.topComplaints.map((complaint, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-red-500 shrink-0">-</span>
                {complaint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
