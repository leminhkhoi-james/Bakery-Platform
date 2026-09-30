/**
 * SweetCake Shared Utility Formatters
 */

/**
 * Currency Formatter for VND
 * @param {number} num 
 * @returns {string} e.g. "950.000đ"
 */
export const formatVND = (num) => {
  if (num === null || num === undefined) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ'
}

/**
 * Seconds countdown formatter
 * @param {number} secs 
 * @returns {string} e.g. "45:00"
 */
export const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
