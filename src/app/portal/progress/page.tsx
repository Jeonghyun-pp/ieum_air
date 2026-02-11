'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockPortalData } from '@/lib/portal/mock';

export default function ProgressPage() {
  const { progress } = mockPortalData;

  const getStatusVariant = (
    status: 'active' | 'paused' | 'completed'
  ): 'default' | 'secondary' | 'outline' => {
    if (status === 'active') return 'default';
    if (status === 'paused') return 'secondary';
    return 'outline';
  };

  const getStatusLabel = (status: 'active' | 'paused' | 'completed') => {
    if (status === 'active') return '진행 중';
    if (status === 'paused') return '일시 정지';
    return '완료';
  };

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">타임라인</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                {progress.timelineStep}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress.weeklySummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Status */}
      <div className="grid md:grid-cols-3 gap-4">
        {progress.channelStatus.map((channel, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{channel.channel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant={getStatusVariant(channel.status)}>
                {getStatusLabel(channel.status)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {channel.performance}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">주간 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {progress.weeklySummary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
