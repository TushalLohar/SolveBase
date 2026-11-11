import assert from "node:assert/strict";
import fs from "node:fs";

const local = new Map<string, unknown>();
const session = new Map<string, unknown>();

function storageArea(values: Map<string, unknown>) {
  return {
    setAccessLevel: async () => {},
    get: async (key: string) => ({ [key]: values.get(key) }),
    set: async (entries: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(entries)) values.set(key, value);
    },
    remove: async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) values.delete(key);
    },
    clear: async () => values.clear(),
  };
}

Object.assign(globalThis, {
  chrome: {
    storage: {
      local: storageArea(local),
      session: storageArea(session),
    },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {},
    },
  },
});

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8")) as {
  key?: string;
};
assert.equal(manifest.key, undefined);

const extensionId = "caeobmhokccipmdinfcajpagikggollm";

Object.assign(process.env, {
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  GITHUB_CALLBACK_URL: "https://solvebase.dev/api/oauth/github/callback",
  KV_REST_API_URL: "https://redis.test",
  KV_REST_API_TOKEN: "test-redis-token",
  TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString("base64"),
  EXTENSION_ORIGIN: `chrome-extension://${extensionId}`,
  EXTENSION_REDIRECT_URL: `https://${extensionId}.chromiumapp.org/github`,
});

const { getOAuthConfig } = await import("../server/oauth/config.ts");
const config = getOAuthConfig();
assert.ok(fs.readFileSync("src/routes/index.tsx", "utf8").includes(`/${extensionId}"`));
assert.ok(
  fs
    .readFileSync(".env.example", "utf8")
    .includes(`EXTENSION_ORIGIN=chrome-extension://${extensionId}`),
);
assert.equal(config.extensionOrigin, `chrome-extension://${extensionId}`);
assert.equal(config.extensionRedirectUrl, `https://${extensionId}.chromiumapp.org/github`);
delete process.env["EXTENSION_ORIGIN"];
delete process.env["EXTENSION_REDIRECT_URL"];
assert.equal(getOAuthConfig().extensionOrigin, config.extensionOrigin);
assert.equal(getOAuthConfig().extensionRedirectUrl, config.extensionRedirectUrl);

let nextResponse = new Response(null, { status: 500 });
let authorization = "";
let requestedUrl = "";
let requestedMethod = "";
let responseQueue: Response[] = [];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  requestedUrl = String(input);
  requestedMethod = String(init?.method || "GET");
  authorization = String(new Headers(init?.headers).get("authorization") || "");
  return responseQueue.shift() || nextResponse;
}) as typeof fetch;

const github = await import("../extension/github.js");
const oauth = await import("../extension/oauth.js");
const store = await import("../extension/storage.js");

function hasGithubError(error: unknown, code: string, status: number) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "status" in error &&
    error.code === code &&
    error.status === status
  );
}

nextResponse = new Response(null, { status: 401 });
await assert.rejects(github.verifyToken("valid-looking-token"), (error: unknown) =>
  hasGithubError(error, "github-auth", 401),
);
assert.equal(authorization, "Bearer valid-looking-token");

nextResponse = new Response(null, { status: 403 });
await assert.rejects(github.verifyToken("permission-token"), (error: unknown) =>
  hasGithubError(error, "github-permission", 403),
);

responseQueue = [
  new Response(null, { status: 503 }),
  new Response(null, { status: 503 }),
  Response.json({ login: "TushalLohar" }, { headers: { "x-oauth-scopes": "public_repo" } }),
];
assert.deepEqual(await github.verifyToken("retry-token"), { login: "TushalLohar" });

responseQueue = [
  new Response(null, { status: 503 }),
  new Response(null, { status: 503 }),
  new Response(null, { status: 503 }),
];
await assert.rejects(github.verifyToken("busy-token"), (error: unknown) =>
  hasGithubError(error, "transient", 503),
);

nextResponse = Response.json(
  { login: "TushalLohar" },
  { headers: { "x-oauth-scopes": "public_repo" } },
);
assert.deepEqual(await github.verifyToken("active-token"), { login: "TushalLohar" });

nextResponse = Response.json({ login: "TushalLohar" }, { headers: { "x-oauth-scopes": "repo" } });
await assert.rejects(github.verifyToken("broad-token"), /GitHub granted private-repository access/);

nextResponse = new Response(null, { status: 204 });
assert.deepEqual(await github.starRepository("active-token", "TushalLohar", "SolveBase"), {
  starred: true,
});
assert.equal(requestedUrl, "https://api.github.com/user/starred/TushalLohar/SolveBase");
assert.equal(requestedMethod, "PUT");
assert.equal(authorization, "Bearer active-token");

await store.setConfig({
  token: "active-token",
  owner: "TushalLohar",
  setupComplete: true,
});
const originalNow = Date.now;
Date.now = () => originalNow() + 2 * 365 * 24 * 60 * 60 * 1000;
assert.equal((await store.getConfig()).token, "active-token");
Date.now = originalNow;

await store.setConfig({
  token: "active-token",
  owner: "TushalLohar",
  repo: "CP-Solutions",
  setupComplete: true,
});
await store.set(store.KEYS.projectRepoStarred, true);
await oauth.disconnect();
assert.equal((await store.getConfig()).token, "");
assert.equal((await store.getConfig()).owner, "TushalLohar");
assert.equal((await store.getConfig()).repo, "CP-Solutions");
assert.equal(await store.get(store.KEYS.projectRepoStarred, null), false);

process.stdout.write("GitHub auth reliability test: ok\n");
