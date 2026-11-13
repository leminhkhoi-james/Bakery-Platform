// Keep API-confirmed creation receipts discoverable until the owner submits them.
// Membership is rechecked by callers; this browser journal grants no permissions.
const memory = new Map()
const resumable = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE']
const key = userId => 'sweetcake.owner-draft-receipts.v1:' + userId
const branchParents = new Map()
const branchKey = (userId, bakeryId) => `sweetcake.owner-branch-parent.v1:${userId}:${bakeryId}`

// Creation provenance is local because the bakery API only records ownership.
export function rememberBranchParent(userId, bakeryId, parentId) {
  if (!userId || !bakeryId || !parentId || bakeryId === parentId) return
  const storageKey = branchKey(userId, bakeryId)
  try { localStorage.setItem(storageKey, parentId) }
  catch { branchParents.set(storageKey, parentId) }
}

export function readBranchParent(userId, bakeryId) {
  const storageKey = branchKey(userId, bakeryId)
  try { return localStorage.getItem(storageKey) ?? branchParents.get(storageKey) }
  catch { return branchParents.get(storageKey) }
}
export function ownerDraftReceipts(userId) {
  if (!userId) return []
  if (memory.has(userId)) return memory.get(userId)
  try { const rows = JSON.parse(localStorage.getItem(key(userId)) || '[]'); return Array.isArray(rows) ? rows.filter(row => row?.id && resumable.includes(row.status)) : [] }
  catch { return [] }
}
export function rememberOwnerDraft(userId, bakery) {
  if (!userId || !bakery?.id) return
  const rows = ownerDraftReceipts(userId).filter(row => row.id !== bakery.id)
  if (resumable.includes(bakery.status) && bakery.name) rows.push(bakery)
  // Never persist files, image data or credentials in the receipt journal.
  const receipts = rows.map(({ id, name, description, phoneNumber, email, status, operations }) => ({ id, name, description, phoneNumber, email, status, operations }))
  memory.set(userId, receipts)
  try { localStorage.setItem(key(userId), JSON.stringify(receipts)) } catch (error) { console.warn('Owner creation receipt remains in memory; browser persistence failed', error) }
}
