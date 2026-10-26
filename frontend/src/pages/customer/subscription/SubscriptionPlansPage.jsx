import React, { useState } from 'react'
import { useCatalogResource } from '../../../hooks/useCatalogResource.js'
import { loadSubscriptionPlans, subscriptionService } from '../../../services/subscriptionService.js'
import { PlanCards, ResourceState } from '../../../components/subscription/SubscriptionView.jsx'
const loadPlan = ({ id }, options) => subscriptionService.getPlan(id, options)
function PlanDetail({ id }) {
  const resource = useCatalogResource(loadPlan, { id })
  return <section className="mt-6 space-y-3 rounded-2xl border border-outline-variant/30 p-5"><h2 className="font-bold">Chi tiết gói từ backend</h2><ResourceState resource={resource}>{resource.data && <PlanCards plans={[resource.data]} />}</ResourceState><button className="underline" onClick={resource.reload}>Tải lại chi tiết gói</button></section>
}
export default function SubscriptionPlansPage({ onNavigate }) {
  const plans = useCatalogResource(loadSubscriptionPlans), [selected, setSelected] = useState(null)
  return <main className="sc-customer mx-auto max-w-7xl space-y-6 px-5 py-8"><div className="sc-customer-heading"><p className="sc-kicker">Đồng hành cùng tiệm bánh</p><h1 className="mb-3 font-serif text-3xl font-semibold text-primary">Gói dịch vụ cho tiệm bánh</h1><p className="text-sm text-on-surface-variant">Giá và tính năng được cập nhật từ hệ thống. Thanh toán cần được quản trị viên xác nhận.</p></div><ResourceState resource={plans}><PlanCards plans={plans.data} /><div className="mt-4 flex flex-wrap gap-3">{plans.data?.map((plan) => <button key={plan.id} className="rounded-xl border px-4 py-2" onClick={() => setSelected(plan.id)}>Chi tiết {plan.name || plan.code || plan.id}</button>)}</div></ResourceState>{selected && <PlanDetail key={selected} id={selected} />}<button className="mt-8 rounded-xl bg-primary px-6 py-3 text-on-primary" onClick={() => onNavigate('vendor-subscription')}>Quản lý gói của cửa hàng</button></main>
}

