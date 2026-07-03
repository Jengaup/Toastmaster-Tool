import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accentColor?: string
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className = '', title, subtitle, action, padding = 'md', accentColor }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      {(title || action) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
    </div>
  )
}
