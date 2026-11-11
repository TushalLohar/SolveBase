import assert from "node:assert/strict";

type Reply = { ok?: boolean; error?: string };
type Listener = (
  message: Record<string, unknown>,
  sender: Record<string, unknown>,
  reply: (value: Reply) => void,
) => boolean;
const values: Record<string, unknown> = {};
const sessions: Record<string, unknown> = {};
const area = (items: Record<string, unknown>) => ({
  async get(key: string) {
    return { [key]: structuredClone(items[key]) };
  },
  async set(update: Record<string, unknown>) {
    Object.assign(items, structuredClone(update));
  },
  async remove(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete items[key];
  },
  async clear() {
    for (const key of Object.keys(items)) delete items[key];
  },
  async setAccessLevel() {},
});
const extensionId = "caeobmhokccipmdinfcajpagikggollm";
let listener: Listener;
let onAlarm: (alarm: { name: string }) => void;
let githubOwner = "octocat";
const platforms = { codeforces: true, leetcode: false, cses: false, codechef: false, gfg: true };
const config = {
  token: "",
  owner: githubOwner,
  repo: "solutions",
  handle: "tourist",
  gfgHandle: "gfg-user",
  setupComplete: false,
  githubAuthInvalid: true,
  platforms,
};
values["config"] = config;
const originalNow = Date.now;
const originalSetTimeout = globalThis.setTimeout;
let now = originalNow();
const timers = new Set<ReturnType<typeof setTimeout>>();
const keepAlive = setInterval(() => {}, 1000);

Object.assign(globalThis, {
  setTimeout(callback: (...args: unknown[]) => void, delay: number, ...args: unknown[]) {
    const timer = originalSetTimeout(callback, delay, ...args);
    timer.unref();
    timers.add(timer);
    return timer;
  },
  chrome: {
    storage: { local: area(values), session: area(sessions) },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    runtime: {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: {
        addListener(fn: Listener) {
          listener = fn;
        },
      },
    },
    alarms: {
      create() {},
      async clear() {},
      onAlarm: {
        addListener(fn: typeof onAlarm) {
          onAlarm = fn;
        },
      },
    },
    identity: {
      getRedirectURL: (path: string) => `https://${extensionId}.chromiumapp.org/${path}`,
      async launchWebAuthFlow({ url }: { url: string }) {
        const state = new URL(url).searchParams.get("client_state");
        return `https://${extensionId}.chromiumapp.org/github?code=${"a".repeat(43)}&state=${state}`;
      },
    },
  },
});
Date.now = () => now;

const files = new Map<string, string>();
const cfSubmissions: Array<Record<string, unknown>> = [];
const requests: string[] = [];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  requests.push(url);
  if (url.endsWith("/api/oauth/github/exchange"))
    return Response.json({ token: "mock-reconnected-token" });
  if (url === "https://api.github.com/user")
    return Response.json({ login: githubOwner }, { headers: { "x-oauth-scopes": "public_repo" } });
  if (url.startsWith("https://practiceapi.geeksforgeeks.org/"))
    return Response.json({ result: {} });
  if (url.startsWith("https://codeforces.com/api/user.info"))
    return Response.json({ status: "OK", result: [] });
  if (url.startsWith("https://codeforces.com/api/user.status"))
    return Response.json({ status: "OK", result: cfSubmissions.slice(0, 30) });
  if (url.startsWith("https://codeforces.com/api/contest.status"))
    return Response.json({ status: "OK", result: cfSubmissions });
  if (url.includes("codeforces.com/contest/1234/submission/")) {
    return new Response(
      '<html>Codeforces<pre id="program-source-text">int main() { return 0; }</pre></html>',
    );
  }
  if (url.startsWith("https://api.github.com/repos/")) {
    if (!url.includes("/contents/"))
      return Response.json({ private: false, default_branch: "main" });
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)) as { content: string };
      files.set(decodeURIComponent(url), Buffer.from(body.content, "base64").toString("utf8"));
      return Response.json({ content: { sha: "mock-sha" } });
    }
    const source = files.get(decodeURIComponent(url));
    return source === undefined
      ? new Response(null, { status: 404 })
      : Response.json({ sha: "mock-sha", content: Buffer.from(source).toString("base64") });
  }
  throw new Error(`Unexpected request: ${url}`);
}) as typeof fetch;

function send(message: Record<string, unknown>, platform = false) {
  return new Promise<Reply>((resolve) =>
    listener(
      message,
      platform
        ? { id: extensionId, tab: { id: 1 }, url: "https://codeforces.com/contest/1234/submit" }
        : { id: extensionId, url: `chrome-extension://${extensionId}/popup.html` },
      resolve,
    ),
  );
}
async function waitFor(check: () => boolean | Promise<boolean>) {
  const deadline = originalNow() + 5000;
  while (!(await check())) {
    assert.ok(originalNow() < deadline, "Background work did not finish");
    await new Promise((resolve) => originalSetTimeout(resolve, 10));
  }
}
function save(repo: string, connect: boolean) {
  return send({
    type: "save-config",
    payload: {
      connect,
      repo,
      handle: "tourist",
      gfgHandle: "gfg-user",
      repoVisibilityConfirmed: true,
      platforms,
    },
  });
}

try {
  const pending = await import("../extension/pending.js");
  const queued = (id: string) => ({
    id,
    platform: "gfg",
    phase: "ready",
    createdAt: now,
    expiresAt: now + 86400000,
    nextAt: now,
    data: {
      submission: {
        id,
        slug: "example",
        title: "Example",
        difficulty: "Easy",
        language: "Python3",
        source: "print('queued')",
      },
    },
  });
  await pending.upsert(queued("ready:gfg:queued"));
  values["processed"] = { "gfg:older-solve": now };
  await import("../extension/background.js");
  assert.equal((await save("solutions", true)).ok, true);
  assert.equal((await pending.list()).length, 1, "Reconnect must retain queued solves");
  assert.ok((values["processed"] as Record<string, number>)["gfg:older-solve"]);
  await waitFor(async () => (await pending.list()).length === 0);
  assert.equal(
    files.get(
      "https://api.github.com/repos/octocat/solutions/contents/geeksforgeeks/Easy/Example.py",
    ),
    "print('queued')",
  );

  await pending.upsert(queued("ready:gfg:old-destination"));
  assert.equal((await save("new-solutions", false)).ok, true);
  assert.equal(
    (await pending.list()).length,
    0,
    "Changing repository must discard work belonging to the old destination",
  );
  await pending.upsert(queued("ready:gfg:old-account"));
  githubOwner = "another-user";
  assert.equal((await save("new-solutions", true)).ok, true);
  assert.equal(
    (await pending.list()).length,
    0,
    "Changing account must not transfer queued solutions",
  );

  // Stop scheduled callbacks before driving the Codeforces alarm explicitly.
  for (const timer of timers) clearTimeout(timer);
  const witnessAt = now;
  cfSubmissions.push({
    id: 101,
    contestId: 1234,
    creationTimeSeconds: Math.floor(now / 1000),
    verdict: "OK",
    testset: "PRETESTS",
    author: { participantType: "CONTESTANT" },
    problem: { contestId: 1234, index: "A", name: "Example" },
    rating: 800,
    programmingLanguage: "GNU C++17",
  });
  assert.equal(
    (
      await send(
        { type: "cf-witness", action: "set", data: { contestId: "1234", problemIndex: "A" } },
        true,
      )
    ).ok,
    true,
  );
  now += 5000;
  onAlarm!({ name: "pending-submission-sync" });
  await waitFor(async () => (await pending.list()).some((job) => job.data?.submissionId === "101"));
  assert.equal(
    [...files.keys()].some((url) => url.includes("/contents/codeforces/")),
    false,
    "Pretests must never be committed",
  );

  now = witnessAt + 16 * 60 * 1000;
  assert.equal(
    (await pending.list()).length,
    1,
    "A final-verdict job must survive the page witness TTL",
  );
  cfSubmissions.unshift({
    id: 102,
    contestId: 1234,
    creationTimeSeconds: Math.floor(now / 1000),
    verdict: "OK",
    testset: "PRETESTS",
    author: { participantType: "CONTESTANT" },
    problem: { contestId: 1234, index: "B", name: "Second" },
    rating: 800,
  });
  await send(
    { type: "cf-witness", action: "set", data: { contestId: "1234", problemIndex: "B" } },
    true,
  );
  await send({ type: "cf-witness", action: "clear" }, true);
  assert.equal(
    (await pending.list()).length,
    2,
    "Later submissions and page cleanup must not erase contest jobs",
  );

  for (const timer of timers) clearTimeout(timer);
  now = witnessAt + 2 * 86400000;
  const first = cfSubmissions.find((submission) => submission["id"] === 101)!;
  first["testset"] = "TESTS";
  const second = cfSubmissions.find((submission) => submission["id"] === 102)!;
  second["verdict"] = "WRONG_ANSWER";
  cfSubmissions.unshift(
    ...Array.from({ length: 35 }, (_, i) => ({
      id: 200 + i,
      creationTimeSeconds: Math.floor(now / 1000),
      problem: { index: "Z" },
    })),
  );
  await import(`../extension/background.js?restart=${now}`);
  onAlarm!({ name: "pending-submission-sync" });
  await waitFor(async () => (await pending.list()).length === 0);
  assert.equal(
    files.get(
      "https://api.github.com/repos/another-user/new-solutions/contents/codeforces/800/1234A - Example.cpp",
    ),
    "int main() { return 0; }",
  );
  assert.equal(
    [...files.keys()].some((url) => url.includes("1234B")),
    false,
    "A rejected final verdict must not sync",
  );
  assert.ok(
    requests.some((url) => url.includes("/api/contest.status?")),
    "Resolve the exact contest submission even after it leaves the recent list",
  );
  process.stdout.write("Reconnect and delayed Codeforces recovery test: ok\n");
} finally {
  for (const timer of timers) clearTimeout(timer);
  clearInterval(keepAlive);
  Date.now = originalNow;
  globalThis.setTimeout = originalSetTimeout;
}
