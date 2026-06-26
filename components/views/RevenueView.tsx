'use client'

import { useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Info,
  DollarSign, BarChart2, Percent, Clock,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type MetricRow = {
  id: string
  metric_type: string | null
  metric_name: string | null
  dimension: string | null
  value: number | null
  unit: string | null
  value_label: string | null
  period_start: string | null
  period_end: string | null
  period_type: string | null
  recorded_at: string | null
  previous_value: number | null
  delta: number | null
  delta_percent: number | null
  trend: string | null
  notes: string | null
  current_status: string | null
  created_at: string | null
}

interface Props {
  metrics: MetricRow[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, opts?: Intl.NumberFormatOptions) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', opts).format(n)

const fmtUSD = (n: number | null | undefined) =>
  fmt(n, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtPct = (n: number | null | undefined) =>
  n == null ? '—' : `${(n * 100).toFixed(1)}%`

const SOURCE_CATEGORIES = [
  'Consulting',
  'CE/CME',
  'Digital products',
  'Grants',
  'Advisory fees',
  'Other',
] as const

const NAVY = '#0D2137'
const AMBER = '#F59E0B'

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ElementType
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wide">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <div className="text-xl font-semibold text-white truncate">{value}</div>
    </div>
  )
}

function TrendArrow({ trend }: { trend: string | null | undefined }) {
  if (trend === 'up') return <TrendingUp size={15} className="text-emerald-400" />
  if (trend === 'down') return <TrendingDown size={15} className="text-red-400" />
  return <Minus size={15} className="text-slate-400" />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RevenueView({ metrics }: Props) {
  // ── Derived data ─────────────────────────────────────────────────────────

  const now = Date.now()
  const MS_7 = 7 * 24 * 60 * 60 * 1000
  const MS_14 = 14 * 24 * 60 * 60 * 1000

  const revenueMetrics = useMemo(
    () => metrics.filter((m) => m.metric_type === 'revenue'),
    [metrics]
  )
  const mrrMetrics = useMemo(
    () => metrics.filter((m) => m.metric_type === 'mrr'),
    [metrics]
  )
  const pipelineMetrics = useMemo(
    () => metrics.filter((m) => m.metric_type === 'pipeline'),
    [metrics]
  )
  const conversionMetrics = useMemo(
    () => metrics.filter((m) => m.metric_type === 'conversion'),
    [metrics]
  )

  // Latest revenue entry date
  const latestRevenue = useMemo(() => {
    const dates = revenueMetrics
      .map((m) => m.recorded_at ?? m.created_at)
      .filter(Boolean)
      .map((d) => new Date(d!).getTime())
    return dates.length ? Math.max(...dates) : null
  }, [revenueMetrics])

  const daysSinceRevenue = latestRevenue ? now - latestRevenue : null
  const noRevenue7d = daysSinceRevenue == null || daysSinceRevenue > MS_7
  const noRevenue14d = daysSinceRevenue == null || daysSinceRevenue > MS_14

  // Header metrics
  const currentMRR = useMemo(() => {
    const sorted = [...mrrMetrics].sort(
      (a, b) =>
        new Date(b.recorded_at ?? b.created_at ?? 0).getTime() -
        new Date(a.recorded_at ?? a.created_at ?? 0).getTime()
    )
    return sorted[0]?.value ?? null
  }, [mrrMetrics])

  const projectedARR = currentMRR != null ? currentMRR * 12 : null

  const pipelineValue = useMemo(() => {
    return pipelineMetrics.reduce((sum, m) => sum + (m.value ?? 0), 0) || null
  }, [pipelineMetrics])

  const conversionRate = useMemo(() => {
    const sorted = [...conversionMetrics].sort(
      (a, b) =>
        new Date(b.recorded_at ?? b.created_at ?? 0).getTime() -
        new Date(a.recorded_at ?? a.created_at ?? 0).getTime()
    )
    return sorted[0]?.value ?? null
  }, [conversionMetrics])

  // Avg deal size from pipeline metrics
  const avgDealSize = useMemo(() => {
    const vals = pipelineMetrics.map((m) => m.value).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [pipelineMetrics])

  // Months of runway: if we have a revenue value and MRR, estimate runway = total_revenue / MRR
  const monthsRunway = useMemo(() => {
    const totalRev = revenueMetrics.reduce((s, m) => s + (m.value ?? 0), 0)
    return currentMRR && currentMRR > 0 ? totalRev / currentMRR : null
  }, [revenueMetrics, currentMRR])

  // MRR Trend: last 12 mrr rows by dimension='mrr' or all mrr metrics
  const mrrTrendData = useMemo(() => {
    const rows = [...mrrMetrics]
      .sort(
        (a, b) =>
          new Date(a.recorded_at ?? a.created_at ?? 0).getTime() -
          new Date(b.recorded_at ?? b.created_at ?? 0).getTime()
      )
      .slice(-12)
    return rows.map((m) => ({
      month: m.period_start
        ? new Date(m.period_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : m.recorded_at
        ? new Date(m.recorded_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : '—',
      mrr: m.value ?? 0,
    }))
  }, [mrrMetrics])

  // Revenue by source
  const revenueBySource = useMemo(() => {
    const map: Record<string, number> = {}
    for (const cat of SOURCE_CATEGORIES) map[cat] = 0

    for (const m of revenueMetrics) {
      const dim = m.dimension ?? m.metric_name ?? ''
      const matched = SOURCE_CATEGORIES.find(
        (c) => dim.toLowerCase().includes(c.toLowerCase().split('/')[0])
      )
      const key = matched ?? 'Other'
      map[key] = (map[key] ?? 0) + (m.value ?? 0)
    }

    return SOURCE_CATEGORIES.map((cat) => ({ source: cat, value: map[cat] }))
  }, [revenueMetrics])

  // Pipeline table
  const pipelineRows = useMemo(() => {
    return pipelineMetrics.map((m) => {
      const confidence =
        m.delta_percent != null ? m.delta_percent / 100 : null
      const riskAdj =
        m.value != null && confidence != null ? m.value * confidence : null
      return {
        id: m.id,
        name: m.metric_name ?? m.dimension ?? '—',
        stage: m.current_status ?? '—',
        value: m.value,
        confidence,
        riskAdj,
        closeDate: m.period_end ?? null,
        lastActivity: m.recorded_at ?? m.created_at ?? null,
      }
    })
  }, [pipelineMetrics])

  // Product performance table (revenue rows with dimension/metric_name)
  const productRows = useMemo(() => {
    const map: Record<
      string,
      { total: number; units: number; prices: number[]; trend: string | null }
    > = {}
    for (const m of revenueMetrics) {
      const key = m.metric_name ?? m.dimension ?? 'Unknown'
      if (!map[key]) map[key] = { total: 0, units: 0, prices: [], trend: m.trend }
      map[key].total += m.value ?? 0
      map[key].units += 1
      if (m.value != null) map[key].prices.push(m.value)
      if (m.trend) map[key].trend = m.trend
    }
    return Object.entries(map).map(([name, d]) => ({
      name,
      total: d.total,
      units: d.units,
      avgPrice: d.prices.length ? d.prices.reduce((a, b) => a + b, 0) / d.prices.length : null,
      trend: d.trend,
    }))
  }, [revenueMetrics])

  const hasAnyData = metrics.length > 0

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <TrendingUp size={48} className="text-slate-600" />
        <p className="text-lg font-medium text-slate-300">No revenue data recorded yet.</p>
        <p className="text-sm">Add revenue entries via the metrics table.</p>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Alert banners */}
      {noRevenue14d && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-red-300 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          No revenue recorded in 14 days — urgent follow-up required.
        </div>
      )}
      {!noRevenue14d && noRevenue7d && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-amber-300 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          No revenue recorded in 7 days.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-slate-400 text-sm mt-1">
          Financial performance, pipeline, and product metrics.
        </p>
      </div>

      {/* Header metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="MRR" value={fmtUSD(currentMRR)} icon={DollarSign} />
        <MetricCard label="ARR (projected)" value={fmtUSD(projectedARR)} icon={TrendingUp} />
        <MetricCard label="Pipeline value" value={fmtUSD(pipelineValue)} icon={BarChart2} />
        <MetricCard label="Avg deal size" value={fmtUSD(avgDealSize)} icon={DollarSign} />
        <MetricCard
          label="Conversion rate"
          value={conversionRate != null ? fmtPct(conversionRate) : '—'}
          icon={Percent}
        />
        <MetricCard
          label="Months of runway"
          value={monthsRunway != null ? monthsRunway.toFixed(1) : '—'}
          icon={Clock}
        />
      </div>

      {/* MRR Trend chart */}
      {mrrTrendData.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-base font-semibold text-white mb-4">MRR Trend (last 12 months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrTrendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAVY} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={NAVY} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [fmtUSD(v), 'MRR']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke={NAVY}
                strokeWidth={2.5}
                fill="url(#mrrGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by source bar chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Revenue by Source</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueBySource} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="source" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => [fmtUSD(v), 'Revenue']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pipeline table */}
      {pipelineRows.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Pipeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {[
                    'Name',
                    'Stage',
                    'Value ($)',
                    'Confidence (%)',
                    'Risk-adjusted',
                    'Expected close',
                    'Last activity',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipelineRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-2 pr-4 text-white font-medium">{row.name}</td>
                    <td className="py-2 pr-4 text-slate-300">{row.stage}</td>
                    <td className="py-2 pr-4 text-slate-300">{fmtUSD(row.value)}</td>
                    <td className="py-2 pr-4 text-slate-300">
                      {row.confidence != null ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="font-semibold text-amber-400">{fmtUSD(row.riskAdj)}</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">
                      {row.closeDate
                        ? new Date(row.closeDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">
                      {row.lastActivity
                        ? new Date(row.lastActivity).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product performance table */}
      {productRows.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Product Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Name', 'Total revenue', 'Units', 'Avg price', 'Trend'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productRows.map((row) => (
                  <tr key={row.name} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-2 pr-4 text-white font-medium">{row.name}</td>
                    <td className="py-2 pr-4 text-slate-300">{fmtUSD(row.total)}</td>
                    <td className="py-2 pr-4 text-slate-300">{row.units}</td>
                    <td className="py-2 pr-4 text-slate-300">{fmtUSD(row.avgPrice)}</td>
                    <td className="py-2 pr-4">
                      <TrendArrow trend={row.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evidence trail note */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-600/50 bg-slate-800/40 px-4 py-3 text-slate-400 text-xs">
        <Info size={14} className="shrink-0 mt-0.5 text-slate-500" />
        <span>
          <span className="font-semibold text-slate-300">Evidence trail: </span>
          Every revenue entry should have: source (Stripe / manual / bank), date verified, entered_by.
        </span>
      </div>
    </div>
  )
}
