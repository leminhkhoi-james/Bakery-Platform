import { ApiError } from './apiClient.js'

export function paymentDateRange(from, to) {
  const parse = (value) => {
    if (!value) return undefined
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new ApiError('Ngày lọc chứng từ không hợp lệ.', 400)
    return new Date(value).toISOString()
  }
  const submittedFrom = parse(from), submittedTo = parse(to)
  if (submittedFrom && submittedTo && Date.parse(submittedFrom) > Date.parse(submittedTo)) throw new ApiError('Ngày bắt đầu không được sau ngày kết thúc.', 400)
  return { ...(submittedFrom ? { submittedFrom } : {}), ...(submittedTo ? { submittedTo } : {}) }
}
