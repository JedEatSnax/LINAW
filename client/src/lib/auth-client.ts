import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: import.meta.env["VITE_BETTER_AUTH_URL"],
  fetchOptions: {
    credentials: "include",
  },
  plugins: [jwtClient()],
})
