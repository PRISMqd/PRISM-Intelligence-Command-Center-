'use client'

import { ReactNode } from 'react'

interface PanelCardProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export default function PanelCard({
  title,
  description,
  children,
  actions,
  className = '',
}: PanelCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 leading-snug">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}
