const DEFAULT_EXTENSION_REDIRECT =
  "https://caeobmhokccipmdinfcajpagikggollm.chromiumapp.org/github";
const DEFAULT_EXTENSION_ORIGIN = "chrome-extension://caeobmhokccipmdinfcajpagikggollm";

export type OAuthConfig = {
  githubClientId: string;
  githubClientSecret: string;
  githubCallbackUrl: string;
  extensionRedirectUrl: string;
  extensionOrigin: string;
  redisUrl: string;
  redisToken: string;
  tokenEncryptionKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing OAuth environment variable: ${name}`);
  if (value.length > 2048 || hasControlCharacter(value)) {
    throw new Error(`Invalid OAuth environment variable: ${name}`);
  }
  return value;
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function httpsUrl(name: string, value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid OAuth environment variable: ${name}`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash) {
    throw new Error(`Invalid OAuth environment variable: ${name}`);
  }
  return value;
}

function encryptionKey(): string {
  const value = required("TOKEN_ENCRYPTION_KEY");
  if (/^[0-9a-f]{64}$/i.test(value)) return value;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must encode 32 bytes");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new Error("TOKEN_ENCRYPTION_KEY must encode 32 bytes");
  }
  return value;
}

export function getOAuthConfig(): OAuthConfig {
  const extensionRedirectUrl =
    process.env["EXTENSION_REDIRECT_URL"]?.trim() || DEFAULT_EXTENSION_REDIRECT;
  const extensionOrigin = process.env["EXTENSION_ORIGIN"]?.trim() || DEFAULT_EXTENSION_ORIGIN;
  const extensionId = extensionOrigin.match(/^chrome-extension:\/\/([a-p]{32})$/)?.[1];
  const expectedRedirect = extensionId ? `https://${extensionId}.chromiumapp.org/github` : "";
  if (!extensionId || extensionRedirectUrl !== expectedRedirect) {
    throw new Error("EXTENSION_ORIGIN and EXTENSION_REDIRECT_URL must use the same extension ID");
  }

  const githubClientId = required("GITHUB_CLIENT_ID");
  if (!/^[A-Za-z0-9._-]{10,128}$/.test(githubClientId)) {
    throw new Error("Invalid OAuth environment variable: GITHUB_CLIENT_ID");
  }

  const githubCallbackUrl = httpsUrl("GITHUB_CALLBACK_URL", required("GITHUB_CALLBACK_URL"));
  if (new URL(githubCallbackUrl).pathname !== "/api/oauth/github/callback") {
    throw new Error("GITHUB_CALLBACK_URL must end with /api/oauth/github/callback");
  }

  return {
    githubClientId,
    githubClientSecret: required("GITHUB_CLIENT_SECRET"),
    githubCallbackUrl,
    extensionRedirectUrl,
    extensionOrigin,
    redisUrl: httpsUrl("KV_REST_API_URL", required("KV_REST_API_URL")),
    redisToken: required("KV_REST_API_TOKEN"),
    tokenEncryptionKey: encryptionKey(),
  };
}

export const OAUTH_STATE_TTL = 300;
export const EXCHANGE_CODE_TTL = 60;
