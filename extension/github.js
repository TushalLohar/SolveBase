import * as limiter from "./ratelimit.js";

const API = "https://api.github.com";
const REQUEST_TIMEOUT = 30000;
const READ_RETRY_DELAYS = [400, 1000];
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504]);
const README_MARKER = "<!-- cf-sync -->";
const README_END_MARKER = "<!-- /cf-sync -->";

const PLATFORM_ROOTS = {
  codeforces: "codeforces",
  leetcode: "leetcode",
  cses: "cses",
  codechef: "codechef",
  geeksforgeeks: "gfg",
  gfg: "gfg",
};

const SOURCE_EXTENSIONS = new Set([
  "c",
  "cc",
  "cpp",
  "cs",
  "cxx",
  "d",
  "dart",
  "erl",
  "ex",
  "go",
  "hs",
  "java",
  "js",
  "kt",
  "lua",
  "m",
  "ml",
  "nim",
  "pas",
  "php",
  "pl",
  "py",
  "rb",
  "rkt",
  "rs",
  "scala",
  "sh",
  "sql",
  "swift",
  "ts",
  "txt",
]);

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function repositoryPath(owner, repo) {
  return `/repos/${encodeURIComponent(String(owner))}/${encodeURIComponent(String(repo))}`;
}

function contentsPath(owner, repo, path = "") {
  const encodedPath = String(path)
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${repositoryPath(owner, repo)}/contents/${encodedPath}`;
}

async function gh(token, path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  await limiter.reserve(MUTATING.has(method) ? "write" : "read");

  const canRetry = method === "GET" || method === "HEAD";
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${API}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {}),
        },
        signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch (error) {
      if (canRetry && attempt < READ_RETRY_DELAYS.length) {
        await new Promise((resolve) => setTimeout(resolve, READ_RETRY_DELAYS[attempt]));
        continue;
      }
      const err = new Error(
        error?.name === "TimeoutError" || error?.name === "AbortError"
          ? "GitHub request timed out. Try again in a moment."
          : "GitHub could not be reached. Check your connection and try again.",
      );
      err.code = "transient";
      throw err;
    }

    await limiter.note(res);
    if (canRetry && TRANSIENT_STATUSES.has(res.status) && attempt < READ_RETRY_DELAYS.length) {
      const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
      const delay = Math.min(5000, Math.max(retryAfter, READ_RETRY_DELAYS[attempt]));
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    return res;
  }
}

export async function verifyToken(token) {
  const res = await gh(token, "/user");
  if (!res.ok) throwHttpError(res, "verify authorization");
  const user = await res.json();

  const header = res.headers.get("x-oauth-scopes");
  if (header === null) {
    throw new Error(
      "That token type is not supported. SolveBase needs its GitHub OAuth authorization to create and update the public solutions repository.",
    );
  }
  const scopes = header
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (scopes.includes("repo")) {
    throw new Error(
      "GitHub granted private-repository access. Revoke SolveBase in GitHub settings, then reconnect so it receives public-repository access only.",
    );
  }
  if (!scopes.includes("public_repo")) {
    throw new Error("GitHub authorization is missing public repository access");
  }
  if (typeof user.login !== "string" || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(user.login)) {
    throw new Error("GitHub returned an invalid account identity");
  }
  return { login: user.login };
}

export async function starRepository(token, owner, repo) {
  const res = await gh(
    token,
    `/user/starred/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    {
      method: "PUT",
    },
  );
  if (!res.ok) throwHttpError(res, "star repository");
  return { starred: true };
}

function b64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromB64(text) {
  const bin = atob(text.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const BAD_NAME = "That repo name can't be used. Try a different one.";

export function validateRepoName(repo) {
  const name = String(repo || "").trim();
  if (!name) return BAD_NAME;
  if (name.length > 100) return BAD_NAME;
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return BAD_NAME;
  if (name === "." || name === "..") return BAD_NAME;
  return null;
}

function importedProblemKey(platform, stem, path) {
  const separator = stem.indexOf(" - ");
  if (["codeforces", "cses", "codechef"].includes(platform) && separator > 0) {
    return stem.slice(0, separator).trim();
  }
  if (platform === "leetcode") {
    const number = stem.match(/^(\d+)-/)?.[1];
    if (number) return number;
  }
  if (platform === "gfg") return stem;
  return `path:${path}`;
}

function repositorySolution(path) {
  const parts = String(path || "")
    .split("/")
    .filter(Boolean);
  if (parts.length < 2) return null;

  const root = parts[0].toLowerCase();
  let platform = PLATFORM_ROOTS[root] || null;
  let folder = parts[1] || "";

  // Older Codeforces repositories commonly put rating folders at the root.
  const legacyRating = Number(parts[0]);
  const legacyCodeforcesRoot =
    /^unrated$/i.test(parts[0]) ||
    (Number.isInteger(legacyRating) &&
      legacyRating >= 500 &&
      legacyRating <= 4000 &&
      legacyRating % 100 === 0);
  if (!platform && legacyCodeforcesRoot && parts.length >= 2) {
    platform = "codeforces";
    folder = parts[0];
  } else if (platform && parts.length < 3) {
    return null;
  }
  if (!platform || !folder) return null;

  const filename = parts.at(-1) || "";
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || !SOURCE_EXTENSIONS.has(filename.slice(dot + 1).toLowerCase())) return null;

  const stem = filename.slice(0, dot).trim();
  if (!stem) return null;
  if (!PLATFORM_ROOTS[root] && !/^\S+\s+-\s+\S/.test(stem)) return null;
  const separator = stem.indexOf(" - ");
  const title = separator > 0 ? stem.slice(separator + 3).trim() || stem : stem;
  const problemKey = importedProblemKey(platform, stem, path);
  return {
    key: `${platform}:${problemKey}`,
    value: {
      platform,
      folder,
      title,
      path,
      tags: [],
      at: 0,
      imported: true,
    },
  };
}

export function indexRepositoryFiles(tree) {
  const synced = {};
  for (const entry of Array.isArray(tree) ? tree : []) {
    if (entry?.type !== "blob" || typeof entry.path !== "string") continue;
    const solution = repositorySolution(entry.path);
    if (!solution) continue;

    let key = solution.key;
    if (synced[key] && synced[key].path !== solution.value.path) {
      key = `${key}:path:${solution.value.path}`;
    }
    synced[key] = solution.value;
  }
  return synced;
}

async function repositoryState(token, owner, repo, defaultBranch) {
  if (typeof defaultBranch !== "string" || !defaultBranch || defaultBranch.length > 255) {
    throw new Error("GitHub returned an invalid default branch.");
  }
  const response = await gh(
    token,
    `${repositoryPath(owner, repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
  );
  if (!response.ok) throwHttpError(response, "inspect repository");
  const payload = await response.json();
  if (payload?.truncated) {
    throw new Error("That repository is too large for SolveBase to index safely.");
  }
  if (!Array.isArray(payload?.tree)) {
    throw new Error("GitHub returned an invalid repository index.");
  }
  return indexRepositoryFiles(payload.tree);
}

export async function ensureRepo(token, owner, repo) {
  const invalid = validateRepoName(repo);
  if (invalid) throw new Error(invalid);

  const res = await gh(token, repositoryPath(owner, repo));
  if (res.status === 404) {
    const created = await gh(token, "/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: repo,
        description:
          "Codeforces, LeetCode, CSES, CodeChef & GeeksforGeeks solutions, organized cleanly by rating, topic, contest and difficulty. Synced by SolveBase.",
        auto_init: true,
        private: false,
      }),
    });
    if (created.status === 422) {
      throw new Error("That name is already used by another repo. Pick a different name.");
    }
    if (!created.ok) throwHttpError(created, "create repository");
    return { created: true, synced: {} };
  }
  if (!res.ok) throwHttpError(res, "inspect repository");
  const repository = await res.json();
  if (repository?.private === true) {
    throw new Error(
      "SolveBase uses public-repository access only. Choose a public repository or make this repository public first.",
    );
  }

  const contents = await gh(token, contentsPath(owner, repo));
  if (contents.status === 404) return { created: false, adopted: true, synced: {} };
  if (!contents.ok) throwHttpError(contents, "inspect repository");
  const entries = await contents.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    return { created: false, adopted: true, synced: {} };
  }
  const synced = await repositoryState(token, owner, repo, repository?.default_branch);
  const readme = entries.find(
    (entry) => typeof entry?.name === "string" && entry.name.toLowerCase() === "readme.md",
  );
  if (readme) {
    const readmeResponse = await gh(token, contentsPath(owner, repo, "README.md"));
    if (!readmeResponse.ok) throwHttpError(readmeResponse, "inspect repository");
    const file = await readmeResponse.json();
    if (typeof file.content === "string" && fromB64(file.content).includes(README_MARKER)) {
      return { created: false, adopted: true, synced };
    }
  }
  // User README content is preserved; SolveBase writes only inside its managed block.
  const starters = new Set(["license", "license.md", ".gitignore", "readme", "readme.md"]);
  const onlyBoilerplate = entries.every(
    (entry) =>
      entry?.type === "file" &&
      typeof entry.name === "string" &&
      starters.has(entry.name.toLowerCase()),
  );
  if (onlyBoilerplate || Object.keys(synced).length > 0) {
    return { created: false, adopted: true, synced };
  }
  throw new Error(
    "That repository has no SolveBase-compatible solution folders. Use an empty repository or organize files under codeforces, leetcode, cses, codechef, or geeksforgeeks.",
  );
}

function parseRetryAfter(header) {
  if (!header) return 0;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return 0;
}

function rateLimitDelay(res) {
  if (res.status !== 403 && res.status !== 429) return 0;
  const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
  if (retryAfter) return retryAfter;
  if (res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
    return reset > Date.now() ? reset - Date.now() : 60000;
  }
  return res.status === 429 ? 60000 : 0;
}

function throwHttpError(res, action) {
  const delay = rateLimitDelay(res);
  if (delay) {
    const err = new Error("GitHub rate limited");
    err.code = "ratelimit";
    err.retryAfter = delay;
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    const err = new Error(
      `GitHub refused the ${action} (${res.status}) — reconnect SolveBase and check write access to this public repository`,
    );
    err.status = res.status;
    err.code = res.status === 401 ? "github-auth" : "github-permission";
    throw err;
  }
  if (TRANSIENT_STATUSES.has(res.status)) {
    const err = new Error(`GitHub is temporarily unavailable (${res.status}). Try again shortly.`);
    err.status = res.status;
    err.code = "transient";
    throw err;
  }
  throw new Error(`GitHub ${action} failed (${res.status})`);
}

async function getFile(token, owner, repo, path) {
  const res = await gh(token, contentsPath(owner, repo, path));
  if (res.status === 404) return null;
  if (!res.ok) throwHttpError(res, "read");
  const json = await res.json();
  return { sha: json.sha, content: json.content ? fromB64(json.content) : "" };
}

async function putFileWithExisting(token, owner, repo, path, content, message, existing) {
  if (existing && existing.content === content) return { outcome: "unchanged" };
  const res = await gh(token, contentsPath(owner, repo, path), {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: b64(content),
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!res.ok) throwHttpError(res, "write");
  return { outcome: existing ? "updated" : "created" };
}

export async function putFile(token, owner, repo, path, content, message, options = {}) {
  if (options.existingKnown !== true) {
    const created = await gh(token, contentsPath(owner, repo, path), {
      method: "PUT",
      body: JSON.stringify({ message, content: b64(content) }),
    });
    if (created.ok) return { outcome: "created" };
    if (created.status !== 422) throwHttpError(created, "write");

    const existingAfterConflict = await getFile(token, owner, repo, path);
    if (!existingAfterConflict) throwHttpError(created, "write");
    return putFileWithExisting(token, owner, repo, path, content, message, existingAfterConflict);
  }

  const existing = await getFile(token, owner, repo, path);
  return putFileWithExisting(token, owner, repo, path, content, message, existing);
}

export function mergeReadme(existingContent, generatedContent) {
  const existing = String(existingContent || "");
  const generated = String(generatedContent || "").trimEnd();
  const start = existing.indexOf(README_MARKER);
  if (start >= 0) {
    const end = existing.indexOf(README_END_MARKER, start);
    if (end < 0) return `${existing.slice(0, start)}${generated}\n`;
    const suffix = existing.slice(end + README_END_MARKER.length);
    return `${existing.slice(0, start)}${generated}${suffix}`.replace(/\s*$/, "\n");
  }
  const preserved = existing.trimEnd();
  return preserved ? `${preserved}\n\n---\n\n${generated}\n` : `${generated}\n`;
}

export async function putReadme(token, owner, repo, synced, handle) {
  const existing = await getFile(token, owner, repo, "README.md");
  const content = mergeReadme(existing?.content || "", buildReadme(synced, handle));
  return putFileWithExisting(
    token,
    owner,
    repo,
    "README.md",
    content,
    "Update solutions summary",
    existing,
  );
}

export async function deleteFile(token, owner, repo, path, message) {
  const existing = await getFile(token, owner, repo, path);
  if (!existing) return { skipped: true };
  const res = await gh(token, contentsPath(owner, repo, path), {
    method: "DELETE",
    body: JSON.stringify({ message, sha: existing.sha }),
  });
  if (!res.ok && res.status !== 404) throwHttpError(res, "delete");
  return { skipped: false };
}

function sortRatings(a, b) {
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  if (!Number.isNaN(an)) return -1;
  if (!Number.isNaN(bn)) return 1;
  return a.localeCompare(b);
}

function folderHref(items, folder, fallback) {
  const paths = new Set(
    items
      .filter((item) => item.folder === folder && typeof item.path === "string")
      .map((item) => item.path.split("/").slice(0, -1).join("/"))
      .filter(Boolean),
  );
  return `./${paths.size === 1 ? [...paths][0] : fallback}`;
}

function buildCodeforcesSection(synced, handle) {
  const items = Object.values(synced).filter((s) => s.platform === "codeforces");
  const byRating = {};
  for (const item of items) {
    byRating[item.folder] = (byRating[item.folder] || 0) + 1;
  }
  const order = Object.keys(byRating).sort(sortRatings);
  const rows = order
    .map((r) => `| [${r}](${folderHref(items, r, `codeforces/${r}`)}) | ${byRating[r]} |`)
    .join("\n");
  return `## Codeforces

Solutions by [${handle || "Codeforces"}](https://codeforces.com/profile/${handle || ""}), organized by difficulty rating.

**Solved: ${items.length}**

| Difficulty | Solved |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

function buildLeetcodeSection(synced) {
  const items = Object.values(synced).filter((s) => s.platform === "leetcode");
  const byTopic = {};
  for (const item of items) {
    byTopic[item.folder] = (byTopic[item.folder] || 0) + 1;
  }
  const order = Object.keys(byTopic).sort((a, b) => a.localeCompare(b));
  const rows = order
    .map((t) => `| [${t}](${folderHref(items, t, `leetcode/${t}`)}) | ${byTopic[t]} |`)
    .join("\n");

  return `## LeetCode

Solutions organized by primary topic folder.

**Solved: ${items.length}**

| Topic | Solved |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

function buildCsesSection(synced) {
  const items = Object.values(synced).filter((s) => s.platform === "cses");
  const bySection = {};
  for (const item of items) {
    bySection[item.folder] = (bySection[item.folder] || 0) + 1;
  }
  const order = Object.keys(bySection).sort((a, b) => a.localeCompare(b));
  const rows = order
    .map((t) => `| [${t}](${folderHref(items, t, `cses/${t}`)}) | ${bySection[t]} |`)
    .join("\n");

  return `## CSES

Solutions from the CSES Problem Set, organized by section.

**Solved: ${items.length}**

| Section | Solved |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

function buildCodechefSection(synced) {
  const items = Object.values(synced).filter((s) => s.platform === "codechef");
  const byRating = {};
  for (const item of items) {
    byRating[item.folder] = (byRating[item.folder] || 0) + 1;
  }
  const order = Object.keys(byRating).sort(sortRatings);
  const rows = order
    .map((r) => `| [${r}](${folderHref(items, r, `codechef/${r}`)}) | ${byRating[r]} |`)
    .join("\n");

  return `## CodeChef

Solutions organized by difficulty rating.

**Solved: ${items.length}**

| Difficulty | Solved |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

const GFG_ORDER = ["School", "Basic", "Easy", "Medium", "Hard"];

function buildGFGSection(synced) {
  const items = Object.values(synced).filter((s) => s.platform === "gfg");
  const byDiff = {};
  for (const item of items) {
    byDiff[item.folder] = (byDiff[item.folder] || 0) + 1;
  }
  const order = Object.keys(byDiff).sort((a, b) => {
    const ai = GFG_ORDER.indexOf(a);
    const bi = GFG_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  const rows = order
    .map((d) => `| [${d}](${folderHref(items, d, `geeksforgeeks/${d}`)}) | ${byDiff[d]} |`)
    .join("\n");

  return `## GeeksforGeeks

Solutions organized by difficulty level.

**Solved: ${items.length}**

| Difficulty | Solved |
| --- | --- |
${rows || "| — | 0 |"}
`;
}

export function buildReadme(synced, handle) {
  const unique = {};
  const seenPaths = new Set();
  for (const [key, item] of Object.entries(synced || {})) {
    if (!item || typeof item !== "object" || typeof item.platform !== "string") continue;
    const identity = typeof item.path === "string" && item.path ? item.path : key;
    if (seenPaths.has(identity)) continue;
    seenPaths.add(identity);
    unique[key] = item;
  }
  const total = Object.keys(unique).length;
  const cf = buildCodeforcesSection(unique, handle);
  const lc = buildLeetcodeSection(unique);
  const cses = buildCsesSection(unique);
  const codechef = buildCodechefSection(unique);
  const gfg = buildGFGSection(unique);

  return `${README_MARKER}
# Competitive Programming Solutions

Synced automatically by SolveBase.

**Total solved: ${total}**

${cf}

${lc}

${cses}

${codechef}

${gfg}

_Last updated: ${new Date().toISOString().slice(0, 10)}_
${README_END_MARKER}
`;
}
