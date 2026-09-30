import React from 'react'

export default function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
  icon = null,
  className = '',
}) {
  const variantClasses = {
    default: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-secondary/15 text-secondary',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold select-none ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {icon && (
        <span className="material-symbols-outlined text-[13px]">{icon}</span>
      )}
      {children}
    </span>
  )
}
