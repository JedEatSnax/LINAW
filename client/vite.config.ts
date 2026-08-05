import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Server options only affects Vite dev server, not production
  // https://vite.dev/config/server-options
  server: {
    // Refer to `public/_headers` for Cloudflare Pages header definition
    // https://developers.cloudflare.com/pages/configuration/headers/
    headers: {
      "Strict-Transport-Security": "max-age=86400; includeSubDomains",
      "X-XSS-Protection": "1; mode=block",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' https://linaw.tech https://*.linaw.tech",
    },
  },
})
