'use client'

import {
  BadgeColor,
  confidenceBadgeColor,
  assumptionRiskBadgeColor,
  riskScoreBadgeColor,
  raiBadgeColor,
} from '@/lib/scoring'

type ScoreType = 'confidence' | 'risk' | 'rai' | 'evi'

interface ScoreBadgeProps {
  score: number
  type: ScoreType
  className?: string
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-800 ring-green-200',
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
  gray: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const TYPE_LABELS: Record<ScoreType, string> = {
  confidence: 'Conf',
  risk: 'Risk',
  rai: 'RAI',
  evi: 'EVI',
}

function getColor(score: number, type: ScoreType): BadgeColor {
  switch (type) {
    case 'confidence':
      return confidenceBadgeColor(score)
    case 'risk':
      return riskScoreBadgeColor(score)
    case 'rai':
      return raiBadgeColor(score)
    case 'evi':
      // EVI is unbounded; positive is good, negative is bad
      if (score > 0) return 'green'
      if (score === 0) return 'gray'
      return 'red'
  }
}

function formatScore(score: number, type: ScoreType): string {
  if (type === 'rai') return score.toFixed(0)
  if (type === 'evi') return score.toFixed(1)
  return (score * 100).toFixed(0) + '%'
}

export default function ScoreBadge({ score, type, className = '' }: ScoreBadgeProps) {
  const color = getColor(score, type)
  const colorClasses = COLOR_CLASSES[color]
  const label = TYPE_LABELS[type]
  const formatted = formatScore(score, type)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClasses} ${className}`}
      title={`${label}: ${formatted}`}
    >
      <span className="font-normal opacity-70">{label}</span>
      <span>{formatted}</span>
    </span>
  )
}
