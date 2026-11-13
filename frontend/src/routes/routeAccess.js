export function requiredRoles(page) {
  if (page.startsWith('admin-')) return ['ADMIN']
  if (page.startsWith('vendor-')) return ['BAKERY_OWNER']
  if (['payment', 'ai-studio', 'bidding', 'baker-quote', 'rfqs', 'rfq-new', 'request-detail'].includes(page)) return ['CUSTOMER']
  if (['profile', 'tracking', 'chat'].includes(page)) return []
  return null
}

export function canAccess(page, user) {
  const roles = requiredRoles(page)
  return roles === null || Boolean(user && (roles.length === 0 || roles.some((role) => user.roles.includes(role))))
}
