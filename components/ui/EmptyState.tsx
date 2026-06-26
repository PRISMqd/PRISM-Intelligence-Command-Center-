'use client'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  className?: string
}

export default function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="text-4xl mb-4 select-none" role="img" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  )
}
