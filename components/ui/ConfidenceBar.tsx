'use client'

interface ConfidenceBarProps {
  score: number
  showLabel?: boolean
  className?: string
}

function getBarColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500'
  if (score >= 0.4) return 'bg-amber-500'
  return 'bg-red-500'
}

function getTrackColor(score: number): string {
  if (score >= 0.7) return 'bg-green-100'
  if (score >= 0.4) return 'bg-amber-100'
  return 'bg-red-100'
}

export default function ConfidenceBar({ score, showLabel = false, className = '' }: ConfidenceBarProps) {
  const clampedScore = Math.max(0, Math.min(1, score))
  const widthPercent = (clampedScore * 100).toFixed(1)
  const displayPercent = (clampedScore * 100).toFixed(0) + '%'
  const barColor = getBarColor(clampedScore)
  const trackColor = getTrackColor(clampedScore)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative flex-1 h-2 rounded-full overflow-hidden ${trackColor}`}
        title={`Confidence: ${clampedScore.toFixed(3)}`}
        role="progressbar"
        aria-valuenow={clampedScore * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence score: ${displayPercent}`}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-gray-500 w-9 text-right shrink-0">
          {displayPercent}
        </span>
      )}
    </div>
  )
}
