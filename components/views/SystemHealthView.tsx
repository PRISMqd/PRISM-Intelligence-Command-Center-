'use client'

import { useMemo } from 'react'
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Bot,
  Clock,
  Database,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricRow {
  id: string
  metric_type: string | null
  metric_name: string | null
  dimension: string | null
  value: number | null
  trend: string | null
  delta: number | null
  delta_percent: number | null
  recorded_at: string | null
  period_start: string | null
  notes: string | null
}

interface ContradictionRow {
  id: string
  severity: string | null
  status: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
  claim_a: { id: string; claim_text: string } | null
  claim_b: { id: string; claim_text: string } | null
}

interface AgentRow {
  id: string
  name: string
  agent_type: string | null
  status: string | null
  last_run_at: string | null
  next_run_at: string | null
  last_run_status: string | null
  description: string | null
  is_system_agent: boolean | null
}

interface StaleObjectRow {
  id: string
  name: string
  object_type: string
  updated_at: string | null
}

interface ProvenanceEvent {
  created_at: string | null
}

interface SystemHealthViewProps {
  metrics: MetricRow[]
  contradictions: ContradictionRow[]
  agents: AgentRow[]
  staleObjects: StaleObjectRow[]
  lastProvenanceEvent: ProvenanceEvent | null
}

// ─── RAI Dimension config ─────────────────────────────────────────────────────

interface DimensionConfig {
  key: string
  label: string
  description: string
  inverted: boolean // true = high score is bad
}

const RAI_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'forecast_accuracy',
    label: 'Forecast Accuracy',
    description: 'How well predictions match observed outcomes',
    inverted: false,
  },
  {
    key: 'calibration_score',
    label: 'Calibration Score',
    description: 'Alignment between stated confidence and actual accuracy',
    inverted: false,
  },
  {
    key: 'evidence_freshness',
    label: 'Evidence Freshness',
    description: 'Recency of evidence supporting active claims',
    inverted: false,
  },
  {
    key: 'unsupported_claim_ratio',
    label: 'Unsupported Claim Ratio',
    description: 'Fraction of claims lacking supporting evidence',
    inverted: true,
  },
  {
    key: 'contradiction_rate',
    label: 'Contradiction Rate',
    description: 'Rate of detected contradictions across claims',
    inverted: true,
  },
  {
    key: 'decision_accuracy',
    label: 'Decision Accuracy',
    description: 'Accuracy of decisions with known outcomes',
    inverted: false,
  },
  {
    key: 'unknown_ratio',
    label: 'Unknown Ratio',
    description: 'Proportion of knowledge in unknown state',
    inverted: true,
  },
  {
    key: 'bias_score',
    label: 'Bias Score',
    description: 'Detected systematic bias in claims and evidence',
    inverted: true,
  },
  {
    key: 'knowledge_decay_rate',
    label: 'Knowledge Decay Rate',
    description: 'Rate at which knowledge becomes stale',
    inverted: true,
  },
  {
    key: 'model_drift_score',
    label: 'Model Drift Score',
    description: 'Detected drift in underlying data models',
    inverted: true,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function raiColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-600'
}

function raiRingColor(score: number): string {
  if (score >= 80) return 'border-green-400'
  if (score >= 60) return 'border-amber-400'
  return 'border-red-400'
}

function raiBgGlow(score: number): string {
  if (score >= 80) return 'shadow-green-100'
  if (score >= 60) return 'shadow-amber-100'
  return 'shadow-red-100'
}

function progressBarColor(score: number, inverted: boolean): string {
  const effective = inverted ? 100 - score : score
  if (effective >= 80) return 'bg-green-500'
  if (effective >= 60) return 'bg-amber-400'
  return 'bg-red-500'
}

function trendIcon(trend: string | null) {
  if (trend === 'up') return <TrendingUp size={14} className="text-green-500" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />
  return <Minus size={14} className="text-gray-400" />
}

function relativeTime(ts: string | null): string {
  if (!ts) return 'never'
  try {
    return formatDistanceToNow(parseISO(ts), { addSuffix: true })
  } catch {
    return 'unknown'
  }
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function severityBadge(severity: string | null): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border border-red-300'
    case 'major':
      return 'bg-orange-100 text-orange-800 border border-orange-300'
    case 'minor':
      return 'bg-amber-100 text-amber-800 border border-amber-300'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

function stalenessColor(days: number): string {
  if (days > 90) return 'text-red-600 font-semibold'
  if (days > 30) return 'text-amber-600'
  if (days > 14) return 'text-yellow-600'
  return 'text-gray-500'
}

function agentStatusDot(status: string | null) {
  if (status === 'running')
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
    )
  if (status === 'error')
    return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
  return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SystemHealthView({
  metrics,
  contradictions,
  agents,
  staleObjects,
  lastProvenanceEvent,
}: SystemHealthViewProps) {
  // ── Derive RAI score (latest metric_type=rai, metric_name=rai_score or dimension=null) ──
  const raiMetrics = useMemo(
    () => metrics.filter((m) => m.metric_type === 'rai'),
    [metrics]
  )

  const latestRai = useMemo(() => {
    const overall = raiMetrics.find(
      (m) => m.metric_name === 'rai_score' || m.dimension === null || m.dimension === 'overall'
    )
    return overall ?? raiMetrics[0] ?? null
  }, [raiMetrics])

  const raiScore = Math.round(latestRai?.value ?? 0)

  // 30-day trend: group by recorded_at date, pick unique days, most recent 30
  const raiTrendData = useMemo(() => {
    const overallPoints = raiMetrics
      .filter(
        (m) => m.metric_name === 'rai_score' || m.dimension === null || m.dimension === 'overall'
      )
      .filter((m) => m.recorded_at && m.value !== null)
      .map((m) => ({
        date: m.recorded_at!.slice(0, 10),
        value: Math.round(m.value!),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // deduplicate by date (keep last per day)
    const map = new Map<string, number>()
    for (const p of overallPoints) map.set(p.date, p.value)
    const arr = Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .slice(-30)

    return arr.length > 1 ? arr : [{ date: 'now', value: raiScore }]
  }, [raiMetrics, raiScore])

  // ── Dimension breakdown ──
  const dimensionMap = useMemo(() => {
    const map = new Map<string, MetricRow[]>()
    for (const m of raiMetrics) {
      if (!m.dimension) continue
      const key = m.dimension
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [raiMetrics])

  function getDimensionMetrics(key: string): MetricRow[] {
    return (dimensionMap.get(key) ?? []).sort((a, b) =>
      (a.recorded_at ?? '').localeCompare(b.recorded_at ?? '')
    )
  }

  function getDimensionScore(key: string): number {
    const rows = getDimensionMetrics(key)
    if (rows.length === 0) return 0
    const latest = rows[rows.length - 1]
    return Math.round((latest.value ?? 0) * 100) / 100
  }

  function getDimensionTrend(key: string): string | null {
    const rows = getDimensionMetrics(key)
    if (rows.length === 0) return null
    return rows[rows.length - 1].trend
  }

  function getDimensionSparkline(key: string) {
    const rows = getDimensionMetrics(key).slice(-7)
    return rows.map((m, i) => ({ i, v: Math.round(m.value ?? 0) }))
  }

  // ── Realtime status ──
  const isLive = useMemo(() => {
    if (!lastProvenanceEvent?.created_at) return false
    const diffMs = Date.now() - new Date(lastProvenanceEvent.created_at).getTime()
    return diffMs < 60_000
  }, [lastProvenanceEvent])

  // ── Knowledge decay: compute days since update ──
  const decayObjects = useMemo(() => {
    return staleObjects
      .map((o) => ({
        ...o,
        daysSince: o.updated_at
          ? differenceInDays(new Date(), parseISO(o.updated_at))
          : 9999,
      }))
      .sort((a, b) => b.daysSince - a.daysSince)
  }, [staleObjects])

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reality Alignment Index and operational diagnostics
          </p>
        </div>
        {/* Realtime indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm">
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-green-700 font-medium">System is live</span>
            </>
          ) : (
            <>
              <span className="inline-flex rounded-full h-2 w-2 bg-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                Last event {relativeTime(lastProvenanceEvent?.created_at ?? null)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── RAI Score panel ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Big score */}
          <div className="flex flex-col items-center">
            <div
              className={`w-40 h-40 rounded-full border-8 flex items-center justify-center shadow-lg ${raiRingColor(raiScore)} ${raiBgGlow(raiScore)}`}
            >
              <span className={`text-5xl font-black tabular-nums ${raiColor(raiScore)}`}>
                {raiScore}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold tracking-widest text-gray-500 uppercase">
              Reality Alignment Index
            </p>
            <div className="mt-2 flex flex-col items-center gap-0.5 text-xs text-gray-400">
              <span>Last computed {relativeTime(latestRai?.recorded_at ?? null)}</span>
              <span>Next computation: scheduled</span>
            </div>
          </div>

          {/* 30-day trend */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              30-Day Trend
            </p>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={raiTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: '4px 8px' }}
                  formatter={(v: number) => [v, 'RAI']}
                  labelFormatter={(l) => l}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={raiScore >= 80 ? '#16a34a' : raiScore >= 60 ? '#f59e0b' : '#dc2626'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── RAI Dimensions breakdown ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={15} />
          RAI Dimensions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {RAI_DIMENSIONS.map((dim) => {
            const score = getDimensionScore(dim.key)
            const trend = getDimensionTrend(dim.key)
            const sparkline = getDimensionSparkline(dim.key)
            const barColor = progressBarColor(score, dim.inverted)
            // For display: show as percentage (assume 0–1 range if ≤1, else 0–100)
            const displayScore = score <= 1 ? Math.round(score * 100) : Math.round(score)
            const barWidth = score <= 1 ? score * 100 : score

            return (
              <div
                key={dim.key}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{dim.label}</span>
                  <div className="flex items-center gap-1">
                    {trendIcon(trend)}
                    <span className="text-sm font-bold text-gray-700 tabular-nums">
                      {displayScore}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, barWidth))}%` }}
                  />
                </div>

                {/* Sparkline */}
                {sparkline.length > 1 && (
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={dim.inverted ? '#f59e0b' : '#3b82f6'}
                          fill={dim.inverted ? '#fef3c7' : '#eff6ff'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <p className="text-xs text-gray-400 leading-snug">{dim.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Two-column lower section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Contradictions panel ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={15} />
            Active Contradictions
            <span className="ml-auto text-xs font-normal normal-case text-gray-400">
              {contradictions.length} active
            </span>
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {contradictions.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <AlertTriangle size={32} className="opacity-30" />
                <p className="text-sm">No active contradictions detected</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contradictions.map((c) => (
                  <div key={c.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="flex-1 truncate italic text-gray-500">
                        &ldquo;{truncate(c.claim_a?.claim_text ?? c.description ?? '—', 60)}&rdquo;
                      </span>
                      <span className="text-gray-400 font-medium shrink-0">vs</span>
                      <span className="flex-1 truncate italic text-gray-500">
                        &ldquo;{truncate(c.claim_b?.claim_text ?? '—', 60)}&rdquo;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityBadge(c.severity)}`}
                      >
                        {c.severity ?? 'unknown'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {c.status ?? 'open'}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {relativeTime(c.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Background Jobs (Agents) ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bot size={15} />
            Background Jobs
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {agents.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <Bot size={32} className="opacity-30" />
                <p className="text-sm">No system agents configured</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <div key={agent.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {agentStatusDot(agent.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{agent.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {agent.agent_type ?? 'agent'}
                          {agent.description ? ` · ${agent.description}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 text-[11px] text-gray-400 pl-5">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Last: {relativeTime(agent.last_run_at)}
                      </span>
                      {agent.next_run_at && (
                        <span className="flex items-center gap-1">
                          Next: {relativeTime(agent.next_run_at)}
                        </span>
                      )}
                      {agent.last_run_status && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            agent.last_run_status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : agent.last_run_status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {agent.last_run_status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Knowledge Decay panel ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database size={15} />
          Knowledge Decay
          <span className="ml-auto text-xs font-normal normal-case text-gray-400">
            Objects longest without update
          </span>
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {decayObjects.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <Database size={28} className="opacity-30" />
              <p className="text-sm">All objects are up to date</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Object</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Last Updated</th>
                  <th className="px-4 py-2 text-right">Days Stale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {decayObjects.map((obj) => (
                  <tr key={obj.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">
                      {obj.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 capitalize text-xs">
                      {obj.object_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                      {relativeTime(obj.updated_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`text-xs font-mono tabular-nums ${stalenessColor(obj.daysSince)}`}
                      >
                        {obj.daysSince === 9999 ? 'never' : obj.daysSince + 'd'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
