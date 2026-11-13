import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const server = await createServer({ configFile: false, envDir: false, cacheDir: 'node_modules/.vite-address-preview', define: { 'import.meta.env.VITE_ENABLE_MOCK_FALLBACK': '"true"', 'import.meta.env.VITE_API_BASE_URL': '"/api/v1"' }, plugins: [react(), tailwindcss(), { name: 'isolated-address-qa', transformIndexHtml(html) { return html.replace('/src/main.jsx', '/tests/fixtures/address-preview-entry.jsx') }, configureServer(vite) { vite.middlewares.use((req, res, next) => { if (!req.url.startsWith('/api/')) return next(); res.writeHead(req.method === 'GET' ? 200 : 500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ data: { result: [], meta: { page: 1, pageSize: 1, pages: 0, total: 0 } } })) }) } }], server: { host: '127.0.0.1', port: 5186, strictPort: true } })
await server.listen()
console.log('Isolated address QA on http://127.0.0.1:5186')
