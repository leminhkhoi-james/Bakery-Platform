import React from 'react'

export default function EmptyState({
  icon = 'inbox',
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có mục nào để hiển thị.',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`p-12 text-center flex flex-col items-center justify-center rounded-2xl bg-surface-container-low/50 border border-dashed border-outline-variant/30 ${className}`}
    >
      <span className="material-symbols-outlined text-4xl text-outline mb-3">
        {icon}
      </span>
      <h3 className="font-bold text-sm text-primary mb-1">{title}</h3>
      <p className="text-xs text-on-surface-variant max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  )
}
