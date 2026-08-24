import { sha256 } from "./crypto.ts";
import { incrementWindow } from "./redis.ts";

export class RateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Too many authorization requests");
    this.retryAfter = retryAfter;
  }
}

interface WindowBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, WindowBucket>();
const MAX_MEMORY_BUCKET_ENTRIES = 5000;

function checkInMemoryLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (memoryBuckets.size >= MAX_MEMORY_BUCKET_ENTRIES) {
      for (const [k, v] of memoryBuckets.entries()) {
        if (now >= v.resetAt) memoryBuckets.delete(k);
      }
    }
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

export type RateLimitConfig = {
  burstLimit?: number;
  burstWindowSeconds?: number;
  globalLimit?: number;
  globalWindowSeconds?: number;
};

export async function enforceRateLimit(
  bucket: string,
  identity: string,
  limit: number,
  windowSeconds: number,
  config?: RateLimitConfig,
): Promise<void> {
  const burstLimit = config?.burstLimit ?? Math.max(5, Math.min(limit, 10));
  const burstWindowSeconds = config?.burstWindowSeconds ?? 5;

  const burstKey = `burst:${bucket}:${identity}`;
  if (!checkInMemoryLimit(burstKey, burstLimit, burstWindowSeconds)) {
    throw new RateLimitError(burstWindowSeconds);
  }

  if (config?.globalLimit) {
    const globalWindowSeconds = config.globalWindowSeconds ?? 60;
    const globalKey = `global:${bucket}`;
    if (!checkInMemoryLimit(globalKey, config.globalLimit, globalWindowSeconds)) {
      throw new RateLimitError(globalWindowSeconds);
    }
  }

  try {
    const key = `solvebase:oauth:rate:${bucket}:${sha256(identity)}`;
    const count = await incrementWindow(key, windowSeconds);
    if (count > limit) throw new RateLimitError(windowSeconds);
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    console.warn(`[rate-limit] Redis unavailable, fallback to L1 limiter:`, error);
  }
}

export function resetInMemoryRateLimits(): void {
  memoryBuckets.clear();
}
