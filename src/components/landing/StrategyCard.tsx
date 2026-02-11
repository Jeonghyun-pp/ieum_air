'use client';

import { Reveal } from './Reveal';

interface StrategyCardProps {
  title: string;
  description?: string;
  delay?: number;
}

export function StrategyCard({
  title,
  description,
  delay = 0,
}: StrategyCardProps) {
  return (
    <Reveal delay={delay}>
      <div className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </Reveal>
  );
}
