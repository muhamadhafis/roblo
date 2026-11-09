import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6444";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  },
  lazyConnect: true,
});
