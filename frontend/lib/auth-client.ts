const AUTH_TRANSITION_LOCK = "linaw-auth-transition";
const AUTH_REVISION_KEY = "linaw-auth-revision";
const AUTH_TRANSITION_EVENT = "linaw-auth-transition";

export type AuthUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  status: string;
  company_name: string | null;
};

export class AuthCoordinationError extends Error {
  constructor(message = "Authentication coordination is unavailable.") {
    super(message);
    this.name = "AuthCoordinationError";
  }
}

function requireLocks(): LockManager {
  if (typeof navigator === "undefined" || !navigator.locks) {
    throw new AuthCoordinationError();
  }

  return navigator.locks;
}

async function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  const locks = requireLocks();
  return locks.request(AUTH_TRANSITION_LOCK, { mode: "exclusive" }, operation);
}

function normalizedRevision(value: string | null): number {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

export function getAuthRevision(): number {
  try {
    return normalizedRevision(window.localStorage.getItem(AUTH_REVISION_KEY));
  } catch {
    return 0;
  }
}

export function markAuthTransition(): void {
  let nextRevision = getAuthRevision() + 1;
  try {
    window.localStorage.setItem(AUTH_REVISION_KEY, String(nextRevision));
  } catch {
    // The lock still serializes operations when coordination metadata is unavailable.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_TRANSITION_EVENT, {
      detail: nextRevision,
    }));
  }
}

export function subscribeAuthTransitions(
  listener: (revision: number) => void,
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_REVISION_KEY) listener(normalizedRevision(event.newValue));
  };
  const onTransition = (event: Event) => {
    const revision = (event as CustomEvent<number>).detail;
    listener(normalizedRevision(String(revision)));
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_TRANSITION_EVENT, onTransition);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_TRANSITION_EVENT, onTransition);
  };
}

async function refreshAuthenticationSession(): Promise<void> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthCoordinationError(
      "Your session could not be refreshed. Please sign in again.",
    );
  }

  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
  } | null;

  if (body?.success !== true) {
    throw new AuthCoordinationError(
      "Your session could not be refreshed. Please sign in again.",
    );
  }
}

export async function runAuthTransition<T>(
  operation: () => Promise<T>,
): Promise<T> {
  return withAuthLock(operation);
}

export async function refreshWithAuthTransition(): Promise<void> {
  await withAuthLock(async () => {
    await refreshAuthenticationSession();
    markAuthTransition();
  });
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: { retryOnUnauthorized?: boolean } = {},
): Promise<Response> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const response = await fetch(input, init);

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response;
  }

  const body = init?.body;
  const isStreamBody =
    typeof ReadableStream !== "undefined" && body instanceof ReadableStream;
  if (isStreamBody || (input instanceof Request && input.body !== null)) {
    return response;
  }

  const observedRevision = getAuthRevision();
  await withAuthLock(async () => {
    if (getAuthRevision() === observedRevision) {
      await refreshAuthenticationSession();
      markAuthTransition();
    }
  });
  return fetch(input, init);
}
