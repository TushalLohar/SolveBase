import { getOAuthConfig } from "./config.ts";

type RedisCommand = Array<string | number>;

async function command(commandValue: RedisCommand): Promise<unknown> {
  const config = getOAuthConfig();
  const response = await fetch(config.redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commandValue),
    signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) throw new Error("OAuth storage request failed");
  const payload = (await response.json()) as { result?: unknown; error?: unknown };
  if (payload.error) throw new Error("OAuth storage command failed");
  return payload.result;
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
  const result = await command(["SET", key, JSON.stringify(value), "EX", ttlSeconds, "NX"]);
  return result === "OK";
}

export async function setValue(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const result = await command(["SET", key, value, "EX", ttlSeconds, "NX"]);
  return result === "OK";
}

export async function getValue(key: string): Promise<string | null> {
  const result = await command(["GET", key]);
  return typeof result === "string" ? result : null;
}

export async function getAndDelete(key: string): Promise<string | null> {
  const result = await command(["GETDEL", key]);
  return typeof result === "string" ? result : null;
}

export async function incrementWindow(key: string, ttlSeconds: number): Promise<number> {
  const script =
    "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return n;";
  const result = await command(["EVAL", script, "1", key, ttlSeconds]);
  const count = Number(result);
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("OAuth storage returned an invalid rate-limit value");
  }
  return count;
}
