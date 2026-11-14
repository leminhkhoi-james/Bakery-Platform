import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadCustomerNotifications } from '../src/services/customerNotifications.js'
import { rfqService } from '../src/services/rfqService.js'
import { orderService } from '../src/services/orderService.js'
import { onboardingService } from '../src/services/onboardingService.js'

test('customer notifications use real data, skip expired offers and retain healthy sources', async t => {
  t.mock.method(rfqService, 'getOffers', async (params, options) => {
    assert.equal(params.scope, 'received')
    assert.equal(options.allowMockFallback, false)
    return { result: [
      { id: 'live', expiresAt: '2099-01-01', createdAt: '2026-11-13' },
      { id: 'expired', expiresAt: '2000-01-01' },
    ] }
  })
  t.mock.method(orderService, 'getOrders', async () => { throw new Error('Unavailable') })
  t.mock.method(onboardingService, 'get', async () => ({ id: 'shop', status: 'ACTIVE' }))

  const { items, incomplete } = await loadCustomerNotifications({ enabled: true })
  assert.equal(incomplete, true)
  assert.deepEqual(items.map(item => item.route), ['baker-quote?id=live', 'subscription-plans?tracking=1'])
  assert.deepEqual(await loadCustomerNotifications({ enabled: false }), { items: [], incomplete: false })
})
