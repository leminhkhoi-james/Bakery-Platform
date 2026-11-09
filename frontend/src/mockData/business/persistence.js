import { BUSINESS_STORAGE_KEY, createBusinessSeed, repairSeedRequestDates } from './seed.js'
import { validSave } from '../store.js'

export const BUSINESS_DB = 'sweetcake-business-simulation'
export const MEDIA_PREFIX = 'sc-business-media:'
const media = new Map()
const friendly = 'Chưa thể mở sổ kinh doanh đã lưu. Dữ liệu cũ vẫn được giữ nguyên. Hãy đóng các tab khác rồi tải lại trang.'
export function storageMessage(error) {
  console.error('[SweetCake simulation storage]', error)
  return error?.name === 'QuotaExceededError' ? 'Thiết bị không còn đủ dung lượng lưu. Dữ liệu cũ được giữ nguyên; hãy giải phóng dung lượng rồi thử lại.' : friendly
}
const request = operation => new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); if ('onblocked' in operation) operation.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab')) })
const complete = transaction => new Promise((resolve, reject) => { transaction.oncomplete = resolve; transaction.onabort = () => reject(transaction.error || new Error('Storage transaction aborted')); transaction.onerror = () => reject(transaction.error) })
const validate = raw => { const data = JSON.parse(raw); if (!validSave(data) || data.businessVersion !== 1) throw new Error('Invalid business save; original preserved'); return data }
export const storedMediaUrl = ref => media.get(ref)?.url || null
async function mediaRecord(file) {
  const bytes = await file.arrayBuffer(), hash = await crypto.subtle.digest('SHA-256', bytes)
  const key = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('') + ':' + file.type
  const ref = MEDIA_PREFIX + key
  if (!media.has(ref)) media.set(ref, { blob: new Blob([bytes], { type: file.type }), url: null })
  const record = media.get(ref); record.url ||= URL.createObjectURL(record.blob)
  return { ref, blob: record.blob }
}
export async function persistBusinessFile(file) { return (await mediaRecord(file)).ref }
async function externalize(value, blobs) {
  if (typeof value === 'string' && /^data:[^,]*;base64,/.test(value)) {
    const comma = value.indexOf(','), type = value.slice(5, value.indexOf(';'))
    const file = new Blob([Uint8Array.from(atob(value.slice(comma + 1)), char => char.charCodeAt(0))], { type })
    const item = await mediaRecord(file); blobs.set(item.ref, item.blob); return item.ref
  }
  if (typeof value === 'string' && value.startsWith(MEDIA_PREFIX)) { const item = media.get(value); if (item) blobs.set(value, item.blob); return value }
  if (Array.isArray(value)) return Promise.all(value.map(child => externalize(child, blobs)))
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, child]) => [key, await externalize(child, blobs)])))
  return value
}
export async function openBusinessPersistence(legacyStorage, indexedDB = globalThis.indexedDB) {
  if (!indexedDB) throw new Error('IndexedDB unavailable; local data preserved')
  const opening = indexedDB.open(BUSINESS_DB, 1)
  opening.onupgradeneeded = () => { for (const name of ['state', 'media', 'backups']) if (!opening.result.objectStoreNames.contains(name)) opening.result.createObjectStore(name) }
  const db = await request(opening)
  db.onversionchange = () => db.close()
  const channel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sweetcake-business-simulation') : null
  let cache
  async function refresh() {
    const tx = db.transaction(['state', 'media'], 'readonly')
    const rawRequest = request(tx.objectStore('state').get(BUSINESS_STORAGE_KEY))
    const keysRequest = request(tx.objectStore('media').getAllKeys()), blobsRequest = request(tx.objectStore('media').getAll())
    const [raw, keys, blobs] = await Promise.all([rawRequest, keysRequest, blobsRequest])
    keys.forEach((key, i) => { if (!media.has(key)) media.set(key, { blob: blobs[i], url: URL.createObjectURL(blobs[i]) }) })
    if (raw) { validate(raw); cache = raw }
    return raw
  }
  async function commit(raw, backup) {
    const blobs = new Map(), data = await externalize(validate(raw), blobs), compact = JSON.stringify(data)
    const tx = db.transaction(['state', 'media', 'backups'], 'readwrite'), done = complete(tx)
    tx.objectStore('state').put(compact, BUSINESS_STORAGE_KEY)
    for (const [key, blob] of blobs) tx.objectStore('media').put(blob, key)
    if (backup != null) tx.objectStore('backups').put({ raw: backup, savedAt: new Date().toISOString() }, 'localStorage-v1-original')
    await done; cache = compact; channel?.postMessage('saved')
  }
  async function repairSavedRequestDates() {
    const tx = db.transaction(['state', 'backups'], 'readwrite')
    const done = complete(tx)
    const states = tx.objectStore('state')
    const raw = await request(states.get(BUSINESS_STORAGE_KEY))
    if (raw) {
      const data = validate(raw)
      if (repairSeedRequestDates(data)) {
        tx.objectStore('backups').put({ raw, savedAt: new Date().toISOString() }, 'before-seed-rfq-date-repair')
        states.put(JSON.stringify(data), BUSINESS_STORAGE_KEY)
      }
    }
    await done
  }
  if (channel) channel.onmessage = async () => { try { await refresh(); window.dispatchEvent(new Event('sweetcake:api-mutated')) } catch (error) { storageMessage(error) } }
  try {
    if (!await refresh()) {
      const legacy = legacyStorage?.getItem(BUSINESS_STORAGE_KEY)
      // The raw legacy copy and migrated state commit atomically. Never remove/overwrite localStorage.
      await commit(legacy || JSON.stringify(createBusinessSeed()), legacy)
      await refresh()
      console.info('[SweetCake simulation] IndexedDB ready', { migrated: Boolean(legacy), businessBytes: cache.length })
    }
    await repairSavedRequestDates()
    await refresh()
    return { initialized: true, getItem: key => key === BUSINESS_STORAGE_KEY ? cache : null, setItem: (key, raw) => { if (key !== BUSINESS_STORAGE_KEY) throw new Error('Invalid storage scope'); return commit(raw).catch(error => { throw new Error(storageMessage(error)) }) }, refresh: () => refresh().catch(error => { throw new Error(storageMessage(error)) }), close: () => { channel?.close(); db.close() } }
  } catch (error) { channel?.close(); db.close(); throw error }
}
