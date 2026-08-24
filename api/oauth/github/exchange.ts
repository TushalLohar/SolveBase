import type { ServerResponse } from "node:http";

import { getOAuthConfig } from "../../../server/oauth/config.ts";
import { decryptJson, equalSecret, sha256, sha256Base64Url } from "../../../server/oauth/crypto.ts";
import {
  clientIp,
  corsHeaders,
  PayloadTooLargeError,
  payloadTooLarge,
  rateLimited,
  readJson,
  SECURITY_HEADERS,
  sendJson,
  type RequestLike,
} from "../../../server/oauth/http.ts";
import { enforceRateLimit, RateLimitError } from "../../../server/oauth/rate-limit.ts";
import { getAndDelete, getValue } from "../../../server/oauth/redis.ts";

type ExchangePayload = { token?: string; challenge?: string };

export default async function handler(
  request: RequestLike,
  response: ServerResponse,
): Promise<void> {
  let config;
  try {
    config = getOAuthConfig();
  } catch {
    sendJson(response, 500, { error: "oauth_unavailable" });
    return;
  }
  const headers = corsHeaders(config.extensionOrigin);
  if (request.method === "OPTIONS") {
    if (request.headers.origin !== config.extensionOrigin) {
      sendJson(response, 403, { error: "forbidden" });
      return;
    }
    response.writeHead(204, {
      ...headers,
      ...SECURITY_HEADERS,
    });
    response.end();
    return;
  }
  if (request.method !== "POST" || request.headers.origin !== config.extensionOrigin) {
    sendJson(response, 403, { error: "forbidden" }, headers);
    return;
  }

  try {
    await enforceRateLimit("exchange", clientIp(request), 60, 600, {
      burstLimit: 10,
      burstWindowSeconds: 5,
      globalLimit: 600,
      globalWindowSeconds: 60,
    });
    const contentType = String(request.headers["content-type"] || "")
      .split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    if (contentType !== "application/json") {
      sendJson(response, 415, { error: "unsupported_media_type" }, headers);
      return;
    }
    const body = await readJson(request);
    const code = typeof body["code"] === "string" ? body["code"] : "";
    const verifier = typeof body["verifier"] === "string" ? body["verifier"] : "";
    if (!/^[A-Za-z0-9_-]{40,128}$/.test(code) || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) {
      sendJson(response, 400, { error: "invalid_exchange" }, headers);
      return;
    }

    const key = `solvebase:oauth:exchange:${sha256(code)}`;
    const stored = await getValue(key);
    if (!stored) {
      sendJson(response, 400, { error: "exchange_expired" }, headers);
      return;
    }
    const payload = decryptJson<ExchangePayload>(stored, config.tokenEncryptionKey);
    const challenge = sha256Base64Url(verifier);
    if (!payload.challenge || !equalSecret(payload.challenge, challenge)) {
      sendJson(response, 400, { error: "invalid_exchange" }, headers);
      return;
    }

    const consumed = await getAndDelete(key);
    if (!consumed) {
      sendJson(response, 400, { error: "exchange_expired" }, headers);
      return;
    }
    const finalPayload = decryptJson<ExchangePayload>(consumed, config.tokenEncryptionKey);
    if (!finalPayload.token) {
      sendJson(response, 400, { error: "invalid_exchange" }, headers);
      return;
    }
    sendJson(response, 200, { token: finalPayload.token }, headers);
  } catch (error) {
    if (error instanceof RateLimitError) {
      rateLimited(response, error.retryAfter, headers);
      return;
    }
    if (error instanceof PayloadTooLargeError) {
      payloadTooLarge(response, headers);
      return;
    }
    sendJson(response, 500, { error: "oauth_unavailable" }, headers);
  }
}
