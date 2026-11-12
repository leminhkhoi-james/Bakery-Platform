import { useState } from 'react'
import { Icon } from '../../../components/common/WorkspaceUI.jsx'
import { businessDay } from '../../../mockData/business/metrics.js'
import { defaultAdminReportFilters } from './useAdminReportFilters.js'
import './admin-revenue.css'

function getPresetDates(preset) {
  const now = new Date()
  const todayStr = businessDay(now)
  if (preset === 'today') {
    return { from: todayStr, to: todayStr }
  }
  if (preset === '7days') {
    const d = new Date(now.getTime() - 6 * 86400000)
    return { from: businessDay(d), to: todayStr }
  }
  if (preset === '30days') {
    const d = new Date(now.getTime() - 29 * 86400000)
    return { from: businessDay(d), to: todayStr }
  }
  if (preset === 'month') {
    const firstDay = todayStr.slice(0, 7) + '-01'
    return { from: firstDay, to: todayStr }
  }
  return { from: '', to: '' }
}

export default function AdminRevenueFilters({ filters, updateFilters, scopeControl }) {
  const { dates, activePreset, search, bakeryId } = filters
  const [invalidDates, setInvalidDates] = useState(null)
  const draftDates = invalidDates || dates
  const dateError = invalidDates && 'Ngày bắt đầu không được sau ngày kết thúc.'

  const handlePresetSelect = preset => {
    setInvalidDates(null)
    updateFilters({ activePreset: preset, dates: getPresetDates(preset) })
  }
  const updateDates = next => {
    if (next.from && next.to && next.from > next.to) {
      setInvalidDates(next)
      return
    }
    setInvalidDates(null)
    updateFilters({ activePreset: 'custom', dates: next })
  }
  const handleResetFilter = () => {
    setInvalidDates(null)
    updateFilters(defaultAdminReportFilters)
  }
  return (
    <section className="sc-revenue-filter-panel" aria-label="Bộ lọc tổng quan">
      <div className="sc-revenue-search-box">
        <Icon name="search" />
        <input type="search" placeholder="Tìm theo tên…" aria-label="Tìm theo tên" value={search}
          onChange={event => updateFilters({ search: event.target.value })} />
        {search && <button type="button" className="sc-revenue-search-clear" onClick={() => updateFilters({ search: '' })} aria-label="Xóa từ khóa tìm kiếm"><Icon name="close" /></button>}
      </div>
      {scopeControl && <div className="sc-dashboard-scope-filter">{scopeControl}</div>}
      <div className="sc-revenue-filter-col">
        <div className="sc-revenue-segmented-control" role="tablist" aria-label="Mốc thời gian">
          {[
            ['all', 'Tất cả'], ['today', 'Hôm nay'], ['7days', '7 ngày'], ['30days', '30 ngày'], ['month', 'Tháng này'],
          ].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={activePreset === key}
            className={'sc-revenue-segment-btn' + (activePreset === key ? ' sc-revenue-segment-btn--active' : '')}
            onClick={() => handlePresetSelect(key)}>{label}</button>)}
        </div>
      </div>
      <div className="sc-revenue-range-form">
        <div className="sc-revenue-range-group">
          <div className="sc-revenue-date-field">
            <label htmlFor="rev-from-date" className="sc-revenue-date-label">Từ</label>
            <input id="rev-from-date" type="date" value={draftDates.from} aria-label="Từ ngày" className="sc-revenue-date-input"
              onChange={event => updateDates({ ...draftDates, from: event.target.value })} />
          </div>
          <span className="sc-revenue-date-sep" aria-hidden="true">→</span>
          <div className="sc-revenue-date-field">
            <label htmlFor="rev-to-date" className="sc-revenue-date-label">Đến</label>
            <input id="rev-to-date" type="date" value={draftDates.to} aria-label="Đến ngày" className="sc-revenue-date-input"
              onChange={event => updateDates({ ...draftDates, to: event.target.value })} />
          </div>
        </div>
        {(draftDates.from || draftDates.to || search || bakeryId) && <button type="button" className="sc-revenue-btn-reset" onClick={handleResetFilter} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><Icon name="restart_alt" /></button>}
      </div>
      {dateError && <div role="alert" className="sc-revenue-filter-error"><Icon name="error_outline" /><span>{dateError}</span></div>}
    </section>
  )
}
