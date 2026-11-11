import assert from "node:assert/strict";

Object.assign(globalThis, {
  chrome: {
    storage: {
      local: { get: async () => ({}), set: async () => {}, setAccessLevel: async () => {} },
    },
  },
});

const { buildReadme, ensureRepo, indexRepositoryFiles, mergeReadme, putFile } =
  await import("../extension/github.js");

type SyncedIndex = Record<string, { folder?: string; path?: string }>;

const synced = indexRepositoryFiles([
  { type: "blob", path: "codeforces/1400/573A - Bear and Poker.cpp" },
  { type: "blob", path: "1400/580A - Kefa and First Steps.py" },
  { type: "blob", path: "leetcode/dynamic-programming/198-House-Robber.ts" },
  { type: "blob", path: "cses/sorting-and-searching/1640 - Sum of Two Values.cpp" },
  { type: "blob", path: "codechef/1000/FLOW001 - Add Two Numbers.java" },
  { type: "blob", path: "geeksforgeeks/Medium/Subset Sum.cpp" },
  { type: "blob", path: "2024/notes/main.py" },
  { type: "blob", path: "1400/notes.py" },
  { type: "blob", path: "codeforces/1400/notes.md" },
  { type: "tree", path: "codeforces/1400" },
]) as unknown as SyncedIndex;

assert.equal(Object.keys(synced).length, 6);
assert.equal(synced["codeforces:573A"]?.folder, "1400");
assert.equal(synced["codeforces:580A"]?.path, "1400/580A - Kefa and First Steps.py");
assert.equal(synced["leetcode:198"]?.folder, "dynamic-programming");

const generated = buildReadme(synced, "tourist");
assert.match(generated, /\*\*Total solved: 6\*\*/);
assert.match(generated, /\| \[1400\]\(\.\/codeforces\/1400\) \| 2 \|/);
assert.match(generated, /<!-- \/cf-sync -->/);

const preserved = mergeReadme("# My existing solutions\n\nPersonal notes.\n", generated);
assert.match(preserved, /^# My existing solutions/);
assert.match(preserved, /Personal notes\./);
assert.match(preserved, /\*\*Total solved: 6\*\*/);

const updated = mergeReadme(preserved, buildReadme({}, "tourist"));
assert.equal((updated.match(/<!-- cf-sync -->/g) || []).length, 1);
assert.match(updated, /\*\*Total solved: 0\*\*/);
assert.doesNotMatch(updated, /\*\*Total solved: 6\*\*/);

const migrated = mergeReadme(
  "# Personal notes\n\nKeep this text.\n\n<!-- cf-sync -->\n# Old managed README\n\n**Total solved: 1**\n",
  generated,
);
assert.doesNotMatch(migrated, /Old managed README/);
assert.match(migrated, /^# Personal notes/);
assert.match(migrated, /Keep this text\./);
assert.match(migrated, /\*\*Total solved: 6\*\*/);

const requests: string[] = [];
globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  requests.push(url);
  if (url.endsWith("/repos/octocat/solutions")) {
    return Response.json({ default_branch: "main" });
  }
  if (url.endsWith("/repos/octocat/solutions/contents/")) {
    return Response.json([
      { name: "README.md", type: "file" },
      { name: "codeforces", type: "dir" },
    ]);
  }
  if (url.endsWith("/repos/octocat/solutions/git/trees/main?recursive=1")) {
    return Response.json({
      truncated: false,
      tree: [{ type: "blob", path: "codeforces/900/4A - Watermelon.cpp" }],
    });
  }
  if (url.endsWith("/repos/octocat/solutions/contents/README.md")) {
    return Response.json({
      sha: "readme-sha",
      content: btoa("<!-- cf-sync -->\n# Existing managed README\n"),
    });
  }
  throw new Error(`Unexpected GitHub request: ${url}`);
}) as typeof fetch;

const adopted = (await ensureRepo("token", "octocat", "solutions")) as {
  adopted: boolean;
  synced: SyncedIndex;
};
assert.equal(adopted.adopted, true);
assert.equal(Object.keys(adopted.synced).length, 1);
assert.equal(adopted.synced["codeforces:4A"]?.folder, "900");
assert.equal(requests.length, 4);

const createRequests: Array<{ method: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
  createRequests.push({
    method: String(init?.method || "GET"),
    body: init?.body ? JSON.parse(String(init.body)) : {},
  });
  return Response.json({ content: { sha: "created-sha" } });
}) as typeof fetch;

const created = await putFile(
  "token",
  "octocat",
  "solutions",
  "leetcode/array/1-Two-Sum.cpp",
  "int main() {}",
  "Add Two Sum",
);
assert.equal(created.outcome, "created");
assert.deepEqual(
  createRequests.map((request) => request.method),
  ["PUT"],
);
assert.equal(createRequests[0]?.body["sha"], undefined);

const conflictRequests: Array<{ method: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
  const method = String(init?.method || "GET");
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  conflictRequests.push({ method, body });
  if (conflictRequests.length === 1) return new Response("", { status: 422 });
  if (method === "GET") {
    return Response.json({ sha: "existing-sha", content: btoa("old source") });
  }
  return Response.json({ content: { sha: "updated-sha" } });
}) as typeof fetch;

const updatedFile = await putFile(
  "token",
  "octocat",
  "solutions",
  "leetcode/array/1-Two-Sum.cpp",
  "new source",
  "Update Two Sum",
);
assert.equal(updatedFile.outcome, "updated");
assert.deepEqual(
  conflictRequests.map((request) => request.method),
  ["PUT", "GET", "PUT"],
);
assert.equal(conflictRequests[2]?.body["sha"], "existing-sha");

process.stdout.write("Repository state recovery test: ok\n");
