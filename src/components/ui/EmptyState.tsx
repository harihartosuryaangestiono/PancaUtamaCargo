import React from 'react'
import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] my-6 text-[#1D1D1F]">
      <div className="w-14 h-14 mb-4 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#007AFF] border border-black/[0.06]">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1D1D1F] mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-[#6E6E73] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#007AFF] rounded-xl hover:bg-[#0062CC] transition-all shadow-2xs active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
