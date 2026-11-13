export const vendorMoney = (value) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? 'Chưa cập nhật' : Number(value).toLocaleString('vi-VN') + ' đ'
export const vendorName = (value, fallback = 'Chưa cập nhật') => typeof value === 'string' && value.trim() && value.trim() !== '.' && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.trim()) ? value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') : fallback

export function vendorAddress(row) {
  const parts = []
  for (const value of [row?.addressLine, row?.ward, row?.district, row?.city]) if (typeof value === 'string' && value.trim() && !parts.join(', ').toLocaleLowerCase('vi').includes(value.trim().toLocaleLowerCase('vi'))) parts.push(value.trim())
  return parts.join(', ') || 'Chưa cập nhật'
}
