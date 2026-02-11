'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StatusBannerConfig } from '@/lib/portal/types';

interface StatusBannerProps {
  config: StatusBannerConfig;
}

export function StatusBanner({ config }: StatusBannerProps) {
  return (
    <Card className="border-l-4 border-l-blue-600 bg-blue-50/30">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground">{config.desc}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button asChild variant="default" size="sm">
              <Link href={config.primaryCta.href}>
                {config.primaryCta.label}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={config.secondaryCta.href}>
                {config.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
