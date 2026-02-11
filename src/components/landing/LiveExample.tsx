'use client';

import { SectionHeader } from './SectionHeader';
import { Reveal } from './Reveal';
import {
  SECTION_LIVE_TITLE,
  SECTION_LIVE_SUBTITLE,
  LIVE_CARD_TITLE_1,
  LIVE_CARD_TITLE_2,
  LIVE_CARD_TITLE_3,
  LIVE_CARD_DESC_1,
  LIVE_CARD_DESC_2,
  LIVE_CARD_DESC_3,
} from './placeholders';

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
          <Reveal delay={0.1}>
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/90 to-purple-800/90 overflow-hidden shadow-2xl shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:-translate-y-1">
              {/* Blur background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-center border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {LIVE_CARD_TITLE_1}
                </h3>
                <p className="text-purple-100/80">{LIVE_CARD_DESC_1}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/90 to-purple-800/90 overflow-hidden shadow-2xl shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-center border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {LIVE_CARD_TITLE_2}
                </h3>
                <p className="text-purple-100/80">{LIVE_CARD_DESC_2}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-900/90 to-purple-800/90 overflow-hidden shadow-2xl shadow-purple-900/20 hover:shadow-purple-900/30 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-center border border-white/20">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {LIVE_CARD_TITLE_3}
                </h3>
                <p className="text-purple-100/80">{LIVE_CARD_DESC_3}</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Small buttons below cards */}
        <Reveal delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5">
              BUTTON_1
            </button>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5">
              BUTTON_2
            </button>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5">
              BUTTON_3
            </button>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all hover:-translate-y-0.5">
              VIEW_ALL
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
