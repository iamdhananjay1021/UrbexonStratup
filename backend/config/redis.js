/**
 * redis.js — Redis client with graceful fallback
 * If Redis is down, falls back to in-memory node-cache silently
 */
import Redis from "ioredis";

let redisClient = null;
let redisAvailable = false;

export const connectRedis = () => {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.log("ℹ️  REDIS_URL not set — using in-memory cache fallback");
        return null;
    }
    try {
        redisClient = new Redis(url, {
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
            lazyConnect: true,
            enableOfflineQueue: false,
        });
        redisClient.on("connect",   () => { redisAvailable = true;  console.log("✅ Redis connected"); });
        redisClient.on("error",     () => { redisAvailable = false; });
        redisClient.on("close",     () => { redisAvailable = false; });
        redisClient.connect().catch(() => { redisAvailable = false; });
    } catch {
        redisAvailable = false;
    }
    return redisClient;
};

export const getRedis   = () => redisClient;
export const isRedisUp  = () => redisAvailable;
