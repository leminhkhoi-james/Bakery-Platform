import { cleanPresentationLabel } from './uiLabels.js'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const hexPrefixedCode = /^([a-z]{2,6})-([0-9a-f]{8})[0-9a-f]{16,28}$/i

// Display-only, deterministic across pages/roles. Never use this label as a record key or request ID.
export function displayReference(id, prefix = 'REF', businessCode) {
  if (typeof businessCode === 'string' && businessCode.trim()) {
    const trimmed = businessCode.trim()
    const hexMatch = trimmed.match(hexPrefixedCode)
    if (hexMatch) return `${hexMatch[1].toUpperCase()}-${hexMatch[2].toUpperCase()}`
    if (!uuid.test(trimmed)) return cleanPresentationLabel(trimmed)
  }
  if (!id) return '—'
  const value = String(id).trim()
  const hexValueMatch = value.match(hexPrefixedCode)
  if (hexValueMatch) return `${hexValueMatch[1].toUpperCase()}-${hexValueMatch[2].toUpperCase()}`
  if (!uuid.test(value)) return cleanPresentationLabel(value)
  let hash = 14695981039346656037n
  for (const character of value.toLowerCase()) hash = ((hash ^ BigInt(character.charCodeAt(0))) * 1099511628211n) & 0xffffffffffffn
  return `${prefix}-${hash.toString(36).toUpperCase().padStart(10, '0')}`
}

