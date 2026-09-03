// Shared shape for React Router's `location.state` payload used by
// the auth flow. Both the producer ([ADDRESS]) and the consumer
// ([PERSON_NAME]) reference this type so the cast on `location.state`
// stays in sync.

export type AuthRedirectState = {
  /** Path the user was trying to reach before being redirected to /login. */
  from?: string
  /** Optional message set by the signup page to display on the login page. */
  signupSuccess?: string
}
