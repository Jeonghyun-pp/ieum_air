'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthModal } from './LandingShell';
import { hero } from './placeholders';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Hero() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center px-4 py-24 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={item}>
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-purple-300 bg-purple-500/15 border border-purple-500/20 rounded-full">
              {hero.badge}
            </span>
          </motion.div>

          {/* Title with gradient */}
          <motion.h1
            variants={item}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] whitespace-pre-line"
          >
            <span className="text-gradient">{hero.title}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          >
            {hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="gradient"
              size="lg"
              rounded="full"
              className="px-8 py-6 text-base font-semibold shadow-lg shadow-purple-500/25"
              onClick={() => openAuthModal('signup')}
            >
              {hero.cta}
            </Button>
            <Button
              variant="outline"
              size="lg"
              rounded="full"
              className="px-8 py-6 text-base border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {hero.ctaSecondary}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={item}
            className="flex items-center justify-center gap-8 md:gap-12 pt-8"
          >
            {hero.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
