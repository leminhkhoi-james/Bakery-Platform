import { planName, resolvePlanTier } from '../../services/planPresentation.js'

export default function PlanTierBadge({ name, code }) {
  const plan = { name, code }
  const tier = resolvePlanTier(plan)
  return <span className="sc-plan-tier-badge" data-tier={tier?.code}>{planName(plan)}</span>
}
