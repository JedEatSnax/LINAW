import { authClient } from "../lib/auth-client"

export function signUpWithEmail(email: string, password: string, name: string) {
  return authClient.signUp.email({ email, password, name })
}
