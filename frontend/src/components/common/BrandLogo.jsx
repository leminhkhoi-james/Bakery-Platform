import React from 'react'
import brandLogoImg from '../../assets/brand-logo.png'

/**
 * SweetCake Calligraphy Brand Logo Component
 * Uses the official Sweet Cake logo artwork with line-art cake, cursive script typography,
 * double pink heart accent, and sweeping swash flourish underline.
 */
export default function BrandLogo({
  variant = 'default',
  size = 'md',
  onClick,
  className = '',
}) {
  const sizeConfigs = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-18 sm:h-20',
  }

  const currentHeightClass = sizeConfigs[size] || sizeConfigs.md

  return (
    <div
      className={`inline-flex items-center select-none transition-all group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <img
        src={brandLogoImg}
        alt="SweetCake Logo"
        className={`${currentHeightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] filter drop-shadow-[0_2px_4px_rgba(84,40,26,0.06)]`}
        onError={(e) => {
          // Fallback to public path if bundler import fails
          e.currentTarget.src = '/brand-logo.png'
        }}
      />
    </div>
  )
}

