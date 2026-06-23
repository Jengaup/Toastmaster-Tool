import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm hover:shadow-indigo-200/60 hover:shadow-md disabled:bg-indigo-300',
  secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm disabled:opacity-50',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-red-200/60 hover:shadow-md disabled:opacity-50',
  ghost:     'text-slate-600 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 disabled:opacity-50',
  success:   'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm hover:shadow-green-200/60 hover:shadow-md disabled:opacity-50',
  warning:   'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm hover:shadow-amber-200/60 hover:shadow-md disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-8 py-4 text-xl gap-3',
}

export function Button({ variant = 'secondary', size = 'md', icon, loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
