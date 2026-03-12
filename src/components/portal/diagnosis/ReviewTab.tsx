'use client';

import type { ReviewDiagnosis } from '@/types/diagnosis';

interface ReviewTabProps {
  diagnosis: ReviewDiagnosis | null;
}

const SENTIMENT_CONFIG = {
  positive: { label: '긍정적', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  neutral: { label: '보통', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  negative: { label: '부정적', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export function ReviewTab({ diagnosis }: ReviewTabProps) {
  if (!diagnosis) {
    return (
      <div className="text-center py-12 text-[#6A6A6A]">
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
          <div className="text-2xl font-bold text-white">{diagnosis.score}점</div>
          <div className="text-sm text-[#6A6A6A]">{diagnosis.reviewCount}개 리뷰 분석</div>
        </div>
      </div>

      {/* 토픽 */}
      {diagnosis.topics.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#B3B3B3] mb-2">주요 토픽</h4>
          <div className="flex flex-wrap gap-2">
            {diagnosis.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 text-xs rounded-full bg-dark-highlight text-[#B3B3B3]"
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
          <h4 className="text-sm font-semibold text-emerald-400 mb-2">자주 칭찬받는 점</h4>
          <ul className="space-y-2">
            {diagnosis.topPraises.map((praise, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#B3B3B3]">
                <span className="text-emerald-400 shrink-0">+</span>
                {praise}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 불만 */}
      {diagnosis.topComplaints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2">개선 필요 사항</h4>
          <ul className="space-y-2">
            {diagnosis.topComplaints.map((complaint, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#B3B3B3]">
                <span className="text-red-400 shrink-0">-</span>
                {complaint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
