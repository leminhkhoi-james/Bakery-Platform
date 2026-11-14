import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from '../vite.config.js'

test('Native mode disables secondary dotenv loading and forwards all public APIs through Gateway', () => {
  const before = { flag: process.env.BAKERY_NATIVE_RUNTIME, target: process.env.DEV_GATEWAY_TARGET }
  try {
    process.env.BAKERY_NATIVE_RUNTIME = 'true'
    process.env.DEV_GATEWAY_TARGET = 'http://127.0.0.1:8080'
    const result = config({ mode: 'development' })
    assert.equal(result.envDir, false)
    for (const route of ['/api/v1/bakery-reviews?bakeryId=fixture', '/api/v1/auth/refresh',
      '/api/v1/conversations/id/messages', '/api/v1/subscription-orders/id/payments']) {
      const match = Object.entries(result.server.proxy).find(([pattern]) => new RegExp(pattern).test(route))
      assert.equal(match?.[1].target, process.env.DEV_GATEWAY_TARGET)
    }
    assert.equal(Object.keys(result.server.proxy).some(pattern => new RegExp(pattern).test('/internal/v1/orders/id/context')), false)
    process.env.DEV_GATEWAY_TARGET = 'http://unapproved.example:8080'
    assert.throws(() => config({ mode: 'development' }), /loopback Gateway/)
  } finally {
    if (before.flag === undefined) delete process.env.BAKERY_NATIVE_RUNTIME
    else process.env.BAKERY_NATIVE_RUNTIME = before.flag
    if (before.target === undefined) delete process.env.DEV_GATEWAY_TARGET
    else process.env.DEV_GATEWAY_TARGET = before.target
  }
})
