import { useState } from 'react'

export default function CatalogImage({ src, fallbackSrc, alt, className = '' }) {
  const [failedUrls, setFailedUrls] = useState([])
  const resolved = src && !failedUrls.includes(src) ? src : fallbackSrc && !failedUrls.includes(fallbackSrc) ? fallbackSrc : null
  if (!resolved) return <div role="img" aria-label={alt + ' — chưa có ảnh'} className={className + ' flex items-center justify-center bg-surface-container text-outline'}><span className="material-symbols-outlined text-4xl">image_not_supported</span></div>
  return <img src={resolved} alt={(resolved !== src ? 'Ảnh minh họa ' : '') + alt} loading="lazy" className={className} onError={() => setFailedUrls(current => [...current, resolved])} />
}
