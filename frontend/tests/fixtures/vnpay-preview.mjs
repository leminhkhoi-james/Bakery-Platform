import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export async function startVnpayPreview(port = 0) {
  const server = await createServer({ configFile: false, plugins: [react(), tailwindcss(), {
    name: 'vnpay-ui-fixture', transformIndexHtml: html => html.replace('/src/main.jsx', '/tests/fixtures/vnpay-preview-entry.jsx'),
  }], server: { host: '127.0.0.1', port, strictPort: Boolean(port), hmr: false } })
  await server.listen()
  return server
}
if (process.argv[1]?.endsWith('vnpay-preview.mjs')) {
  const server = await startVnpayPreview(5193)
  console.log('VNPay test fixture at ' + server.resolvedUrls.local[0])
}
