import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Product photos and catalogue files are stored in ./static and served at /static. Their
// public links start with BACKEND_PUBLIC_URL, so a server (staging or the shop) hands out
// its own address instead of localhost.
const backendPublicUrl = (process.env.BACKEND_PUBLIC_URL || "http://localhost:9000").replace(/\/$/, "")

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: { backend_url: `${backendPublicUrl}/static` },
          },
        ],
      },
    },
    // Fiscal receipts: one per order, never two (src/modules/fiscal-receipt).
    { resolve: "./src/modules/fiscal-receipt" },
  ],
})
