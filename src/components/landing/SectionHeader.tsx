'use client';

import { Reveal } from './Reveal';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <Reveal>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}
