export function CampaignCardSkeleton() {
  return (
    <div className="card animate-pulse-slow">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-6 w-24 rounded-full"></div>
        <div className="skeleton h-6 w-20 rounded-full"></div>
      </div>
      <div className="skeleton h-8 w-full mb-3"></div>
      <div className="skeleton h-20 w-full mb-4"></div>
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-32"></div>
        <div className="skeleton h-4 w-16"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card p-8 animate-pulse-slow">
      <div className="flex items-start gap-6">
        <div className="skeleton w-20 h-20 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-4 w-64"></div>
          <div className="flex gap-6">
            <div className="skeleton h-6 w-24"></div>
            <div className="skeleton h-6 w-24"></div>
            <div className="skeleton h-6 w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse-slow">
          <div className="flex items-center gap-4">
            <div className="skeleton w-10 h-10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4"></div>
              <div className="skeleton h-3 w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 text-center animate-pulse-slow">
      <div className="skeleton w-12 h-12 mx-auto mb-4 rounded-xl"></div>
      <div className="skeleton h-8 w-16 mx-auto mb-2"></div>
      <div className="skeleton h-4 w-24 mx-auto"></div>
    </div>
  );
}
