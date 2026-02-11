'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuickSummaryCard } from '@/components/portal/QuickSummaryCard';
import { mockPortalData } from '@/lib/portal/mock';
import Link from 'next/link';

export default function PortalHomePage() {
  const { strategySummary, reasons, todos } = mockPortalData;
  const top3Todos = todos.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick Summary */}
      <QuickSummaryCard
        strategySummary={strategySummary}
        reasons={reasons}
      />

      {/* What We Do / What You Do */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">우리가 하는 일</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              관광 수요 분석 및 최적의 홍보 전략 수립
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>타겟 국가별 검색 키워드 최적화</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>플랫폼별 메시지 전략 수립</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>주간 단위 성과 모니터링 및 최적화</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">고객이 해야 할 일</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              플랜 집행을 위해 필요한 자료를 제공해주세요
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>숙소 사진 및 설명 자료 업로드</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>체크인/체크아웃 시간 등 기본 정보 확인</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>특별 프로모션 정보 제공 (선택)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* To-do Top 3 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">To-do Top 3</CardTitle>
          <Link
            href="/portal/assets"
            className="text-sm text-blue-600 hover:underline"
          >
            전체 보기 →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top3Todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start justify-between p-3 border border-border rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {todo.title}
                    </span>
                    {todo.required && (
                      <Badge variant="outline" className="text-xs">
                        필수
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    마감: {todo.due}
                  </p>
                </div>
                <Badge
                  variant={todo.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {todo.status === 'completed' ? '완료' : '대기'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
