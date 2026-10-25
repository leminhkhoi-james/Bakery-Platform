import React from 'react'

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-xs gap-2',
    lg: 'px-6 py-3 text-sm gap-2.5',
  }

  const variantClasses = {
    primary:
      'bg-primary hover:bg-secondary text-on-primary shadow-sm hover:shadow',
    secondary:
      'bg-secondary hover:bg-secondary/90 text-on-secondary shadow-sm',
    outline:
      'border border-outline-variant/30 hover:border-secondary/40 bg-surface-container-low text-primary hover:bg-surface-container',
    ghost:
      'bg-transparent hover:bg-surface-container text-on-surface-variant hover:text-primary',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      )}
      {children}
    </button>
  )
}
