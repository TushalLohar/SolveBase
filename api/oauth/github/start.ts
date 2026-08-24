import type { ServerResponse } from "node:http";

import { getOAuthConfig, OAUTH_STATE_TTL } from "../../../server/oauth/config.ts";
import { randomToken, sha256 } from "../../../server/oauth/crypto.ts";
import {
  clientIp,
  methodNotAllowed,
  redirect,
  requestUrl,
  sendJson,
  type RequestLike,
} from "../../../server/oauth/http.ts";
import { enforceRateLimit, RateLimitError } from "../../../server/oauth/rate-limit.ts";
import { setJson } from "../../../server/oauth/redis.ts";

function errorResponse(response: ServerResponse, error: unknown): void {
  if (error instanceof RateLimitError) {
    sendJson(response, 429, { error: "rate_limited" }, { "Retry-After": String(error.retryAfter) });
    return;
  }
  sendJson(response, 500, { error: "oauth_unavailable" });
}

export default async function handler(
  request: RequestLike,
  response: ServerResponse,
): Promise<void> {
  if (request.method !== "GET") {
    methodNotAllowed(response);
    return;
  }
  let config;
  try {
    config = getOAuthConfig();
  } catch (error) {
    errorResponse(response, error);
    return;
  }
  try {
    await enforceRateLimit("start", clientIp(request), 60, 600, {
      burstLimit: 10,
      burstWindowSeconds: 5,
      globalLimit: 600,
      globalWindowSeconds: 60,
    });
    const challenge = requestUrl(request).searchParams.get("challenge") || "";
    const clientState = requestUrl(request).searchParams.get("client_state") || "";
    if (
      !/^[A-Za-z0-9_-]{43,128}$/.test(challenge) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(clientState)
    ) {
      redirect(response, `${config.extensionRedirectUrl}?error=invalid_challenge`);
      return;
    }

    const state = randomToken();
    const stored = await setJson(
      `solvebase:oauth:state:${sha256(state)}`,
      { challenge, clientState },
      OAUTH_STATE_TTL,
    );
    if (!stored) {
      redirect(response, `${config.extensionRedirectUrl}?error=oauth_unavailable`);
      return;
    }

    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", config.githubClientId);
    githubUrl.searchParams.set("redirect_uri", config.githubCallbackUrl);
    githubUrl.searchParams.set("scope", "public_repo");
    githubUrl.searchParams.set("state", state);
    redirect(response, githubUrl.toString());
  } catch (error) {
    redirect(
      response,
      `${config.extensionRedirectUrl}?error=${error instanceof RateLimitError ? "rate_limited" : "oauth_unavailable"}`,
    );
  }
}
