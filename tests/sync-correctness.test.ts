import assert from "node:assert/strict";

const values: Record<string, unknown> = {
  config: { token: "mock-token", owner: "octocat", repo: "solutions", setupComplete: true },
};
Object.assign(globalThis, {
  chrome: {
    storage: {
      local: {
        async get(key: string) {
          return { [key]: structuredClone(values[key]) };
        },
        async set(update: Record<string, unknown>) {
          Object.assign(values, structuredClone(update));
        },
        async remove(key: string) {
          delete values[key];
        },
        async setAccessLevel() {},
      },
      session: { async setAccessLevel() {} },
    },
  },
});

const requests: string[] = [];
const files = new Map<string, string>();
const mutations: Array<{ method: string; path: string }> = [];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  requests.push(url);
  if (url.startsWith("https://cses.fi/")) {
    let html = '<a href="/logout">Logout</a>';
    if (url.endsWith("/problemset/")) {
      html +=
        '<h2>Introductory Problems</h2><li class="task"><a href="/problemset/task/1">Example</a></li>';
    } else if (url.includes("/task/1/")) {
      html += '<a href="/problemset/result/101/">old</a><a href="/problemset/result/102/">new</a>';
    } else if (url.includes("/result/")) {
      const rejected = url.includes("/103/");
      html += `<a href="/problemset/task/1">Example</a><table><tr><td>Language:</td><td><b>Python3</b></td></tr><tr><td>Result:</td><td>${rejected ? "WRONG ANSWER" : "ACCEPTED"}</td></tr></table><pre class="code">print(${url.includes("/101/") ? 1 : 2})</pre>`;
    } else throw new Error(`Unexpected CSES request: ${url}`);
    return new Response(html);
  }
  assert.ok(url.startsWith("https://api.github.com/repos/octocat/solutions/contents/"));
  const path = decodeURIComponent(url.split("/contents/")[1]!);
  const method = init?.method || "GET";
  if (method === "GET") {
    const source = files.get(path);
    return source === undefined
      ? new Response(null, { status: 404 })
      : Response.json({ sha: "mock-sha", content: Buffer.from(source).toString("base64") });
  }
  mutations.push({ method, path });
  if (method === "PUT") {
    const body = JSON.parse(String(init?.body)) as { content: string };
    files.set(path, Buffer.from(body.content, "base64").toString("utf8"));
  } else if (method === "DELETE") files.delete(path);
  else throw new Error(`Unexpected method: ${method}`);
  return Response.json({ content: { sha: "mock-sha" } });
}) as typeof fetch;

const sync = await import("../extension/sync.js");
const cses = await import("../extension/cses.js");
const { indexRepositoryFiles } = await import("../extension/github.js");

const first = await sync.processLive("cses", { id: "101", resultId: "101", taskId: "1" });
assert.equal(first.outcome, "created");
assert.equal(files.get("cses/introductory-problems/1 - Example.py"), "print(1)");
assert.equal(
  requests.some((url) => url.includes("/task/1/")),
  false,
  "An exact result ID must never look up the newest submission",
);
assert.equal(
  requests.filter((url) => url.includes("/result/101/")).length,
  1,
  "Metadata and source must share the same verified result",
);
assert.equal(
  requests.some((url) => url.includes("/result/102/")),
  false,
);
await assert.rejects(cses.PLATFORM.fetchSource({ resultId: "101", taskId: "2" }), /different task/);
await assert.rejects(cses.PLATFORM.fetchMetadata({ resultId: "103", taskId: "1" }), /not accepted/);

// Task-only callers must stay pinned to the result used to build metadata.
const fallback = { id: "1", taskId: "1" };
const fallbackMeta = await cses.PLATFORM.fetchMetadata(fallback);
assert.equal(fallbackMeta.id, "102");
assert.equal(await cses.PLATFORM.fetchSource(fallback), "print(2)");
assert.equal(requests.filter((url) => url.includes("/task/1/")).length, 1);

const importedPath = "geeksforgeeks/Legacy/My Example.cpp";
files.set(importedPath, "int main() { return 0; }");
values["synced"] = indexRepositoryFiles([{ type: "blob", path: importedPath }]);
const changedLanguage = await sync.processLive("gfg", {
  id: "example:python",
  slug: "example",
  title: "My Example",
  difficulty: "Easy",
  language: "Python3",
  source: "print('new')",
});
assert.equal(changedLanguage.outcome, "created");
assert.equal(files.get("geeksforgeeks/Legacy/My Example.py"), "print('new')");
assert.equal(files.has(importedPath), false);
assert.ok("meta" in changedLanguage);
const changedMetadata = changedLanguage.meta as Record<string, unknown>;
assert.equal(changedMetadata["path"], "geeksforgeeks/Legacy/My Example.py");
assert.equal(changedMetadata["folder"], "Legacy");
const index = values["synced"] as Record<string, { path: string }>;
assert.deepEqual(Object.keys(index), ["gfg:example"]);
assert.equal(index["gfg:example"]?.path, "geeksforgeeks/Legacy/My Example.py");
const createdAt = mutations.findIndex(
  (item) => item.method === "PUT" && item.path.endsWith("My Example.py"),
);
const deletedAt = mutations.findIndex(
  (item) => item.method === "DELETE" && item.path === importedPath,
);
assert.ok(
  createdAt >= 0 && deletedAt > createdAt,
  "Write the replacement successfully before removing the old file",
);

const aliasPath = "codeforces/Legacy/123A - Example.cc";
files.set(aliasPath, "int main() { return 0; }");
values["synced"] = indexRepositoryFiles([{ type: "blob", path: aliasPath }]);
await sync.processLive("codeforces", {
  id: "201",
  contestId: 123,
  problemIndex: "A",
  problemName: "Example",
  language: "GNU C++17",
  rating: 800,
  source: "int main() { return 1; }",
});
assert.equal(files.get(aliasPath), "int main() { return 1; }");
assert.equal(
  files.has("codeforces/Legacy/123A - Example.cpp"),
  false,
  "Preserve equivalent C++ filename extensions",
);

process.stdout.write("Submission source and language regression test: ok\n");
