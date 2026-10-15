import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

const authURL = process.env["NEXT_PUBLIC_BETTER_AUTH_URL"];

export const authClient = createAuthClient({
  baseURL: authURL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [jwtClient()],
});
