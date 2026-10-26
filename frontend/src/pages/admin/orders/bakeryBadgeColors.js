const PASTEL_COLORS = [
  'bg-rose-100 text-rose-900',
  'bg-sky-100 text-sky-900',
  'bg-violet-100 text-violet-900',
  'bg-amber-100 text-amber-900',
  'bg-orange-100 text-orange-900',
  'bg-emerald-100 text-emerald-900',
]

const BAKERY_COLORS = new Map([
  ['la crème pâtisserie', 0],
  ['the sweet art boutique', 1],
  ['maison de mousse', 2],
  ['chocoluxe master', 3],
  ['sweet bakery', 5],
])

export function getBakeryBadgeColor(bakeryName = '') {
  const key = bakeryName.normalize('NFC').trim().toLocaleLowerCase('vi-VN')
  const assignedColor = BAKERY_COLORS.get(key)
  if (assignedColor !== undefined) return PASTEL_COLORS[assignedColor]

  // Keep new bakery names stable across renders, filtering and page reloads.
  let hash = 0
  for (const character of key) {
    hash = (Math.imul(hash, 31) + character.codePointAt(0)) >>> 0
  }
  return PASTEL_COLORS[hash % PASTEL_COLORS.length]
}
