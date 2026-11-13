import { ApiError } from './apiClient.js'
import { createCustomerAddresses, demoId } from '../mockData/seed.js'
import { displayRuntime } from '../mockData/displayRuntime.js'

// Partition saved browser data, not an authorization boundary. Only original
// fixtures may supply defaults; never import another account's stored records.
export const userDataKey = (userId, feature) => {
  if (!userId) throw new ApiError('Vui lòng đăng nhập lại.', 401)
  return 'sweetcake.user.v1:' + encodeURIComponent(userId) + ':' + feature
}
export function createUserLocalData(storage, onChange = () => {}) {
  return {
    read(userId, feature, fallback) {
      const key = userDataKey(userId, feature)
      let raw
      try { raw = storage?.getItem(key) } catch { throw new ApiError('Không thể đọc dữ liệu đã lưu.', 503) }
      if (!raw) {
        // Preserve addresses from the previous explicitly user-indexed format.
        // Never import the shared seed/demo store, which has ambiguous ownership.
        if (feature === 'addresses') {
          try {
            const legacy = JSON.parse(storage?.getItem('sweetcake.local.account.v1') || 'null')
            const rows = legacy?.accounts?.[userId]?.addresses
            if (Array.isArray(rows) && rows.every(row => row.customerId === userId)) return structuredClone(rows)
          } catch { /* Preserve the original key; do not infer an owner. */ }
        }
        return structuredClone(fallback)
      }
      try {
        const saved = JSON.parse(raw)
        if (saved.version === 1 && saved.userId === userId && Array.isArray(saved.data)) return saved.data
      } catch { /* Do not overwrite invalid or foreign data. */ }
      throw new ApiError('Dữ liệu đã lưu không hợp lệ. Dữ liệu cũ được giữ nguyên.', 422)
    },
    write(userId, feature, data) {
      const key = userDataKey(userId, feature)
      this.read(userId, feature, [])
      if (!Array.isArray(data)) throw new ApiError('Dữ liệu không hợp lệ.', 422)
      if (!storage?.setItem) throw new ApiError('Không thể lưu dữ liệu trên trình duyệt.', 503)
      try { storage.setItem(key, JSON.stringify({ version: 1, userId, data })) }
      catch { throw new ApiError('Không thể lưu dữ liệu. Vui lòng thử lại.', 503) }
      onChange({ userId, feature })
    },
  }
}
export function browserUserData() {
  let storage
  try { storage = window.localStorage } catch { /* Report on write instead of pretending to save. */ }
  return createUserLocalData(storage, detail => {
    if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('sweetcake:user-data-changed', { detail }))
  })
}
export const isDefaultAddress = row => row.isDefault === true || row.isPrimary === true || row.primary === true
export const chooseUserAddress = (rows, selectedId) => rows.find(row => row.id === selectedId) || rows.find(isDefaultAddress) || rows[0] || null
export async function loadUserAddresses({ userId }) {
  if (!userId) return []
  // Restore the original display defaults only when demo display is configured.
  // A saved list (including an explicitly emptied list) always takes precedence.
  // Reserved fixture IDs cannot be submitted as real Backend addresses.
  const defaults = displayRuntime?.emptyDemo
    ? createCustomerAddresses(userId, i => demoId(90000 + i))
    : []
  const rows = browserUserData().read(userId, 'addresses', defaults)
  if (rows.some(row => row.customerId !== userId)) throw new ApiError('Địa chỉ đã lưu không thuộc tài khoản hiện tại.', 403)
  return rows
}
