'use client';

import type { PhotoDiagnosis } from '@/types/diagnosis';

interface PhotoTabProps {
  diagnosis: PhotoDiagnosis | null;
}

const SPACE_LABELS: Record<string, string> = {
  bedroom: '침실',
  bathroom: '욕실',
  kitchen: '주방',
  living: '거실',
  exterior: '외관',
  view: '전망/뷰',
  amenity: '편의시설',
  neighborhood: '주변환경',
};

export function PhotoTab({ diagnosis }: PhotoTabProps) {
  if (!diagnosis) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>사진 분석 데이터가 없습니다.</p>
        <p className="text-sm mt-1">비교군 구성 후 자동으로 분석됩니다.</p>
      </div>
    );
  }

  const diff = diagnosis.compSetMedianPhotos - diagnosis.photoCount;

  return (
    <div className="space-y-6">
      {/* 사진 수량 비교 */}
      <div className="p-4 rounded-xl bg-dark-elevated">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-3xl font-bold text-foreground">{diagnosis.photoCount}장</div>
            <div className="text-sm text-muted-foreground">내 사진</div>
          </div>
          <div className="text-muted-foreground">vs</div>
          <div>
            <div className="text-3xl font-bold text-muted-foreground">{diagnosis.compSetMedianPhotos}장</div>
            <div className="text-sm text-muted-foreground">비교군 중앙값</div>
          </div>
        </div>
        {diff > 0 && (
          <div className="mt-3 text-sm text-orange-500">
            {diff}장 추가를 권장합니다
          </div>
        )}
      </div>

      {/* 품질 이슈 */}
      {(diagnosis.resolutionIssues.length > 0 || diagnosis.brightnessIssues.length > 0) && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">품질 개선 필요</h4>
          <div className="space-y-2">
            {diagnosis.resolutionIssues.map((issue, i) => (
              <div key={`res-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-dark-elevated">
                <span className="text-orange-500 text-xs px-2 py-0.5 rounded bg-orange-500/10">
                  저해상도
                </span>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {Math.round(Math.sqrt(issue.value))}px 미만
                </span>
              </div>
            ))}
            {diagnosis.brightnessIssues.map((issue, i) => (
              <div key={`brt-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-dark-elevated">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  issue.issue === 'too_dark' ? 'text-blue-500 bg-blue-500/10' : 'text-yellow-500 bg-yellow-500/10'
                }`}>
                  {issue.issue === 'too_dark' ? '너무 어두움' : '너무 밝음'}
                </span>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  밝기 {issue.value} (권장 {MIN_BRIGHTNESS}~{MAX_BRIGHTNESS})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추천 촬영 공간 */}
      {diagnosis.missingSpaces.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">추천 촬영 공간</h4>
          <div className="space-y-2">
            {diagnosis.missingSpaces.map((space) => (
              <div key={space} className="flex items-center gap-3 p-3 rounded-lg bg-dark-elevated">
                <span className="text-purple-500">+</span>
                <span className="text-sm text-foreground">
                  {SPACE_LABELS[space] ?? space}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  상위 성과자 대부분 포함
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 현재 커버 공간 */}
      {diagnosis.spacesCovered.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">촬영된 공간</h4>
          <div className="flex flex-wrap gap-2">
            {diagnosis.spacesCovered.map((space) => (
              <span
                key={space}
                className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500"
              >
                {SPACE_LABELS[space] ?? space}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MIN_BRIGHTNESS = 40;
const MAX_BRIGHTNESS = 220;
