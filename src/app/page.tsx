'use client';

import { LandingShell } from '@/components/landing/LandingShell';
import { Hero } from '@/components/landing/Hero';
import { LiveExample } from '@/components/landing/LiveExample';
import { MonthlyChange } from '@/components/landing/MonthlyChange';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Deliverables } from '@/components/landing/Deliverables';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <LandingShell>
      <Hero />
      <LiveExample />
      <MonthlyChange />
      <HowItWorks />
      <Deliverables />
      <FinalCTA />
    </LandingShell>
  );
}
