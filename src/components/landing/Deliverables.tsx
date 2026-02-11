'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import {
  SECTION_DELIVERABLES_TITLE,
  SECTION_DELIVERABLES_SUBTITLE,
  DELIVERABLE_TITLE_1,
  DELIVERABLE_TITLE_2,
  DELIVERABLE_TITLE_3,
  DELIVERABLE_TITLE_4,
  DELIVERABLE_DESC_1,
  DELIVERABLE_DESC_2,
  DELIVERABLE_DESC_3,
  DELIVERABLE_DESC_4,
} from './placeholders';

export function Deliverables() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-purple-50/20">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_DELIVERABLES_TITLE}
          subtitle={SECTION_DELIVERABLES_SUBTITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <Reveal delay={0.1}>
            <div className="p-6 rounded-2xl bg-white border border-blue-200/50 shadow-md shadow-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {DELIVERABLE_TITLE_1}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DELIVERABLE_DESC_1}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="p-6 rounded-2xl bg-white border border-purple-200/50 shadow-md shadow-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {DELIVERABLE_TITLE_2}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DELIVERABLE_DESC_2}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-6 rounded-2xl bg-white border border-green-200/50 shadow-md shadow-green-500/5 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-300 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {DELIVERABLE_TITLE_3}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DELIVERABLE_DESC_3}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="p-6 rounded-2xl bg-white border border-orange-200/50 shadow-md shadow-orange-500/5 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {DELIVERABLE_TITLE_4}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DELIVERABLE_DESC_4}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
