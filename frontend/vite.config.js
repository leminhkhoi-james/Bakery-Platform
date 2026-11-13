import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {

  const nativeRuntime = process.env.BAKERY_NATIVE_RUNTIME === 'true'
  // The native launcher reads only root .env and exports an explicit public
  // allowlist. Vite must not load a second persistent configuration bundle.
  const env = nativeRuntime ? { DEV_GATEWAY_TARGET: process.env.DEV_GATEWAY_TARGET } : loadEnv(mode, import.meta.dirname, 'DEV_')
  if (nativeRuntime && !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):8080$/.test(env.DEV_GATEWAY_TARGET || '')) {
    throw new Error('Native Frontend requires an explicit loopback Gateway on port 8080')
  }
  const upstream = (target) => ({
    target,
    changeOrigin: true,
    configure(proxyServer) {
      proxyServer.on('error', (_err, _req, res) => {
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({
            statusCode: 502,
            message: 'Upstream development service unavailable',
            data: null,
          }))
        }
      })
    },
  })
  const identity = env.DEV_IDENTITY_TARGET || 'http://localhost:8081'
  const bakery = env.DEV_BAKERY_TARGET || 'http://localhost:8082'
  const subscription = env.DEV_SUBSCRIPTION_TARGET || 'http://localhost:8084'
  const order = env.DEV_ORDER_TARGET || 'http://localhost:8086'
  const chat = env.DEV_CHAT_TARGET || 'http://localhost:8087'
  const marketplace = env.DEV_MARKETPLACE_TARGET || 'http://localhost:8083'
  const cakeAi = env.DEV_CAKE_AI_TARGET || 'http://localhost:8085'

  const proxy = nativeRuntime ? {
    '^/api/v1(?:/|\\?|$)': upstream(env.DEV_GATEWAY_TARGET),
    '^/storage(?:/|\\?|$)': upstream(env.DEV_GATEWAY_TARGET),
  } : {
    '^/api/v1/bakeries/[^/?]+/(?:subscription|subscription-orders)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/admin/(?:subscription-plans|subscription-orders|bakery-payments|vnpay-attempts)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/payments/vnpay/(?:return|ipn)(?:\\?|$)': upstream(subscription),
    '^/api/v1/admin/bakeries(?:/|\\?|$)': upstream(bakery),
    '^/api/v1/admin/reviews(?:/|\\?|$)': upstream(order),
    '^/api/v1/admin/generated-designs(?:/|\\?|$)': upstream(cakeAi),
    '^/api/v1/(?:cake-requests|offers)(?:/|\\?|$)': upstream(marketplace),
    '^/api/v1/(?:generation-jobs|generated-designs)(?:/|\\?|$)': upstream(cakeAi),
    '^/storage(?:/|\\?|$)': upstream(cakeAi),
    '^/api/v1/auth(?:/|\\?|$)': upstream(identity),
    '^/api/v1/users/me(?:/|\\?|$)': upstream(identity),
    '^/api/v1/admin/users(?:/|\\?|$)': upstream(identity),
    '^/api/v1/(?:subscription-plans|subscription-orders)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/(?:bakeries|products)(?:/|\\?|$)': upstream(bakery),
    '^/api/v1/orders(?:/|\\?|$)': upstream(order),
    '^/api/v1/bakery-reviews(?:\\?|$)': upstream(order),
    '^/api/v1/conversations(?:/|\\?|$)': upstream(chat),
  }
  const routes = Object.keys(proxy).map((pattern) => new RegExp(pattern))
  const testEntry = process.argv.find((entry) => /\.test\.[cm]?js$/.test(entry))

  return {
    ...(nativeRuntime ? { envDir: false } : {}),
    cacheDir: testEntry ? 'node_modules/.vite-tests/' + testEntry.split(/[\\/]/).at(-1) : 'node_modules/.vite-dev',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'unmapped-api-routes',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || ''
            if (!/^\/api\/v1(?:\/|\?|$)/.test(url) || routes.some((route) => route.test(url))) {
              return next()
            }

            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({
              statusCode: 404,
              message: 'No development proxy route configured for this API',
              data: null,
            }))
          })
        },
      },
    ],
    server: {
      port: 5173,
      proxy,
    },
  }
})
