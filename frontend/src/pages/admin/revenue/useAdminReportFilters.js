import { useState } from 'react'

export const defaultAdminReportFilters = { bakeryId: '', dates: { from: '', to: '' }, activePreset: 'all', search: '', statusFilter: '' }

export function useAdminReportFilters(userId) {
  const key = 'sweetcake.admin-report-filters.v1:' + userId
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(key)) }
    catch { return null }
  })
  const filters = saved?.key === key ? saved.filters : defaultAdminReportFilters
  function updateFilters(changes) {
    const next = { key, filters: { ...filters, ...changes } }
    setSaved(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch { /* Filters still work for the current page. */ }
  }
  return [filters, updateFilters]
}
