import { persistBusinessFile, storedMediaUrl, MEDIA_PREFIX } from './persistence.js'
import { DemoError } from '../store.js'
import { routeDemo } from '../router.js'

const urls = new Map()
function validate(file, max) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || !file.size || file.size > max) throw new DemoError('Kiểm tra định dạng và dung lượng tệp đính kèm.', 422)
}
export async function businessAttachments(store, path, method, body, form, user) {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'bakeries' && method === 'POST' && (['logo', 'cover'].includes(parts[2]) || parts[2] === 'add-ons' && parts[4] === 'image')) {
    store.bakeryAccess(user, parts[1], true)
    const file = form?.get?.('file')
    if (!file || !file.type.startsWith('image/')) throw new DemoError('Vui lòng chọn tệp ảnh.', 422)
    validate(file, 5 * 1024 * 1024)
    const url = await persistBusinessFile(file)
    if (parts[2] === 'add-ons') { const item = store.find('addOns', parts[3]); if (item.bakeryId !== parts[1]) throw new DemoError('Phụ kiện không thuộc cửa hàng.', 403); item.imageUrl = url }
    else store.find('bakeries', parts[1])[parts[2] + 'Url'] = url
    return { url }
  }
  if (parts[0] === 'conversations' && parts[2] === 'messages' && method === 'POST' && body.messageType !== 'TEXT') {
    const chat = routeDemo(store, '/conversations/' + parts[1], 'GET', {}, new URLSearchParams(), user)
    if (chat.status !== 'OPEN') throw new DemoError('Hội thoại đã đóng.', 409)
    const files = form?.getAll?.('files') || []
    if (!files.length || files.length > 5) throw new DemoError('Chọn từ 1 đến 5 tệp.', 422)
    let data = store.state.messages.find(message => message.conversationId === chat.id && message.clientMessageId === body.clientMessageId)
    if (!data) {
      const attachments = []
      for (const file of files) { validate(file, 10 * 1024 * 1024); if (body.messageType === 'IMAGE' && !file.type.startsWith('image/')) throw new DemoError('Tin ảnh chỉ nhận tệp ảnh.', 422); attachments.push({ id: store.id(), originalFileName: file.name, mediaType: file.type, fileSize: file.size, fileDataUrl: await persistBusinessFile(file) }) }
      data = { ...body, id: store.id(), conversationId: chat.id, senderId: user.id, attachments, deleted: false, createdAt: new Date().toISOString() }
      store.state.messages.push(data)
      Object.assign(store.find('conversations', chat.id), { lastMessageAt: data.createdAt, lastMessagePreview: body.content || files[0].name })
    }
    return data
  }
}
export async function attachBusinessProof(store, data, path, method, form) {
  if (/^\/subscription-orders\/[^/]+\/payments$/.test(path) && method === 'POST' && form?.get?.('proof')?.size) {
    const file = form.get('proof'); validate(file, 10 * 1024 * 1024)
    if (file.type === 'image/webp') throw new DemoError('Chứng từ chỉ nhận PNG/JPEG/PDF.', 422)
    const value = await persistBusinessFile(file)
    store.find('payments', data.id).proofDataUrl = value; data.proofDataUrl = value
  }
}
export function businessMediaView(value) {
  if (Array.isArray(value)) return value.map(businessMediaView)
  if (typeof value === 'string' && value.startsWith(MEDIA_PREFIX)) { const url = storedMediaUrl(value); if (url) { urls.set(value, url); return url } }
  if (!value || typeof value !== 'object') return value
  const result = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, businessMediaView(child)]))
  for (const [field, target] of [['proofDataUrl', 'proofUrl'], ['fileDataUrl', 'url']]) if (typeof result[field] === 'string' && (/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(result[field]) || result[field].startsWith('blob:'))) {
    const data = result[field]
    if (data.startsWith('blob:')) { result[target] = data; delete result[field]; continue }
    if (!urls.has(data)) { const comma = data.indexOf(','); urls.set(data, URL.createObjectURL(new Blob([Uint8Array.from(atob(data.slice(comma + 1)), char => char.charCodeAt(0))], { type: data.slice(5, data.indexOf(';')) }))) }
    result[target] = urls.get(data); delete result[field]
  }
  return result
}
export const businessMediaUrl = value => [...urls.values()].includes(value) ? value : null
