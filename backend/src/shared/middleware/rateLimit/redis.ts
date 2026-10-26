import { Redis } from "@upstash/redis";

import type { AppEnv } from "../../../config/env.js";

export function createRedis(env: AppEnv): Redis {
  return new Redis({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
  });
}
