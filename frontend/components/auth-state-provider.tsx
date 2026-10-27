"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  authFetch,
  getAuthRevision,
  subscribeAuthTransitions,
  type AuthUser,
} from "@/lib/auth-client";

type AuthState = {
  profile: AuthUser | null;
  transitionRevision: number;
};

const AuthStateContext = createContext<AuthState>({
  profile: null,
  transitionRevision: 0,
});

async function loadProfile(signal: AbortSignal): Promise<AuthUser | null> {
  const response = await authFetch(
    "/api/backend/userManagementRouter/profile",
    { cache: "no-store", signal },
  );

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to load your profile.");

  const body = (await response.json()) as { data?: AuthUser };
  return body.data ?? null;
}

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [transitionRevision, setTransitionRevision] = useState(getAuthRevision);
  const requestSequence = useRef(0);

  useEffect(() => {
    let active = true;
    let controller = new AbortController();

    const revalidate = (revision: number) => {
      controller.abort();
      controller = new AbortController();
      const sequence = ++requestSequence.current;
      setProfile(null);
      setTransitionRevision(revision);

      loadProfile(controller.signal)
        .then((nextProfile) => {
          if (active && sequence === requestSequence.current) {
            setProfile(nextProfile);
          }
        })
        .catch((error: unknown) => {
          if (
            active &&
            sequence === requestSequence.current &&
            !(error instanceof DOMException && error.name === "AbortError")
          ) {
            setProfile(null);
          }
        });
    };

    revalidate(getAuthRevision());
    const unsubscribe = subscribeAuthTransitions(revalidate);

    return () => {
      active = false;
      controller.abort();
      unsubscribe();
    };
  }, []);

  return (
    <AuthStateContext.Provider value={{ profile, transitionRevision }}>
      <Fragment key={transitionRevision}>{children}</Fragment>
    </AuthStateContext.Provider>
  );
}

export function useAuthState(): AuthState {
  return useContext(AuthStateContext);
}
