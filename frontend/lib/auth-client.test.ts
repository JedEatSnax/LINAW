// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthCoordinationError,
  authFetch,
  getAuthRevision,
  runAuthTransition,
  subscribeAuthTransitions,
} from "./auth-client";

function createLockManager() {
  let tail = Promise.resolve();

  return {
    request: async (_name, _options, callback) => {
      const previous = tail;
      let release;
      tail = new Promise((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await callback();
      } finally {
        release();
      }
    },
  };
}

function installBrowserMocks() {
  const values = new Map();
  const listeners = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  vi.stubGlobal("window", {
    localStorage,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
    dispatchEvent: (event) => listeners.get(event.type)?.(event),
  });
  vi.stubGlobal("navigator", { locks: createLockManager() });
  return { values, listeners };
}

describe("auth client coordination", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    installBrowserMocks();
  });

  it("serializes transitions across callers", async () => {
    let releaseFirst;
    let firstStarted = false;
    let secondStarted = false;

    const first = runAuthTransition(async () => {
      firstStarted = true;
      await new Promise((resolve) => {
        releaseFirst = resolve;
      });
    });
    const second = runAuthTransition(async () => {
      secondStarted = true;
    });

    await Promise.resolve();
    expect(firstStarted).toBe(true);
    expect(secondStarted).toBe(false);

    releaseFirst();
    await Promise.all([first, second]);
    expect(secondStarted).toBe(true);
  });

  it("shares one refresh across concurrent unauthorized requests", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("first retry", { status: 200 }))
      .mockResolvedValueOnce(new Response("second retry", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      authFetch("/api/backend/first"),
      authFetch("/api/backend/second"),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls.filter(([input]) => input === "/api/auth/refresh"),
    ).toHaveLength(1);
  });

  it("keeps login behind an in-flight refresh transition", async () => {
    let releaseRefresh;
    let loginStarted = false;
    const refreshResponse = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const fetchMock = vi.fn().mockImplementation((input) => {
      if (input === "/api/backend/data") {
        return fetchMock.mock.calls.filter(
          ([calledInput]) => calledInput === "/api/backend/data",
        ).length === 1
          ? Promise.resolve(new Response(null, { status: 401 }))
          : Promise.resolve(new Response("retried", { status: 200 }));
      }
      if (input === "/api/auth/refresh") return refreshResponse;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const refresh = authFetch("/api/backend/data");
    await Promise.resolve();
    const login = runAuthTransition(async () => {
      loginStarted = true;
      await fetch("/api/auth/login", { method: "POST" });
    });

    await Promise.resolve();
    expect(loginStarted).toBe(false);

    releaseRefresh(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await Promise.all([refresh, login]);
    expect(loginStarted).toBe(true);
  });

  it("keeps logout behind an in-flight refresh transition", async () => {
    let releaseRefresh;
    let logoutStarted = false;
    const refreshResponse = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const fetchMock = vi.fn().mockImplementation((input) => {
      if (input === "/api/backend/data") {
        return Promise.resolve(new Response(null, { status: 401 }));
      }
      if (input === "/api/auth/refresh") return refreshResponse;
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const refresh = authFetch("/api/backend/data");
    await Promise.resolve();
    const logout = runAuthTransition(async () => {
      logoutStarted = true;
      await fetch("/api/auth/logout", { method: "POST" });
    });

    await Promise.resolve();
    expect(logoutStarted).toBe(false);

    releaseRefresh(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await Promise.all([refresh, logout]);
    expect(logoutStarted).toBe(true);
  });

  it("does not retry an authenticated request after refresh failure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authFetch("/api/backend/data")).rejects.toBeInstanceOf(
      AuthCoordinationError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed when Web Locks are unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(runAuthTransition(async () => undefined)).rejects.toBeInstanceOf(
      AuthCoordinationError,
    );
  });

  it("normalizes malformed revision metadata", () => {
    const { values } = installBrowserMocks();
    values.set("linaw-auth-revision", "NaN");

    expect(getAuthRevision()).toBe(0);
  });

  it("delivers one notification per completed transition", () => {
    const { listeners } = installBrowserMocks();
    const revisions: number[] = [];
    const unsubscribe = subscribeAuthTransitions((revision) => {
      revisions.push(revision);
    });

    window.dispatchEvent(new CustomEvent("linaw-auth-transition", { detail: 1 }));
    window.dispatchEvent(new CustomEvent("linaw-auth-transition", { detail: 2 }));
    unsubscribe();
    window.dispatchEvent(new CustomEvent("linaw-auth-transition", { detail: 3 }));

    expect(revisions).toEqual([1, 2]);
    expect(listeners.has("linaw-auth-transition")).toBe(false);
  });
});
