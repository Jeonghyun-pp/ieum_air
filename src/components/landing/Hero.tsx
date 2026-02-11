'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  HERO_TITLE,
  HERO_SUBTITLE,
  HERO_DESCRIPTION,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from './placeholders';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
};

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-purple-50/50">
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          <motion.div variants={itemVariants}>
            <p className="text-sm font-medium text-purple-600 mb-4 uppercase tracking-wider">
              {HERO_SUBTITLE}
            </p>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
          >
            {HERO_TITLE}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            {HERO_DESCRIPTION}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8 py-6 shadow-lg shadow-purple-500/25"
            >
              {CTA_PRIMARY}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="rounded-full px-8 py-6 border-2 hover:bg-purple-50"
            >
              {CTA_SECONDARY}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
