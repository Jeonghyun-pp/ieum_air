'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import {
  SECTION_LIVE_TITLE,
  SECTION_LIVE_SUBTITLE,
  LIVE_CARDS,
} from './placeholders';

const cardAccents = [
  'from-blue-400/20 to-blue-600/20',
  'from-purple-400/20 to-pink-600/20',
  'from-green-400/20 to-emerald-600/20',
];

const iconGradients = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-pink-600',
  'from-green-400 to-emerald-600',
];

export function LiveExample() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-purple-50/20">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_LIVE_TITLE}
          subtitle={SECTION_LIVE_SUBTITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-6">
          {LIVE_CARDS.map((card, i) => (
            <Reveal key={card.monthLabel} delay={0.1 * (i + 1)}>
              <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/90 to-purple-800/90 overflow-hidden shadow-2xl shadow-purple-200/30 hover:shadow-purple-200/40 transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${cardAccents[i]} backdrop-blur-sm`}></div>
                <div className="relative z-10">
                  {/* Month badge */}
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-center border border-white/20">
                    <span className={`text-lg font-bold bg-gradient-to-br ${iconGradients[i]} bg-clip-text text-transparent`}>
                      {card.monthLabel}
                    </span>
                  </div>

                  {/* Target / Channel / Focus */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">{card.targetTitle}</p>
                      <p className="text-lg font-bold text-white">{card.targetValue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">{card.channelTitle}</p>
                      <p className="text-white">{card.channelValue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">{card.focusTitle}</p>
                      <p className="text-white">{card.focusValue}</p>
                    </div>
                  </div>

                  {/* Why this month */}
                  <div>
                    <p className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider mb-2">{card.whyTitle}</p>
                    <ul className="space-y-1">
                      {card.whyBullets.map((bullet, j) => (
                        <li key={j} className="text-sm text-purple-100/80 flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-300/60 flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
