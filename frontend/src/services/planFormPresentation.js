// Form validation mirrors the existing plan payload; feature values remain strings.
export function planFormErrors(values) {
  const errors = {}, text = (key, label, max) => {
    if (!String(values[key] ?? '').trim()) errors[key] = label + ' không được để trống.'
    else if (String(values[key]).trim().length > max) errors[key] = label + ' tối đa ' + max + ' ký tự.'
  }
  text('code', 'Mã gói', 50); text('name', 'Tên gói', 120)
  if (String(values.monthlyPrice ?? '').trim() === '' || !Number.isFinite(Number(values.monthlyPrice)) || Number(values.monthlyPrice) < 0) errors.monthlyPrice = 'Nhập giá mỗi tháng từ 0 đ trở lên.'
  if (!Number.isInteger(Number(values.billingPeriodMonths)) || Number(values.billingPeriodMonths) < 1) errors.billingPeriodMonths = 'Chu kỳ phải là số tháng nguyên lớn hơn 0.'
  const seen = new Set()
  for (const row of values.featureRows) {
    const code = typeof row.code === 'string' ? row.code.trim() : '', value = typeof row.value === 'string' ? row.value.trim() : ''
    if (!code || code.length > 80) errors[row.uiKey + ':code'] = 'Nhập mã quyền lợi, tối đa 80 ký tự.'
    else if (seen.has(code)) errors[row.uiKey + ':code'] = 'Loại quyền lợi này đã có trong gói.'
    seen.add(code)
    if (!value || value.length > 255) errors[row.uiKey + ':value'] = 'Nhập giá trị quyền lợi, tối đa 255 ký tự.'
  }
  return errors
}

export function parsePlanPrice(text) {
  const value = text.replace(/\s/g, '')
  // Accept Vietnamese thousands groups and comma decimals; reject ambiguous input.
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value)) return value === '' ? '' : NaN
  return value.replaceAll('.', '').replace(',', '.')
}

export function formatPlanPrice(value) {
  if (value === '' || !Number.isFinite(Number(value))) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 20 }).format(Number(value))
}

export const planPriceDescriptionConflict = (values) => Number(values.monthlyPrice) > 0 && /không\s+thu\s+phí|miễn\s+phí/i.test(values.description || '')
