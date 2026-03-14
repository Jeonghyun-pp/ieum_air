'use client';

import type { DiagnosisCategory } from '@/types/diagnosis';

interface DiagnosisCategoryBarsProps {
  categories: DiagnosisCategory[];
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  F: 'bg-red-500',
};

const GRADE_TEXT_COLORS: Record<string, string> = {
  A: 'text-emerald-500',
  B: 'text-blue-500',
  C: 'text-yellow-500',
  D: 'text-orange-500',
  F: 'text-red-500',
};

export function DiagnosisCategoryBars({ categories }: DiagnosisCategoryBarsProps) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20 shrink-0">{cat.label}</span>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full ${GRADE_COLORS[cat.grade] ?? 'bg-gray-500'} transition-all duration-700 ease-out`}
              style={{ width: `${cat.score}%` }}
            />
          </div>
          <span className={`text-sm font-semibold w-8 text-right ${GRADE_TEXT_COLORS[cat.grade] ?? 'text-gray-400'}`}>
            {cat.score}
          </span>
        </div>
      ))}
    </div>
  );
}
