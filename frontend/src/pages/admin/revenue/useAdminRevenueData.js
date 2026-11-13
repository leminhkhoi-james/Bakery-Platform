import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadRevenuePayments } from '../../../services/adminSummaryService.js'
import { loadAdminPlans } from '../../../services/adminManagementService.js'
import { approvalDate, approvedPayments, businessDateSelected } from '../../../mockData/business/metrics.js'
import { recordSource, unifiedIssues } from '../../../services/unifiedDataService.js'
import { planName, sortPlansByTier } from '../../../services/planPresentation.js'

export function useAdminRevenueData({ bakeryId: reportBakeryId, dates: appliedDates, search, statusFilter }) {
  const paymentsResource = useCatalogResource(loadRevenuePayments)
  const plansResource = useCatalogResource(loadAdminPlans)
  const loading = paymentsResource.status === 'loading'
  const nameKey = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('vi').replace(/đ/g, 'd')
  const query = nameKey(search.trim())
  const allPayments = (paymentsResource.data || []).filter(row =>
    (!reportBakeryId || (row.bakeryId || row.context?.order?.bakeryId) === reportBakeryId) &&
    (!query || [row.context?.profile?.bakery?.name, row.submittedByName, row.context?.order?.planNameSnapshot]
      .some(value => nameKey(value).includes(query)))
  )
  const inPeriod = payment => businessDateSelected(payment.reviewedAt || payment.submittedAt, appliedDates.from, appliedDates.to)
  const approvalInPeriod = payment => businessDateSelected(approvalDate(payment), appliedDates.from, appliedDates.to)
  const payments = allPayments.filter(payment => payment.status === 'APPROVED' ? approvalInPeriod(payment) : inPeriod(payment))
  const ready = paymentsResource.status === 'ready'
  const apiReady = ready && !unifiedIssues().some(issue => issue.source === 'api' && issue.path === '/admin/bakery-payments')
  const localReady = ready && !unifiedIssues().some(issue => issue.source === 'local' && issue.path === '/admin/bakery-payments')
  const realPayments = approvedPayments(allPayments.filter(row => recordSource(row) === 'api')).filter(approvalInPeriod)
  const simulatedPayments = approvedPayments(allPayments.filter(row => recordSource(row) === 'local')).filter(approvalInPeriod)
  const sum = rows => rows.reduce((total, row) => total + Number(row.amount || 0), 0)
  const realRevenue = apiReady ? sum(realPayments) : null
  const simulatedRevenue = localReady ? sum(simulatedPayments) : null
  const countedRows = [...(apiReady ? realPayments : []), ...(localReady ? simulatedPayments : [])]

  const filteredPayments = (() => {
    const q = search.toLowerCase().trim()
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      const bName = p.context?.profile?.bakery?.name || p.submittedByName || ''
      const pName = planName({ name: p.context?.order?.planNameSnapshot, code: p.context?.order?.planCodeSnapshot })
      const ref = p.paymentReference || p.id || ''
      return (
        bName.toLowerCase().includes(q) ||
        pName.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q)
      )
    })
  })()

  const periodTotalRevenue = (apiReady || localReady) ? (realRevenue ?? 0) + (simulatedRevenue ?? 0) : null

  const countedPayments = new Set(countedRows.map(row => row.id))
  // Revenue breakdown by plan tier
  const planTiers = (() => {
    const plans = plansResource.data || []
    const breakdown = {}

    // Initialize all plans
    for (const plan of plans) {
      breakdown[plan.code || plan.id] = {
        id: plan.id,
        code: plan.code,
        name: planName(plan),
        monthlyPrice: plan.monthlyPrice,
        revenue: 0,
        count: 0,
      }
    }

    // Accumulate from approved payments
    for (const p of countedRows) {
      const order = p.context?.order
      const plan = plans.find(candidate => candidate.id === order?.planId)
      const planId = order?.planCodeSnapshot || plan?.code || order?.planId || 'UNKNOWN'
      const pName = planName({ name: order?.planNameSnapshot, code: order?.planCodeSnapshot })
      if (planId && breakdown[planId]) {
        breakdown[planId].revenue += Number(p.amount) || 0
        breakdown[planId].count += 1
      } else {
        breakdown[planId] = { id: planId, code: order?.planCodeSnapshot || 'CUSTOM', name: planId === 'UNKNOWN' ? 'Chưa xác định gói' : pName, revenue: Number(p.amount), count: 1 }
      }
    }

    const tiers = sortPlansByTier(Object.values(breakdown))
    if (!periodTotalRevenue) return tiers.map(tier => ({ ...tier, share: 0 }))
    const shares = tiers.map(tier => {
      const exact = tier.revenue / periodTotalRevenue * 100
      return { ...tier, share: Math.floor(exact), fraction: exact % 1 }
    })
    const remaining = 100 - shares.reduce((total, tier) => total + tier.share, 0)
    const remainderOrder = [...shares].sort((a, b) => b.fraction - a.fraction)
    remainderOrder.slice(0, remaining).forEach(tier => { tier.share++ })
    return shares
  })()

  return { paymentsResource, plansResource, loading, filteredPayments, realRevenue, simulatedRevenue, countedPayments, planTiers, periodTotalRevenue }
}
