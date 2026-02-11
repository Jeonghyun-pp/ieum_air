'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';

export default function MainPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main Content Area */}
      <div 
        className="flex-1 transition-all duration-150 ease-out"
        style={{ marginLeft: isCollapsed ? '64px' : '256px' }}
      >
        <main className="px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="mb-2">I:EUM</h1>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
