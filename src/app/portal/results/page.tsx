'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortal } from '@/contexts/PortalContext';
import { mockPortalData } from '@/lib/portal/mock';

export default function ResultsPage() {
  const { status } = usePortal();
  const { results } = mockPortalData;

  // REPORT_READY 또는 ARCHIVED일 때만 접근 가능
  const isAccessible = status === 'REPORT_READY' || status === 'ARCHIVED';

  if (!isAccessible) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 space-y-4">
            <p className="text-base font-medium text-foreground">
              리포트가 아직 준비되지 않았습니다
            </p>
            <p className="text-sm text-muted-foreground">
              집행이 완료되고 리포트가 준비되면 확인할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">핵심 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {results.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm text-foreground flex-1">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        {results.metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold text-foreground">
                {metric.value}
              </p>
              <Badge variant="outline" className="text-xs">
                {metric.delta}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download 섹션 */}
      <Card id="download">
        <CardHeader>
          <CardTitle className="text-base">리포트 다운로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            상세 리포트를 PDF로 다운로드할 수 있습니다.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            리포트 다운로드 (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
