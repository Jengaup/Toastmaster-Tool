import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{title}</h1>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-5 h-px bg-gradient-to-r from-green-400 via-amber-400 via-red-400 to-transparent opacity-60" />
    </div>
  )
}
