export type RateLimitContext = {
  userId: string;
  sessionId: string;
  ip: string;
  endpoint: string;
};

export type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
    }
  | {
      allowed: false;
      remaining: 0;
      retryAfter: number;
      reason: "session" | "user" | "ip";
    };
