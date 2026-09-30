import React from 'react'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = '',
  onClear,
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border-none rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary/40 transition-all shadow-xs"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer"
          title="Xóa tìm kiếm"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  )
}
