'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import {
  SECTION_MONTHLY_TITLE,
  SECTION_MONTHLY_SUBTITLE,
  MONTHLY_STAT_LABEL_1,
  MONTHLY_STAT_LABEL_2,
  MONTHLY_STAT_LABEL_3,
  MONTHLY_STAT_VALUE_1,
  MONTHLY_STAT_VALUE_2,
  MONTHLY_STAT_VALUE_3,
} from './placeholders';

export function MonthlyChange() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_MONTHLY_TITLE}
          subtitle={SECTION_MONTHLY_SUBTITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-6">
          <Reveal delay={0.1}>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-50 border border-blue-200/50 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
                {MONTHLY_STAT_VALUE_1}
              </div>
              <div className="text-sm font-semibold text-blue-600/80 uppercase tracking-wider">
                {MONTHLY_STAT_LABEL_1}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-50 border border-purple-200/50 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">
                {MONTHLY_STAT_VALUE_2}
              </div>
              <div className="text-sm font-semibold text-purple-600/80 uppercase tracking-wider">
                {MONTHLY_STAT_LABEL_2}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-green-50 via-green-100/50 to-green-50 border border-green-200/50 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
                {MONTHLY_STAT_VALUE_3}
              </div>
              <div className="text-sm font-semibold text-green-600/80 uppercase tracking-wider">
                {MONTHLY_STAT_LABEL_3}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
