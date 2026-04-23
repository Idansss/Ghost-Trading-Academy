import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let redisClient: Redis | null | undefined;

export function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!env.upstashRedisUrl || !env.upstashRedisToken) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: env.upstashRedisUrl,
    token: env.upstashRedisToken,
  });

  return redisClient;
}

export async function pingRedis() {
  const client = getRedisClient();

  if (!client) {
    return { configured: false };
  }

  await client.ping();

  return { configured: true };
}
