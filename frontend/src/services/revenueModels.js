export const businessDateSelected = (value, from, to) => (!from || Date.parse(value) >= Date.parse(from + 'T00:00:00+07:00')) && (!to || Date.parse(value) <= Date.parse(to + 'T23:59:59.999+07:00'))
export function businessDay(value) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 10) : ''
}

export const approvalDate = row => row.reviewedAt || row.approvedAt

export function approvedPayments(rows) {
  const byOrder = new Map()
  for (const row of rows) {
    const key = row.subscriptionOrderId || row.id
    if (row.status !== 'APPROVED' || !key) continue
    const previous = byOrder.get(key)
    const time = payment => Date.parse(approvalDate(payment)) || 0
    if (!previous || time(row) > time(previous)) byOrder.set(key, row)
  }
  return [...byOrder.values()]
}
