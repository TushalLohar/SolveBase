// LeetCode platform adapter.
//
// Everything goes through LeetCode's GraphQL API using the user's logged-in
// session cookies. DOM scraping was removed: it could pick up code that did
// not belong to the submission (editorial/community snippets) and mismatch
// problem titles.

import { authError, transientError } from "./adapter-utils.js";

const LC = "https://leetcode.com";
const REQUEST_TIMEOUT = 20_000;

const LANG_EXT = [
  [/python/i, "py"],
  [/java(?!script)/i, "java"],
  [/cpp|c\+\+/i, "cpp"],
  [/javascript/i, "js"],
  [/typescript/i, "ts"],
  [/kotlin/i, "kt"],
  [/csharp|c#|dotnet/i, "cs"],
  [/ruby/i, "rb"],
  [/php/i, "php"],
  [/swift/i, "swift"],
  [/golang|^go$/i, "go"],
  [/rust/i, "rs"],
  [/scala/i, "scala"],
  [/racket/i, "rkt"],
  [/erlang/i, "erl"],
  [/elixir/i, "ex"],
  [/dart/i, "dart"],
  [/mysql|mssql|oraclesql|postgresql|sql/i, "sql"],
  [/^c$/i, "c"],
];

function extFor(language) {
  const hit = LANG_EXT.find(([re]) => re.test(language || ""));
  return hit ? hit[1] : "txt";
}

function sanitizeName(name) {
  return (
    (name || "Problem")
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/[\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/\.+$/, "")
      .trim()
      .slice(0, 80) || "Problem"
  );
}

function slugifyTag(tag) {
  return String(tag)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Default topic priority. Earlier items win when a problem has several tags.
const DEFAULT_TOPIC_PRIORITY = [
  "binary-search",
  "dynamic-programming",
  "graph",
  "tree",
  "trie",
  "heap-priority-queue",
  "union-find",
  "segment-tree",
  "binary-tree",
  "breadth-first-search",
  "depth-first-search",
  "backtracking",
  "two-pointers",
  "sliding-window",
  "stack",
  "queue",
  "linked-list",
  "hash-table",
  "array",
  "string",
  "math",
  "greedy",
  "sorting",
  "bit-manipulation",
  "recursion",
  "matrix",
  "simulation",
  "design",
];

function pickPrimaryTopic(tags) {
  const priority = DEFAULT_TOPIC_PRIORITY;
  const tagSlugs = (tags || []).map((t) =>
    typeof t === "string" ? slugifyTag(t) : t.slug || slugifyTag(t.name),
  );
  for (const topic of priority) {
    if (tagSlugs.includes(topic)) return topic;
  }
  return tagSlugs[0] || "misc";
}

function problemUrl(slug) {
  return `${LC}/problems/${slug}/`;
}

// LeetCode throttles hard, and a throttled reply looks a lot like a signed-out
// one. Every GraphQL call goes through here so requests are paced.
const jitter = (min, max) => min + Math.random() * (max - min);
let chain = Promise.resolve();
function paced(task) {
  const run = chain.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, jitter(120, 260)));
    return task();
  });
  chain = run.catch(() => {});
  return run;
}

async function csrfToken() {
  try {
    const cookie = await chrome.cookies.get({ url: LC, name: "csrftoken" });
    return cookie ? cookie.value : "";
  } catch {
    return "";
  }
}

async function gql(query, variables, operationName) {
  return paced(async () => {
    const token = await csrfToken();
    let res;
    try {
      res = await fetch(`${LC}/graphql`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-csrftoken": token } : {}),
          ...(operationName ? { "x-operation-name": operationName } : {}),
        },
        body: JSON.stringify({ query, variables, operationName }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch (e) {
      if (e.name === "TimeoutError" || e.name === "AbortError") {
        throw transientError("LeetCode request timed out — will retry");
      }
      throw transientError(`LeetCode request failed (${e.message}) — will retry`);
    }
    // Throttling is temporary and must never be mistaken for a dead session.
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") || 0) * 1000;
      const wait = retryAfter || 60000;
      throw transientError(
        `LeetCode is rate limiting — retrying in ${Math.round(wait / 1000)}s`,
        wait,
      );
    }
    if (res.status >= 500) {
      throw transientError(`LeetCode is temporarily unavailable (${res.status}) — will retry`);
    }
    if (res.status === 401 || res.status === 403) {
      throw authError("Not signed in to LeetCode");
    }
    if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}`);
    const json = await res.json();
    if (json.errors && json.errors.length) {
      const message = json.errors[0].message || "LeetCode GraphQL error";
      if (/rate limit|too many requests|throttl/i.test(message)) {
        throw transientError("LeetCode is rate limiting — will retry", 60000);
      }
      if (/authenticat|permission|signed in/i.test(message)) {
        throw authError("Not signed in to LeetCode — sign in to LeetCode, then retry");
      }
      throw new Error(message);
    }
    return json.data || {};
  });
}

// Cache submission details across source and metadata requests.
// LRU eviction at 50 entries using Map insertion order.
const detailsCache = new Map();
const DETAILS_CACHE_MAX = 50;

function detailsCacheSet(key, value) {
  if (detailsCache.size >= DETAILS_CACHE_MAX) {
    const oldest = detailsCache.keys().next().value;
    detailsCache.delete(oldest);
  }
  detailsCache.set(key, value);
}

const SUBMISSION_DETAILS = `
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    code
    lang { name verboseName }
    statusCode
    question { questionId questionFrontendId title titleSlug topicTags { name slug } }
  }
}`;

// Flag to prevent recursive throttle detection loops
let _checkingAuth = false;

async function submissionDetails(id, slug = null) {
  let numericId = Number(id);
  if (!Number.isInteger(numericId) || Number.isNaN(numericId) || numericId <= 0) {
    try {
      const recent = await fetchSubmissions(10);
      const match = slug ? recent.find((s) => s.slug === slug) : recent[0];
      if (match && match.id && Number(match.id) > 0) {
        numericId = Number(match.id);
      }
    } catch {
      // Fall through
    }
  }

  if (!Number.isInteger(numericId) || Number.isNaN(numericId) || numericId <= 0) {
    throw new Error(`Invalid LeetCode submission ID: ${id}`);
  }

  const key = String(numericId);
  if (detailsCache.has(key)) return detailsCache.get(key);
  const data = await gql(SUBMISSION_DETAILS, { submissionId: numericId }, "submissionDetails");
  const details = data.submissionDetails;
  // A null body means one of two very different things: the session is gone,
  // or LeetCode is shedding load. Asking who we are costs one call and tells
  // them apart — but guard against recursive throttle detection.
  if (!details) {
    if (!_checkingAuth) {
      _checkingAuth = true;
      try {
        await username();
      } finally {
        _checkingAuth = false;
      }
    }
    throw transientError("LeetCode did not return this submission yet — will retry");
  }
  if (!details.code || details.code.length < 2) {
    const err = new Error("LeetCode has not returned source for this submission yet");
    err.code = "unavailable";
    throw err;
  }
  if (Number(details.statusCode) !== 10) {
    const err = new Error(`LeetCode has not confirmed submission #${numericId} as accepted yet`);
    err.code = "unavailable";
    throw err;
  }
  detailsCacheSet(key, details);
  return details;
}

async function username() {
  const data = await gql(
    "query globalData { userStatus { isSignedIn username } }",
    {},
    "globalData",
  );
  const status = data.userStatus;
  if (!status || !status.isSignedIn) throw authError("Not signed in to LeetCode");
  return status.username;
}

// Recent accepted submissions for the signed-in user. LeetCode caps this at 20.
export async function fetchSubmissions(limit = 20) {
  const user = await username();
  const data = await gql(
    `query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id title titleSlug timestamp
      }
    }`,
    { username: user, limit: Math.min(limit, 20) },
    "recentAcSubmissions",
  );
  const list = data.recentAcSubmissionList || [];
  return list.map((s) => ({
    id: String(s.id),
    title: s.title,
    slug: s.titleSlug,
    timestamp: Number(s.timestamp || 0) * 1000,
  }));
}

async function fetchSource(sub) {
  const details = await submissionDetails(sub.id, sub.slug);
  return details.code;
}

export async function checkSession() {
  try {
    const user = await username();
    return {
      ok: true,
      error: null,
      profileUrl: `${LC}/u/${encodeURIComponent(user)}/`,
    };
  } catch (e) {
    return e?.code === "auth" ? { ok: false, error: e.message } : { ok: null, error: null };
  }
}

export const PLATFORM = {
  name: "leetcode",
  label: "LeetCode",
  async fetchMetadata(sub) {
    const details = await submissionDetails(sub.id, sub.slug);
    const q = details.question || {};
    const slug = q.titleSlug || sub.slug || String(sub.id);
    const tags = (q.topicTags || []).map((t) => t.slug || t.name);
    const topic = pickPrimaryTopic(tags);
    const title = q.title || sub.title || slug.replace(/-/g, " ");
    const language = details.lang?.name || details.lang?.verboseName || sub.language || "";
    const ext = extFor(language);
    const name = sanitizeName(title);
    const rawNumber = q.questionFrontendId || sub.problemId || "";
    const number = rawNumber ? sanitizeName(String(rawNumber)) : "";
    return {
      platform: "leetcode",
      id: String(sub.id),
      key: number ? String(number) : slug,
      title: name,
      language,
      ext,
      folder: topic,
      path: `leetcode/${topic}/${number ? number + "-" : ""}${name}.${ext}`,
      url: problemUrl(slug),
      tags,
    };
  },
  fetchSource,
};
