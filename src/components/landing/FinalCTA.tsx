'use client';

import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';
import {
  FINAL_CTA_TITLE,
  FINAL_CTA_DESCRIPTION,
  FINAL_CTA_BUTTON,
} from './placeholders';

export function FinalCTA() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-purple-50 via-blue-50/50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 via-transparent to-blue-200/20"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <Reveal>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {FINAL_CTA_TITLE}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {FINAL_CTA_DESCRIPTION}
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-10 py-7 text-lg font-semibold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            {FINAL_CTA_BUTTON}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
