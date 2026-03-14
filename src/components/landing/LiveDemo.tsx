'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, PartyPopper, Sun, Calendar } from 'lucide-react';
import { liveDemo } from './placeholders';

const typeConfig = {
  concert: { icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  festival: { icon: PartyPopper, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  holiday: { icon: Sun, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  normal: { icon: Calendar, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

export function LiveDemo() {
  const [selected, setSelected] = useState(1);
  const event = liveDemo.events[selected];
  const config = typeConfig[event.type];
  const Icon = config.icon;

  return (
    <section className="py-24 px-4 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {liveDemo.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {liveDemo.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Calendar cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {liveDemo.events.map((evt, i) => {
              const evtConfig = typeConfig[evt.type];
              const EvtIcon = evtConfig.icon;
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-gray-50 border-purple-300 shadow-lg shadow-purple-300/20'
                      : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-xs text-muted-foreground">{evt.day}</div>
                    <div className="text-lg font-bold text-foreground">{evt.date}</div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${evtConfig.bg} flex items-center justify-center`}>
                    <EvtIcon className={`w-5 h-5 ${evtConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{evt.event}</div>
                  </div>
                  <div className={`text-sm font-bold ${
                    evt.adjustment === '유지' ? 'text-muted-foreground' : 'text-emerald-400'
                  }`}>
                    {evt.adjustment}
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Detail panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`p-8 rounded-2xl bg-white border ${config.border} shadow-md`}
              >
                <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 ${config.color}`} />
                </div>
                <div className="text-sm text-muted-foreground mb-1">{event.date} ({event.day})</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{event.event}</h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="text-sm text-muted-foreground mb-1">추천 가격 조정</div>
                    <div className={`text-3xl font-bold ${
                      event.adjustment === '유지' ? 'text-muted-foreground' : 'text-emerald-400'
                    }`}>
                      {event.adjustment}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="text-sm text-muted-foreground mb-1">추천 근거</div>
                    <div className="text-sm text-foreground/80 leading-relaxed">
                      {event.type === 'concert' && '대형 콘서트로 인근 숙소 수요 급증 예상. 경쟁 숙소 이미 가격 인상 중.'}
                      {event.type === 'festival' && '벚꽃 시즌 시작으로 관광객 유입 증가. 일본·대만 관광객 검색량 상승 중.'}
                      {event.type === 'holiday' && '연휴 기간 국내 여행 수요 증가. 가족 단위 예약 비중 상승 예상.'}
                      {event.type === 'normal' && '특별 이벤트 없는 주말. 기본가 유지가 적정합니다.'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
