import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, beforeEach, test } from 'node:test'
import { api, clearAuthSession, getAuthToken, refreshAccessToken, setAuthToken } from '../src/services/apiClient.js'
import { authService } from '../src/services/authService.js'
import { canAccess } from '../src/routes/routeAccess.js'

const originalFetch = globalThis.fetch
const user = { id: randomUUID(), email: 'auth-test@example.invalid', displayName: 'Auth test', roles: ['CUSTOMER'] }
const password = randomUUID()
const token = () => ({ accessToken: randomUUID(), tokenType: 'Bearer', expiresIn: 900 })
const reply = (data, status = 200) => Response.json({ statusCode: status, data, message: 'Test response' }, { status })
const storage = () => {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}
let calls
let handler
beforeEach(() => {
  clearAuthSession()
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()
  calls = []
  handler = () => { throw new Error('Unexpected request') }
  globalThis.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include')
    calls.push({ url, options })
    return handler(url, options)
  }
})
after(() => { globalThis.fetch = originalFetch })

test('Login uses Identity profile and Bearer token without persisting JWTs', async () => {
  const issued = token()
  localStorage.setItem('sweetcake_access_token', 'legacy-demo')
  handler = (url, options) => {
    if (url.endsWith('/login')) {
      assert.equal(options.headers.has('Authorization'), false)
      return reply(issued)
    }
    assert.equal(options.headers.get('Authorization'), 'Bearer ' + issued.accessToken)
    return reply(user)
  }
  assert.deepEqual(await authService.login(user.email, password), user)
  assert.equal(authService.getSnapshot().status, 'authenticated')
  assert.equal(localStorage.getItem('sweetcake_access_token'), null)
})

test('Invalid login returns 401 without demo user or refresh retry', async () => {
  handler = () => reply(null, 401)
  await assert.rejects(authService.login(user.email, password), { status: 401 })
  assert.equal(calls.length, 1)
  assert.equal(authService.getSnapshot().user, null)
  assert.equal(getAuthToken(), '')
})

test('Backend 503 on login is exposed without demo fallback', async () => {
  handler = () => reply(null, 503)
  await assert.rejects(authService.login(user.email, password), { status: 503 })
  assert.equal(calls.length, 1)
  assert.equal(authService.getSnapshot().user, null)
})

test('An absent refresh cookie is an anonymous session rather than a mock identity', async () => {
  handler = () => reply(null, 401)
  assert.equal(await authService.restoreSession(), null)
  assert.equal(authService.getSnapshot().status, 'anonymous')
  assert.equal(authService.getSnapshot().error, null)
})

test('Registration returns a profile without creating an authenticated session', async () => {
  handler = () => reply(user, 201)
  assert.deepEqual(await authService.register({ email: user.email, password, displayName: user.displayName }), user)
  assert.equal(calls.length, 1)
  assert.equal(authService.getSnapshot().user, null)
  assert.equal(getAuthToken(), '')
})

test('Concurrent restoration shares one cookie rotation and loads /me once', async () => {
  handler = (url) => reply(url.endsWith('/refresh') ? token() : user)
  const first = authService.restoreSession()
  const second = authService.restoreSession()
  assert.equal(first, second)
  assert.deepEqual(await first, user)
  assert.equal(calls.filter((call) => call.url.endsWith('/refresh')).length, 1)
  assert.equal(calls.filter((call) => call.url.endsWith('/me')).length, 1)
})

test('Expired access token refreshes and retries the original request once', async () => {
  const old = token(), fresh = token()
  setAuthToken(old.accessToken)
  handler = (url, options) => {
    if (url.endsWith('/refresh')) return reply(fresh)
    return options.headers.get('Authorization') === 'Bearer ' + fresh.accessToken ? reply(user) : reply(null, 401)
  }
  assert.deepEqual(await api.get('/auth/me'), user)
  assert.equal(calls.length, 3)
  assert.equal(getAuthToken(), fresh.accessToken)
})

test('Concurrent 401 responses share a single refresh', async () => {
  const old = token(), fresh = token()
  setAuthToken(old.accessToken)
  handler = async (url, options) => {
    if (url.endsWith('/refresh')) {
      await new Promise((resolve) => setImmediate(resolve))
      return reply(fresh)
    }
    return options.headers.get('Authorization') === 'Bearer ' + fresh.accessToken ? reply(user) : reply(null, 401)
  }
  await Promise.all([api.get('/auth/me'), api.get('/auth/me'), api.get('/auth/me')])
  assert.equal(calls.filter((call) => call.url.endsWith('/refresh')).length, 1)
})

test('Rejected refresh clears authentication and never loops', async () => {
  setAuthToken(token().accessToken)
  handler = () => reply(null, 401)
  await assert.rejects(api.get('/auth/me'), { status: 401 })
  assert.equal(calls.length, 2)
  assert.equal(authService.getSnapshot().user, null)
  assert.equal(getAuthToken(), '')
})

test('401 after refresh is not retried again', async () => {
  setAuthToken(token().accessToken)
  handler = (url) => url.endsWith('/refresh') ? reply(token()) : reply(null, 401)
  await assert.rejects(api.get('/auth/me'), { status: 401 })
  assert.equal(calls.length, 3)
  assert.equal(getAuthToken(), '')
})

test('Forbidden response does not refresh or erase a valid token', async () => {
  const issued = token()
  setAuthToken(issued.accessToken)
  handler = () => reply(null, 403)
  await assert.rejects(api.get('/auth/me'), { status: 403 })
  assert.equal(calls.length, 1)
  assert.equal(getAuthToken(), issued.accessToken)
})

test('Offline login reports a network error without cached/demo identities', async () => {
  handler = () => { throw new TypeError('offline') }
  await assert.rejects(authService.login(user.email, password), { status: 0 })
  assert.equal(authService.getSnapshot().user, null)
  assert.equal(localStorage.getItem('sweetcake_current_user'), null)
})

test('Offline restoration has an explicit error state rather than a fake user', async () => {
  handler = () => { throw new TypeError('offline') }
  assert.equal(await authService.restoreSession(), null)
  assert.equal(authService.getSnapshot().status, 'error')
  assert.equal(authService.getSnapshot().user, null)
})

test('Logout refreshes its authorization, revokes cookie session, and blocks protected routes', async () => {
  const issued = token()
  handler = (url, options) => {
    if (url.endsWith('/refresh')) return reply(issued)
    assert.equal(url, '/api/v1/auth/logout')
    assert.equal(options.headers.get('Authorization'), 'Bearer ' + issued.accessToken)
    return reply(null)
  }
  await authService.logout()
  assert.equal(calls.length, 2)
  assert.equal(getAuthToken(), '')
  assert.equal(authService.getSnapshot().user, null)
  assert.equal(canAccess('profile', authService.getSnapshot().user), false)
})

test('A late refresh cannot recreate a cleared session', async () => {
  let finish, started
  const ready = new Promise((resolve) => { started = resolve })
  handler = () => new Promise((resolve) => { finish = resolve; started() })
  const pending = refreshAccessToken()
  await ready
  clearAuthSession()
  finish(reply(token()))
  await assert.rejects(pending, { status: 401 })
  assert.equal(getAuthToken(), '')
})

test('Failed logout stays locally signed out and retries revocation on reload', async () => {
  handler = () => { throw new TypeError('offline') }
  await assert.rejects(authService.logout(), { status: 0 })
  assert.equal(sessionStorage.getItem('sweetcake_logout_pending'), 'true')
  assert.equal(authService.getSnapshot().user, null)
  calls = []
  handler = (url) => reply(url.endsWith('/refresh') ? token() : null)
  await authService.restoreSession()
  assert.deepEqual(calls.map((call) => call.url), ['/api/v1/auth/refresh', '/api/v1/auth/logout'])
  assert.equal(sessionStorage.getItem('sweetcake_logout_pending'), null)
  assert.equal(authService.getSnapshot().status, 'anonymous')
})

test('Route roles come from the backend profile, not demo navigation', () => {
  assert.equal(canAccess('home', null), true)
  assert.equal(canAccess('profile', null), false)
  assert.equal(canAccess('profile', user), true)
  assert.equal(canAccess('admin-dashboard', user), false)
  assert.equal(canAccess('vendor-menu', user), false)
  assert.equal(canAccess('admin-dashboard', { roles: ['ADMIN'] }), true)
  assert.equal(canAccess('vendor-menu', { roles: ['BAKERY_OWNER'] }), true)
  assert.equal(canAccess('payment', { roles: ['BAKERY_OWNER'] }), false)
})
