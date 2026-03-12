'use client';

import { motion } from 'framer-motion';
import {
  Search,
  Instagram,
  FileText,
  Globe,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { services } from './placeholders';

const iconMap: Record<string, React.ElementType> = {
  Search,
  Instagram,
  FileText,
  Globe,
  BarChart3,
  CalendarDays,
};

const colorMap: Record<string, { bg: string; text: string; hover: string }> = {
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', hover: 'hover:border-purple-500/30' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', hover: 'hover:border-pink-500/30' },
  green: { bg: 'bg-green-500/15', text: 'text-green-400', hover: 'hover:border-green-500/30' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', hover: 'hover:border-blue-500/30' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', hover: 'hover:border-orange-500/30' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', hover: 'hover:border-emerald-500/30' },
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function Services() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            6가지 통합 서비스
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            리스팅 최적화부터 가격 전략까지, 숙소 홍보에 필요한 모든 것을 제공합니다
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            const colors = colorMap[service.color];
            return (
              <motion.div
                key={service.id}
                variants={item}
                className={`group p-6 rounded-xl border border-white/5 bg-dark-elevated hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default ${colors.hover}`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
