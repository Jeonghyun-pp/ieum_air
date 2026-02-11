'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortal } from '@/contexts/PortalContext';
import { mockPortalData } from '@/lib/portal/mock';

export default function PlanPage() {
  const { status, setStatus } = usePortal();
  const { plan } = mockPortalData;

  const handleApprove = () => {
    setStatus('APPROVED');
  };

  const handleRequestChanges = () => {
    setStatus('DRAFT');
  };

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">플랜 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 타겟 국가 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              타겟 국가
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.targetCountries.map((country) => (
                <Badge key={country} variant="outline">
                  {country}
                </Badge>
              ))}
            </div>
          </div>

          {/* 플랫폼 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              플랫폼
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.platforms.map((platform) => (
                <Badge key={platform} variant="outline">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* 메시지 포커스 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              메시지 포커스
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.messageFocus.map((focus) => (
                <Badge key={focus} variant="outline">
                  {focus}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Module */}
      {status === 'AWAITING_APPROVAL' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">플랜 승인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              플랜을 검토하신 후 승인하거나 수정을 요청해주세요.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700">
                승인하기
              </Button>
              <Button
                onClick={handleRequestChanges}
                variant="outline"
              >
                수정 요청
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">현재 상태:</span>
            <Badge
              variant={
                status === 'APPROVED'
                  ? 'default'
                  : status === 'AWAITING_APPROVAL'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {status === 'DRAFT' && '초안'}
              {status === 'AWAITING_APPROVAL' && '승인 대기'}
              {status === 'APPROVED' && '승인 완료'}
              {status === 'RUNNING' && '집행 중'}
              {status === 'REPORT_READY' && '리포트 준비'}
              {status === 'ARCHIVED' && '보관됨'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
