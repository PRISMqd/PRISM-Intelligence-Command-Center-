'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AreaTrendChartProps {
  data: { date: string; value: number }[]
  color?: string
  fillColor?: string
  height?: number
}

export default function AreaTrendChart({
  data,
  color = '#0D2137',
  fillColor,
  height = 240,
}: AreaTrendChartProps) {
  const gradientId = `area-gradient-${color.replace('#', '')}`
  const resolvedFill = fillColor ?? color

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={resolvedFill} stopOpacity={0.35} />
            <stop offset="95%" stopColor={resolvedFill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#0D2137',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            fontSize: 12,
            color: '#e2e8f0',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
