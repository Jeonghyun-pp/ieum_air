'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import { SECTION_DELIVERABLES_TITLE, DELIVER_CARDS } from './placeholders';

const cardStyles = [
  {
    border: 'border-blue-200/50',
    shadow: 'shadow-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300',
    iconOuter: 'from-blue-100 to-blue-200',
    iconInner: 'from-blue-500 to-blue-600',
  },
  {
    border: 'border-purple-200/50',
    shadow: 'shadow-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-300',
    iconOuter: 'from-purple-100 to-purple-200',
    iconInner: 'from-purple-500 to-purple-600',
  },
  {
    border: 'border-green-200/50',
    shadow: 'shadow-green-500/5 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-300',
    iconOuter: 'from-green-100 to-green-200',
    iconInner: 'from-green-500 to-green-600',
  },
];

export function Deliverables() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-purple-50/20">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={SECTION_DELIVERABLES_TITLE}
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {DELIVER_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={0.1 + i * 0.05}>
              <div
                className={`p-6 rounded-2xl bg-white border ${cardStyles[i].border} shadow-md ${cardStyles[i].shadow} transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cardStyles[i].iconOuter} flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <div
                      className={`w-6 h-6 bg-gradient-to-br ${cardStyles[i].iconInner} rounded-lg`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {card.desc}
                    </p>
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
