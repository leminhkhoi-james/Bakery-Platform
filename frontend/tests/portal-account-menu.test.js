import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'

let vite, Menu
before(async () => {
  vite = await createServer({ logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, plugins: [{ name: 'account-menu-events', enforce: 'pre', load(id) {
    if (id.replaceAll('\\', '/').endsWith('/src/context/useAuth.js')) return 'export function useAuth(){return globalThis.__accountAuth}'
  }, transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/PortalAccountMenu.jsx')) return code.replace("import React, { useEffect, useId, useRef, useState } from 'react'", "import React from 'react'; const useState=(v)=>globalThis.__accountState(v),useRef=(v)=>globalThis.__accountState(()=>({current:v}))[0],useId=()=>':menu:',useEffect=()=>{}")
  } }] })
  Menu = (await vite.ssrLoadModule('/src/components/common/PortalAccountMenu.jsx')).default
})
after(async () => { await vite?.close(); delete globalThis.__accountAuth; delete globalThis.__accountState })
const nodes = (tree) => Array.isArray(tree) ? tree.flatMap(nodes) : tree?.props ? [tree, ...nodes(tree.props.children)] : []
function harness(props, logout) {
  let cursor = 0; const state = []
  globalThis.__accountAuth = { logout }
  globalThis.__accountState = (initial) => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], (value) => { state[i] = typeof value === 'function' ? value(state[i]) : value }] }
  return () => { cursor = 0; return Menu(props) }
}

test('Admin and Owner menu calls existing logout once and replaces navigation with login', async () => {
  for (const roleLabel of ['Admin', 'Chủ tiệm']) {
    let calls = 0, finish; const routes = []
    const render = harness({ user: { id: roleLabel, displayName: 'Tên tài khoản' }, roleLabel, onNavigate: (...args) => routes.push(args) }, () => { calls++; return new Promise((resolve) => { finish = resolve }) })
    nodes(render()).find((node) => node.props['aria-haspopup'] === 'menu').props.onClick()
    const item = nodes(render()).find((node) => node.props.role === 'menuitem')
    const pending = item.props.onClick(); await item.props.onClick()
    assert.equal(calls, 1)
    assert.ok(!nodes(render()).some((node) => node.props.role === 'menu'))
    assert.equal(nodes(render()).find((node) => node.props['aria-haspopup'] === 'menu').props.disabled, true)
    finish(); await pending
    assert.deepEqual(routes, [['login', null, { replace: true }]])
  }
})

test('Logout revocation failure still returns to login through existing local sign-out semantics', async () => {
  const routes = []
  const render = harness({ user: { displayName: 'Chủ tiệm' }, roleLabel: 'Chủ tiệm', onNavigate: (...args) => routes.push(args) }, async () => { throw new Error('offline') })
  nodes(render()).find((node) => node.props['aria-haspopup'] === 'menu').props.onClick()
  await nodes(render()).find((node) => node.props.role === 'menuitem').props.onClick()
  assert.deepEqual(routes, [['login', null, { replace: true }]])
})
