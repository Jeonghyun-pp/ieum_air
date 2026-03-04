'use client';

export function PortalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-dark-highlight rounded-lg mb-2" />
        <div className="h-5 w-96 bg-dark-highlight rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-dark-elevated" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-dark-elevated" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 rounded-2xl bg-dark-elevated" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-dark-elevated animate-pulse">
      <div className="h-4 w-32 bg-dark-highlight rounded mb-4" />
      <div className="h-64 bg-dark-highlight rounded-xl" />
    </div>
  );
}
