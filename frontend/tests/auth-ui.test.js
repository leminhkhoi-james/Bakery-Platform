import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let vite, AuthGuard, AuthContext, AuthPage
before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'error' })
  ;({ default: AuthGuard } = await vite.ssrLoadModule('/src/routes/AuthGuard.jsx'))
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/useAuth.js'))
  ;({ default: AuthPage } = await vite.ssrLoadModule('/src/pages/auth/AuthPage.jsx'))
})
after(async () => { await vite?.close() })

function renderGuard(session, page = 'profile') {
  return renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: session },
    React.createElement(AuthGuard, { page, onNavigate() {} },
      React.createElement('span', null, 'protected-content'))))
}

test('Anonymous or restoring sessions never render protected page content', () => {
  assert.equal(renderGuard({ status: 'anonymous', user: null }), '')
  const loading = renderGuard({ status: 'loading', user: null })
  assert.match(loading, /role="status"/)
  assert.doesNotMatch(loading, /protected-content/)
})

test('Admin guard refuses CUSTOMER and renders content only for ADMIN', () => {
  const denied = renderGuard({ status: 'authenticated', user: { roles: ['CUSTOMER'] } }, 'admin-dashboard')
  assert.match(denied, /Bạn không có quyền/)
  assert.doesNotMatch(denied, /protected-content/)
  assert.match(renderGuard({ status: 'authenticated', user: { roles: ['ADMIN'] } }, 'admin-dashboard'), /protected-content/)
})

test('Restoration failure displays a retry action without exposing protected content', () => {
  const error = renderGuard({ status: 'error', user: null, error: new Error('Backend unavailable') })
  assert.match(error, /Chưa thể thực hiện thao tác/)
  assert.match(error, /Thử lại/)
  assert.doesNotMatch(error, /protected-content/)
})

test('Login form retains its design classes and uses email/password with real session errors', () => {
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, {
    value: { error: new Error('Identity unavailable'), login() {}, register() {} },
  }, React.createElement(AuthPage)))
  assert.match(html, /type="email"/)
  assert.match(html, /autocomplete="current-password"/i)
  assert.match(html, /Identity unavailable/)
  assert.match(html, /bg-primary-container/)
  assert.doesNotMatch(html, /CUST-DEMO/)
})
