'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface SparklineChartProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

export default function SparklineChart({
  data,
  color,
  width = 80,
  height = 32,
}: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <AreaChart width={width} height={height} data={chartData}>
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={1.5}
        fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  )
}
