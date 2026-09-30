import React from 'react'

export default function LoadingSpinner({
  size = 'md', // 'sm' | 'md' | 'lg'
  text = 'Đang tải...',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}
    >
      <div
        className={`${
          sizeClasses[size] || sizeClasses.md
        } border-secondary border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <span className="text-xs font-medium text-on-surface-variant">
          {text}
        </span>
      )}
    </div>
  )
}
