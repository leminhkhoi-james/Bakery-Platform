import { cleanPresentationLabel } from './uiLabels.js'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Display-only, deterministic across pages/roles. Never use this label as a record key or request ID.
export function displayReference(id, prefix = 'REF', businessCode) {
  if (typeof businessCode === 'string' && businessCode.trim() && !uuid.test(businessCode.trim())) return cleanPresentationLabel(businessCode.trim())
  if (!id) return '—'
  const value = String(id).trim()
  if (!uuid.test(value)) return cleanPresentationLabel(value)
  let hash = 14695981039346656037n
  for (const character of value.toLowerCase()) hash = ((hash ^ BigInt(character.charCodeAt(0))) * 1099511628211n) & 0xffffffffffffn
  return `${prefix}-${hash.toString(36).toUpperCase().padStart(10, '0')}`
}
