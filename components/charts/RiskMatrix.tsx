'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

interface Risk {
  id: string
  title: string
  likelihood: number
  impact: number
  category: string
  risk_score: number
}

interface RiskMatrixProps {
  risks: Risk[]
}

function getRiskColor(likelihood: number, impact: number): string {
  const score = likelihood * impact
  if (score >= 0.64) return '#ef4444'      // high — red
  if (score >= 0.4) return '#f97316'       // medium — orange
  if (score >= 0.16) return '#eab308'      // low-medium — yellow
  return '#22c55e'                          // low — green
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: Risk
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  if (!payload) return null
  const color = getRiskColor(payload.likelihood, payload.impact)
  return (
    <circle
      cx={cx}
      cy={cy}
      r={7}
      fill={color}
      fillOpacity={0.85}
      stroke="#fff"
      strokeWidth={1.5}
      style={{ cursor: 'pointer' }}
    />
  )
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: Risk }[]
}

function RiskTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const risk = payload[0].payload
  return (
    <div
      style={{
        background: '#0D2137',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#e2e8f0',
        maxWidth: 220,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{risk.title}</p>
      <p style={{ color: '#94a3b8', marginBottom: 2 }}>Category: {risk.category}</p>
      <p style={{ color: '#94a3b8', marginBottom: 2 }}>
        Likelihood: {(risk.likelihood * 100).toFixed(0)}%
      </p>
      <p style={{ color: '#94a3b8', marginBottom: 2 }}>
        Impact: {(risk.impact * 100).toFixed(0)}%
      </p>
      <p style={{ color: '#94a3b8' }}>Score: {risk.risk_score.toFixed(2)}</p>
    </div>
  )
}

export default function RiskMatrix({ risks }: RiskMatrixProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        {/* Background quadrant zones */}
        <defs>
          <linearGradient id="zone-low" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="zone-high" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.12} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

        <XAxis
          type="number"
          dataKey="likelihood"
          domain={[0, 1]}
          name="Likelihood"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Likelihood',
            position: 'insideBottom',
            offset: -10,
            fontSize: 12,
            fill: '#64748b',
          }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <YAxis
          type="number"
          dataKey="impact"
          domain={[0, 1]}
          name="Impact"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'Impact',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            fontSize: 12,
            fill: '#64748b',
          }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />

        {/* Threshold reference lines */}
        <ReferenceLine
          x={0.4}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
        />
        <ReferenceLine
          x={0.64}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
        />
        <ReferenceLine
          y={0.4}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
        />
        <ReferenceLine
          y={0.64}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 4"
        />

        <Tooltip content={<RiskTooltip />} />

        <Scatter data={risks} shape={<CustomDot />}>
          {risks.map((risk) => (
            <Cell key={risk.id} fill={getRiskColor(risk.likelihood, risk.impact)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
