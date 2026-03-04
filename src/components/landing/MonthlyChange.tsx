'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import { SECTION_MONTHLY_TITLE, MONTHLY_CARDS } from './placeholders';

const cardStyles = [
  {
    bg: 'from-blue-50 via-blue-100/50 to-blue-50',
    border: 'border-blue-200/50',
    shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20',
    title: 'from-blue-600 to-blue-700',
  },
  {
    bg: 'from-purple-50 via-purple-100/50 to-purple-50',
    border: 'border-purple-200/50',
    shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20',
    title: 'from-purple-600 to-purple-700',
  },
  {
    bg: 'from-green-50 via-green-100/50 to-green-50',
    border: 'border-green-200/50',
    shadow: 'shadow-green-500/10 hover:shadow-green-500/20',
    title: 'from-green-600 to-green-700',
  },
];

export function MonthlyChange() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_MONTHLY_TITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-6">
          {MONTHLY_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={0.1 * (i + 1)}>
              <div
                className={`p-8 rounded-3xl bg-gradient-to-br ${cardStyles[i].bg} border ${cardStyles[i].border} shadow-lg ${cardStyles[i].shadow} transition-all duration-300 hover:-translate-y-1`}
              >
                <h3
                  className={`text-xl font-bold bg-gradient-to-r ${cardStyles[i].title} bg-clip-text text-transparent mb-3`}
                >
                  {card.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {card.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
