'use client'

import { useRouter } from 'next/navigation'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import PanelCard from '@/components/ui/PanelCard'
import type { OrgHealthDimension } from '@/lib/types'

const DIMENSIONS: { key: string; label: string }[] = [
  { key: 'reality_alignment_index', label: 'Reality Alignment Index' },
  { key: 'evidence_health', label: 'Evidence Health' },
  { key: 'decision_quality', label: 'Decision Quality' },
  { key: 'assumption_risk', label: 'Assumption Risk' },
  { key: 'unknown_burden', label: 'Unknown Burden' },
  { key: 'execution_velocity', label: 'Execution Velocity' },
]

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-[#375623] text-white'
  if (score >= 60) return 'bg-[#C55A11] text-white'
  return 'bg-[#9C0006] text-white'
}

function DeltaIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') return <TrendingUp className="w-3 h-3 text-green-300" />
  if (direction === 'down') return <TrendingDown className="w-3 h-3 text-red-300" />
  return <Minus className="w-3 h-3 text-gray-300" />
}

interface OrgHealthPanelProps {
  metrics: OrgHealthDimension[]
}

export default function OrgHealthPanel({ metrics }: OrgHealthPanelProps) {
  const router = useRouter()

  const getMetric = (key: string): OrgHealthDimension | undefined =>
    metrics.find((m) => m.key === key)

  return (
    <PanelCard
      title="Org Health"
      description="System-wide intelligence quality scores"
    >
      <div
        className="grid grid-cols-2 gap-3 cursor-pointer"
        onClick={() => router.push('/system')}
      >
        {DIMENSIONS.map(({ key, label }) => {
          const m = getMetric(key)
          const score = m?.score ?? 0
          const sparkData = (m?.sparkline_data ?? [0, 0, 0, 0, 0]).map((v, i) => ({ v, i }))
          const direction = m?.delta_direction ?? 'flat'
          const delta = m?.delta ?? 0

          return (
            <div
              key={key}
              className={`rounded-lg p-3 flex flex-col gap-1.5 ${scoreBg(score)}`}
            >
              <span className="text-[10px] font-medium opacity-80 leading-tight">{label}</span>
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold leading-none">{score}</span>
                  <span className="text-xs opacity-70">/100</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-0.5">
                    <DeltaIcon direction={direction} />
                    <span className="text-[10px] opacity-80">
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  </div>
                  <div style={{ width: 60, height: 24 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="rgba(255,255,255,0.6)"
                          fill="rgba(255,255,255,0.15)"
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </PanelCard>
  )
}
