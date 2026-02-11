'use client';

import { ReactNode } from 'react';
import { TopNav } from '@/components/shared/top-nav';
import { Reveal } from './Reveal';
import {
  FOOTER_COPYRIGHT,
  FOOTER_LINK_1,
  FOOTER_LINK_2,
  FOOTER_LINK_3,
} from './placeholders';

interface LandingShellProps {
  children: ReactNode;
}

export function LandingShell({ children }: LandingShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TopNav */}
      <TopNav />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {FOOTER_COPYRIGHT}
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {FOOTER_LINK_1}
                </a>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {FOOTER_LINK_2}
                </a>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {FOOTER_LINK_3}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
