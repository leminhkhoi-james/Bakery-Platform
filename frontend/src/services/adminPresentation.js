import { bakeryReviewText } from './bakeryReviewModels.js'
import { cleanPresentationLabel } from './uiLabels.js'
export const reviewText = (value) => bakeryReviewText(cleanPresentationLabel(value))
export const reviewError = (error) => ({ ...error, status: error?.status, message: String(error?.message || '').replace(/^DEMO:\s*/i, '') })
export const reviewMoney = (amount, currency) => ['number', 'string'].includes(typeof amount) && String(amount).trim() && Number.isFinite(Number(amount)) && /^[A-Z]{3}$/.test(currency || '') ? Number(amount).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + (currency === 'VND' ? ' đ' : ' ' + currency) : 'Chưa có số tiền'
