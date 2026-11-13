import references from '../mockData/business/menuReference.json'

const key = value => String(value || '').normalize('NFC').trim().toLocaleLowerCase('vi')
const illustratedProducts = references.filter(product => typeof product.image === 'string' && product.image)

// Presentation only. Product IDs, availability, prices and mutations still come from the API.
export function catalogReferenceImage(product) {
  const exact = illustratedProducts.find(reference => key(reference.title) === key(product.title))
  if (exact) return exact.image
  const category = illustratedProducts.filter(reference => key(reference.category) === key(product.category))
  const candidates = category.length ? category : illustratedProducts
  if (!candidates.length) return null
  const hash = [...String(product.id || product.title || '')].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
  return candidates[hash % candidates.length].image
}
