import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "@/lib/redis";

type LimiterType = "login" | "register" | "api";

const limiterConfig: Record<LimiterType, { tokens: number; window: `${number} m` | `${number} h` }> = {
  login: { tokens: 5, window: "15 m" },
  register: { tokens: 3, window: "1 h" },
  api: { tokens: 100, window: "1 m" },
};

const limiters = new Map<LimiterType, Ratelimit | null>();

function getRateLimiter(type: LimiterType) {
  if (limiters.has(type)) {
    return limiters.get(type) ?? null;
  }

  const redis = getRedisClient();
  if (!redis) {
    limiters.set(type, null);
    return null;
  }

  const config = limiterConfig[type];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.tokens, config.window),
    analytics: true,
    prefix: "gta-ratelimit",
  });

  limiters.set(type, limiter);
  return limiter;
}

export async function checkRateLimit(
  type: LimiterType,
  identifier: string,
) {
  const limiter = getRateLimiter(type);
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  return limiter.limit(identifier);
}
