import React from 'react'

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-low rounded-2xl ${padding} shadow-sm border border-outline-variant/10 ${
        hover
          ? 'hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
