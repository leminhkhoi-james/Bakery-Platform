export function phoneError(value) {
  const text = String(value || '').trim(), digits = text.replace(/\D/g, '')
  return /^\+?[0-9 ()-]+$/.test(text) && text.length <= 30 && digits.length >= 8 && digits.length <= 15 ? '' : 'Số điện thoại cần 8–15 chữ số, có thể có mã quốc gia.'
}
export function emailError(value) {
  const text = String(value || '').trim()
  return !text || text.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? '' : 'Email chưa đúng định dạng.'
}
