import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export async function startAdminOrdersPreview(port = 0) {
  const server = await createServer({ configFile: false, plugins: [react(), tailwindcss(), {
    name: 'admin-orders-fixture', transformIndexHtml: html => html.replace('/src/main.jsx', '/tests/fixtures/admin-orders-preview-entry.jsx'),
  }], server: { host: '127.0.0.1', port, strictPort: Boolean(port), hmr: false } })
  await server.listen()
  return server
}
if (process.argv[1]?.endsWith('admin-orders-preview.mjs')) {
  const server = await startAdminOrdersPreview(5194)
  console.log('Admin orders preview: ' + server.resolvedUrls.local[0])
}
