'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QuickSummaryCardProps {
  strategySummary: string;
  reasons: string[];
}

export function QuickSummaryCard({
  strategySummary,
  reasons,
}: QuickSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">이번 달 전략 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">
          {strategySummary}
        </p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            근거
          </p>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm text-muted-foreground flex-1">
                  {reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
