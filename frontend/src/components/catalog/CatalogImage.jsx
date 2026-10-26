import { useState } from 'react'

export default function CatalogImage({ src, alt, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  if (!src || failedUrl === src) return <div role="img" aria-label={alt + ' — chưa có ảnh'} className={className + ' flex items-center justify-center bg-surface-container text-outline'}><span className="material-symbols-outlined text-4xl">image_not_supported</span></div>
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailedUrl(src)} />
}
