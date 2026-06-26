'use client'

import { useSidebarCounts } from '@/hooks/useSidebarCounts'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Database,
  FileCheck,
  Microscope,
  GitBranch,
  HelpCircle,
  Eye,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Activity,
} from 'lucide-react'

type BadgeVariant = 'red' | 'amber' | 'gray'

interface BadgeProps {
  value: string | number
  variant?: BadgeVariant
}

function Badge({ value, variant = 'gray' }: BadgeProps) {
  const classes: Record<BadgeVariant, string> = {
    red: 'bg-red-500 text-white',
    amber: 'bg-amber-500 text-white',
    gray: 'bg-gray-600 text-gray-200',
  }

  return (
    <span
      className={`ml-auto text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight ${classes[variant]}`}
    >
      {value}
    </span>
  )
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: () => React.ReactNode
}

export default function SidebarWithCounts() {
  const pathname = usePathname()
  const counts = useSidebarCounts()

  const navItems: NavItem[] = [
    {
      label: 'Today',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Objects',
      href: '/objects',
      icon: Database,
      badge: () => <Badge value={counts.objectsTotal} variant="gray" />,
    },
    {
      label: 'Claims',
      href: '/claims',
      icon: FileCheck,
      badge: () =>
        counts.claimsUnsupported > 0 ? (
          <Badge value={counts.claimsUnsupported} variant="amber" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'Evidence',
      href: '/evidence',
      icon: Microscope,
      badge: () => <Badge value={counts.staleEvidence} variant="gray" />,
    },
    {
      label: 'Decisions',
      href: '/decisions',
      icon: GitBranch,
      badge: () => <Badge value={counts.openDecisions} variant="gray" />,
    },
    {
      label: 'Assumptions',
      href: '/assumptions',
      icon: HelpCircle,
      badge: () =>
        counts.highRiskAssumptions > 0 ? (
          <Badge value={counts.highRiskAssumptions} variant="red" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'Unknowns',
      href: '/unknowns',
      icon: Eye,
      badge: () => <Badge value={counts.highEVIUnknowns} variant="gray" />,
    },
    {
      label: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      badge: () =>
        counts.overdueTasks > 0 ? (
          <Badge value={counts.overdueTasks} variant="red" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'Revenue',
      href: '/revenue',
      icon: TrendingUp,
      badge: () => (
        <Badge
          value={
            counts.currentMRR != null
              ? `$${counts.currentMRR.toLocaleString()}`
              : '$0'
          }
          variant="gray"
        />
      ),
    },
    {
      label: 'Risks',
      href: '/risks',
      icon: AlertTriangle,
      badge: () =>
        counts.criticalRisks > 0 ? (
          <Badge value={counts.criticalRisks} variant="red" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'System Health',
      href: '/system',
      icon: Activity,
      badge: () => (
        <Badge
          value={counts.raiScore != null ? counts.raiScore : '—'}
          variant="gray"
        />
      ),
    },
  ]

  const raiScore = counts.raiScore ?? 0
  const raiVariant: BadgeVariant =
    raiScore >= 80 ? 'gray' : raiScore >= 50 ? 'amber' : 'red'

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: '220px', minWidth: '220px', background: '#0D2137' }}
    >
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="text-white font-bold text-xl tracking-wide">PRISM</div>
        <div className="text-gray-400 text-xs mt-0.5">ICC</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && item.badge()}
            </Link>
          )
        })}
      </nav>

      {/* RAI Score Footer */}
      <div className="px-5 py-5 border-t border-white/10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-bold text-3xl leading-none">
              {counts.raiScore != null ? counts.raiScore : '—'}
            </div>
            <div className="text-gray-400 text-xs mt-1">RAI Score</div>
          </div>
          <Badge value={`MRR $${(counts.currentMRR ?? 0).toLocaleString()}`} variant={raiVariant} />
        </div>
      </div>
    </aside>
  )
}
