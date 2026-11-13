import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoStore } from '../src/mockData/store.js'
import { createDemoTransport } from '../src/mockData/transport.js'
import { demoId } from '../src/mockData/seed.js'

function fixture() {
  const admin = { id: 'aa000000-0000-4000-8000-000000000003', roles: ['ADMIN'] }, store = createDemoStore()
  let writes = 0
  const runtime = createDemoTransport({ store, getUser: () => admin, fetch: async () => { writes++; throw Error('Unexpected upstream write') } })
  store.bind(admin)
  return { store, writes: () => writes, call: (path, method, body) => runtime.fetch('/api/v1' + path, { method, body: body ? JSON.stringify(body) : undefined }) }
}
test('Approving a renewal schedules after the existing paid period and clamps calendar month end', async () => {
  const app = fixture(), payment = app.store.state.payments[0], order = app.store.state.subscriptionOrders.find((row) => row.id === payment.subscriptionOrderId)
  const year = new Date().getUTCFullYear() + 1, start = new Date(Date.UTC(year, 0, 31, 10)).toISOString()
  app.store.state.subscriptions.push({ id: demoId(99990), bakeryId: order.bakeryId, status: 'ACTIVE', periodEnd: start })
  order.billingPeriodMonths = 1
  const response = await app.call('/admin/bakery-payments/' + payment.id + '/approve', 'POST', { reviewNote: null })
  assert.equal(response.status, 200)
  const result = (await response.json()).data
  assert.equal(result.subscription.status, 'SCHEDULED'); assert.equal(result.subscription.periodStart, start)
  const end = new Date(result.subscription.periodEnd), lastDay = new Date(Date.UTC(year, 2, 0)).getUTCDate()
  assert.equal(end.getUTCMonth(), 1); assert.equal(end.getUTCDate(), lastDay); assert.equal(end.getUTCHours(), 10)
  assert.equal(result.subscription.sourceOrderId, order.id)
  assert.deepEqual(result.subscription.featuresSnapshot, order.featuresSnapshot)
  assert.equal(app.writes(), 0)
})
test('User mock updates preserve roles, reject duplicate email, protect administrators and do not affect linked data', async () => {
  const app = fixture(), user = app.store.state.users.find((row) => row.id === demoId(60000)), admin = { ...app.store.state.users.find((row) => row.roles.includes('ADMIN')), id: demoId(99001) }
  app.store.state.users.push(admin)
  assert.equal((await app.call('/admin/users/' + admin.id, 'DELETE')).status, 403)
  assert.equal((await app.call('/admin/users/' + user.id, 'PATCH', { email: app.store.state.users[0].email })).status, 409)
  const response = await app.call('/admin/users/' + user.id, 'PATCH', { status: 'SUSPENDED', roles: ['ADMIN'] })
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).data.roles, ['CUSTOMER'])
  const owner = app.store.state.users.find((row) => row.roles.includes('BAKERY_OWNER'))
  assert.equal((await app.call('/admin/users/' + owner.id, 'DELETE')).status, 409)
  assert.equal(app.writes(), 0)
})
