'use client'

interface LoadingSkeletonProps {
  count?: number
  className?: string
}

export default function LoadingSkeleton({ count = 5, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 rounded-lg bg-gray-50 animate-pulse"
        >
          {/* Leading icon/avatar placeholder */}
          <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />

          {/* Main content area */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-3.5 bg-gray-200 rounded w-2/5" />
            <div className="h-3 bg-gray-200 rounded w-3/5" />
          </div>

          {/* Trailing badge placeholder */}
          <div className="h-5 w-16 bg-gray-200 rounded-full shrink-0" />
          <div className="h-5 w-12 bg-gray-200 rounded-full shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
