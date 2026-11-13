import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const server = await createServer({ configFile: false, plugins: [react(), tailwindcss(), { name: 'isolated-modal-qa', transformIndexHtml(html) { return html.replace('/src/main.jsx', '/tests/fixtures/modal-preview-entry.jsx') } }], server: { host: '127.0.0.1', port: 5189, strictPort: true, hmr: false } })
await server.listen()
console.log('Modal QA on http://127.0.0.1:5189')
