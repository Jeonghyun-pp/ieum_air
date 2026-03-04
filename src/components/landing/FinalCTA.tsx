'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthModal } from './LandingShell';
import { finalCTA } from './placeholders';

export function FinalCTA() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
        >
          {finalCTA.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-500 mb-10 leading-relaxed whitespace-pre-line"
        >
          {finalCTA.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="gradient"
            size="lg"
            rounded="full"
            className="px-10 py-7 text-lg font-semibold shadow-xl shadow-purple-500/25 hover:-translate-y-1 transition-all duration-300"
            onClick={() => openAuthModal('signup')}
          >
            {finalCTA.cta}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
