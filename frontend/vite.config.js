import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, import.meta.dirname, 'DEV_')
  const upstream = (target) => ({ target, changeOrigin: true })
  const identity = env.DEV_IDENTITY_TARGET || 'http://localhost:8081'
  const bakery = env.DEV_BAKERY_TARGET || 'http://localhost:8082'
  const subscription = env.DEV_SUBSCRIPTION_TARGET || 'http://localhost:8084'
  const order = env.DEV_ORDER_TARGET || 'http://localhost:8086'
  const chat = env.DEV_CHAT_TARGET || 'http://localhost:8087'
  const marketplace = env.DEV_MARKETPLACE_TARGET || 'http://localhost:8083'
  const cakeAi = env.DEV_CAKE_AI_TARGET || 'http://localhost:8085'

  const proxy = {
    '^/api/v1/bakeries/[^/?]+/(?:subscription|subscription-orders)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/admin/(?:subscription-plans|bakery-payments)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/admin/bakeries(?:/|\\?|$)': upstream(bakery),
    '^/api/v1/admin/reviews(?:/|\\?|$)': upstream(order),
    '^/api/v1/admin/generated-designs(?:/|\\?|$)': upstream(cakeAi),
    '^/api/v1/(?:cake-requests|offers)(?:/|\\?|$)': upstream(marketplace),
    '^/api/v1/(?:generation-jobs|generated-designs)(?:/|\\?|$)': upstream(cakeAi),
    '^/api/v1/auth(?:/|\\?|$)': upstream(identity),
    '^/api/v1/(?:subscription-plans|subscription-orders)(?:/|\\?|$)': upstream(subscription),
    '^/api/v1/(?:bakeries|products)(?:/|\\?|$)': upstream(bakery),
    '^/api/v1/orders(?:/|\\?|$)': upstream(order),
    '^/api/v1/conversations(?:/|\\?|$)': upstream(chat),
  }
  const routes = Object.keys(proxy).map((pattern) => new RegExp(pattern))

  return {
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
