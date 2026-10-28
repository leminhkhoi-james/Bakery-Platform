import assert from 'node:assert/strict'
import { test } from 'node:test'
import { roleLandingPage, sessionIdentity, sessionRedirect } from '../src/routes/sessionNavigation.js'
import { canAccess } from '../src/routes/routeAccess.js'

const actor = (role, id = role) => ({ id, roles: [role] })
const cases = [['ADMIN', 'admin-dashboard'], ['BAKERY_OWNER', 'vendor-dashboard'], ['CUSTOMER', 'home']]
for (const [role, landing] of cases) {
  test(`${role}: login and account switch enter the permitted workspace once`, () => {
    const user = actor(role)
    assert.equal(roleLandingPage(user), landing)
    assert.equal(sessionRedirect({ page: 'login', status: 'authenticated', user }), landing)
    assert.ok(canAccess(landing, user))
    const old = { status: 'authenticated', identity: sessionIdentity(actor('CUSTOMER', 'old-account')) }
    assert.equal(sessionRedirect({ page: 'explore', status: 'authenticated', user }, old), landing)
    assert.equal(sessionRedirect({ page: landing, status: 'authenticated', user }, { status: 'authenticated', identity: sessionIdentity(user) }), null)
  })
}
test('Refresh and deliberate navigation retain valid pages and their query strings', () => {
  for (const [role, page] of [['ADMIN', 'admin-orders'], ['BAKERY_OWNER', 'vendor-menu'], ['CUSTOMER', 'tracking'], ['ADMIN', 'home']]) {
    const user = actor(role)
    assert.equal(sessionRedirect({ page, status: 'authenticated', user }), null)
    assert.equal(sessionRedirect({ page, status: 'authenticated', user }, { status: 'authenticated', identity: sessionIdentity(user) }), null)
  }
})
test('Restoration never grants privileges or redirects while session is loading/error', () => {
  const user = actor('CUSTOMER')
  assert.equal(sessionRedirect({ page: 'admin-orders', status: 'authenticated', user }), 'home')
  assert.equal(sessionRedirect({ page: 'admin-orders', status: 'anonymous', user: null }), 'login')
  for (const status of ['loading', 'error']) assert.equal(sessionRedirect({ page: 'admin-orders', status, user }), null)
  assert.equal(roleLandingPage(actor('UNRECOGNIZED_ROLE')), 'home')
})
test('Role changes on the same account are detected; role order does not cause redirects', () => {
  const user = { id: 'same', roles: ['CUSTOMER', 'ADMIN'] }
  assert.equal(sessionIdentity(user), sessionIdentity({ ...user, roles: ['ADMIN', 'CUSTOMER'] }))
  assert.equal(sessionRedirect({ page: 'profile', status: 'authenticated', user }, { status: 'authenticated', identity: sessionIdentity(actor('CUSTOMER', 'same')) }), 'admin-dashboard')
})
test('Switching accounts on the landing page still clears the previous account query context', () => {
  const user = actor('BAKERY_OWNER', 'new-owner')
  assert.equal(sessionRedirect({ page: 'vendor-dashboard', status: 'authenticated', user }, { status: 'authenticated', identity: sessionIdentity(actor('BAKERY_OWNER', 'old-owner')) }), 'vendor-dashboard')
})

test('Removed staff role never opens an owner workspace or causes a redirect loop', () => {
  const user = actor('BAKERY_STAFF')
  assert.equal(canAccess('vendor-orders', user), false)
  assert.equal(roleLandingPage(user), 'home')
  assert.equal(sessionRedirect({ page: 'vendor-orders', status: 'authenticated', user }), 'home')
  assert.equal(sessionRedirect({ page: 'home', status: 'authenticated', user }), null)
})
