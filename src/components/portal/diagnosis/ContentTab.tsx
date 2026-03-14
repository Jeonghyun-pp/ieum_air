'use client';

import type { ContentDiagnosis } from '@/types/diagnosis';

interface ContentTabProps {
  diagnosis: ContentDiagnosis | null;
}

const TOPIC_LABELS: Record<string, string> = {
  location: '위치',
  amenities: '편의시설',
  transport: '교통',
  attractions: '관광/맛집',
  checkin: '체크인',
  rules: '이용규칙',
  neighborhood: '동네/환경',
};

export function ContentTab({ diagnosis }: ContentTabProps) {
  if (!diagnosis) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>콘텐츠 분석 데이터가 없습니다.</p>
        <p className="text-sm mt-1">비교군 구성 후 자동으로 분석됩니다.</p>
      </div>
    );
  }

  const { title, description } = diagnosis;

  return (
    <div className="space-y-6">
      {/* 제목 분석 */}
      <div className="p-4 rounded-xl bg-dark-elevated space-y-3">
        <h4 className="text-sm font-semibold text-foreground">제목 분석</h4>
        <div className="text-sm text-muted-foreground">
          현재: <span className="text-foreground">&ldquo;{title.current}&rdquo;</span>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">길이: </span>
            <span className={title.length >= title.optimalRange[0] && title.length <= title.optimalRange[1]
              ? 'text-emerald-500' : 'text-orange-500'}>
              {title.length}자
            </span>
          </div>
          <div className="text-muted-foreground">
            적정: {title.optimalRange[0]}~{title.optimalRange[1]}자
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">점수:</span>
          <div className="flex-1 h-2 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${title.score}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground">{title.score}</span>
        </div>

        {/* 누락 키워드 */}
        {title.missingKeywords.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">추가 추천 키워드:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {title.missingKeywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-500">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 설명 분석 */}
      <div className="p-4 rounded-xl bg-dark-elevated space-y-3">
        <h4 className="text-sm font-semibold text-foreground">설명 분석</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">점수:</span>
          <div className="flex-1 h-2 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${description.score}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground">{description.score}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          설명 길이: {description.length}자
        </div>

        {/* 토픽 커버리지 */}
        <div>
          <span className="text-xs text-muted-foreground">토픽 커버리지:</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(TOPIC_LABELS).map(([key, label]) => {
              const covered = description.topicsCovered.includes(key);
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className={covered ? 'text-emerald-500' : 'text-red-500'}>
                    {covered ? '✓' : '✗'}
                  </span>
                  <span className={covered ? 'text-muted-foreground' : 'text-muted-foreground'}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
