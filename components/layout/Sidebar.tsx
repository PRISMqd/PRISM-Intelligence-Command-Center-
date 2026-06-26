'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

// Placeholder hook — wired up in Phase 2
function useSidebarCounts() {
  return {
    objectCount: 0,
    unsupportedClaimCount: 0,
    staleEvidenceCount: 0,
    openDecisionCount: 0,
    highRiskAssumptionCount: 0,
    highEviUnknownCount: 0,
    overdueTaskCount: 0,
    mrr: 0,
    criticalRiskCount: 0,
    raiScore: 0,
    orgHealth: 0,
  };
}

type BadgeVariant = 'red' | 'amber' | 'gray';

interface BadgeProps {
  value: string | number;
  variant?: BadgeVariant;
}

function Badge({ value, variant = 'gray' }: BadgeProps) {
  const classes: Record<BadgeVariant, string> = {
    red: 'bg-red-500 text-white',
    amber: 'bg-amber-500 text-white',
    gray: 'bg-gray-600 text-gray-200',
  };

  return (
    <span
      className={`ml-auto text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight ${classes[variant]}`}
    >
      {value}
    </span>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: () => React.ReactNode;
}

export default function Sidebar() {
  const pathname = usePathname();
  const counts = useSidebarCounts();

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
      badge: () => <Badge value={counts.objectCount} variant="gray" />,
    },
    {
      label: 'Claims',
      href: '/claims',
      icon: FileCheck,
      badge: () =>
        counts.unsupportedClaimCount > 0 ? (
          <Badge value={counts.unsupportedClaimCount} variant="amber" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'Evidence',
      href: '/evidence',
      icon: Microscope,
      badge: () => <Badge value={counts.staleEvidenceCount} variant="gray" />,
    },
    {
      label: 'Decisions',
      href: '/decisions',
      icon: GitBranch,
      badge: () => <Badge value={counts.openDecisionCount} variant="gray" />,
    },
    {
      label: 'Assumptions',
      href: '/assumptions',
      icon: HelpCircle,
      badge: () =>
        counts.highRiskAssumptionCount > 0 ? (
          <Badge value={counts.highRiskAssumptionCount} variant="red" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'Unknowns',
      href: '/unknowns',
      icon: Eye,
      badge: () => <Badge value={counts.highEviUnknownCount} variant="gray" />,
    },
    {
      label: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      badge: () =>
        counts.overdueTaskCount > 0 ? (
          <Badge value={counts.overdueTaskCount} variant="red" />
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
          value={counts.mrr > 0 ? `$${counts.mrr.toLocaleString()}` : '$0'}
          variant="gray"
        />
      ),
    },
    {
      label: 'Risks',
      href: '/risks',
      icon: AlertTriangle,
      badge: () =>
        counts.criticalRiskCount > 0 ? (
          <Badge value={counts.criticalRiskCount} variant="red" />
        ) : (
          <Badge value={0} variant="gray" />
        ),
    },
    {
      label: 'System Health',
      href: '/system',
      icon: Activity,
      badge: () => <Badge value={counts.raiScore} variant="gray" />,
    },
  ];

  const raiVariant: BadgeVariant =
    counts.raiScore >= 80 ? 'gray' : counts.raiScore >= 50 ? 'amber' : 'red';

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
          const isActive = pathname === item.href;
          const Icon = item.icon;

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
          );
        })}
      </nav>

      {/* Org Health */}
      <div className="px-5 py-5 border-t border-white/10">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white font-bold text-3xl leading-none">
              {counts.orgHealth}
            </div>
            <div className="text-gray-400 text-xs mt-1">Org Health</div>
          </div>
          <Badge value={`RAI ${counts.raiScore}`} variant={raiVariant} />
        </div>
      </div>
    </aside>
  );
}
