'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import {
  SECTION_HOW_TITLE,
  SECTION_HOW_SUBTITLE,
  STEP_TITLE_1,
  STEP_TITLE_2,
  STEP_TITLE_3,
  STEP_DESC_1,
  STEP_DESC_2,
  STEP_DESC_3,
} from './placeholders';

export function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_HOW_TITLE}
          subtitle={SECTION_HOW_SUBTITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-6">
          <Reveal delay={0.1}>
            <div className="relative group">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30 z-10 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="p-8 pt-12 rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-white shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {STEP_TITLE_1}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{STEP_DESC_1}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="relative group">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30 z-10 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div className="p-8 pt-12 rounded-3xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-white shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {STEP_TITLE_2}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{STEP_DESC_2}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="relative group">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-green-500/30 z-10 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <div className="p-8 pt-12 rounded-3xl border border-green-200/50 bg-gradient-to-br from-green-50/50 to-white shadow-lg shadow-green-500/5 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {STEP_TITLE_3}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{STEP_DESC_3}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
