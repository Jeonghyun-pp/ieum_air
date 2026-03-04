'use client';

import { LandingShell } from '@/components/landing/LandingShell';
import { Hero } from '@/components/landing/Hero';
import { Services } from '@/components/landing/Services';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LiveDemo } from '@/components/landing/LiveDemo';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <LandingShell>
      <Hero />
      <Services />
      <HowItWorks />
      <LiveDemo />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </LandingShell>
  );
}
