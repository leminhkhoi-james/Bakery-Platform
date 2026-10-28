// Read the existing graph only after its corresponding collections have fallen back.
// No seed, cache or second copy of business state is maintained here.
export function dashboardSupplement(runtime, user, collections) {
  if (!runtime || !user?.roles?.includes('ADMIN')) return {}
  if (!['bakeries', 'orders', 'users', 'payments'].every((key) => collections[key]?.state === 'ready' && collections[key]?.source === 'demo')) return {}
  runtime.store.requireUser(user, 'ADMIN')
  const state = runtime.store.state
  return {
    ...Object.fromEntries(['products', 'requests', 'offers', 'designs'].map((key) => [key, { state: 'ready', source: 'demo', rows: structuredClone(state[key] || []) }])),
    reviews: { state: 'ready', source: 'demo', rows: state.orders.filter((order) => order.review).map((order) => structuredClone({ ...order.review, id: order.id, orderId: order.id })) },
  }
}
