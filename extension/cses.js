// CSES platform adapter.
//
// CSES has no public API. Metadata and source are read from its server-rendered
// pages with the user's active CSES session.

import { createPacer } from "./pace.js";
import { sanitizeName, transientError, authError, decodeEntities } from "./adapter-utils.js";

const pacer = createPacer({ min: 250, max: 8000 });
const { paced, noteOutcome, throttleBackoffMs } = pacer;

const CSES = "https://cses.fi";
const REQUEST_TIMEOUT = 20_000;

// CSES problem sections → folder slugs for GitHub layout.
const SECTION_SLUGS = {
  "Introductory Problems": "introductory-problems",
  "Sorting and Searching": "sorting-and-searching",
  "Dynamic Programming": "dynamic-programming",
  "Graph Algorithms": "graph-algorithms",
  "Range Queries": "range-queries",
  "Tree Algorithms": "tree-algorithms",
  Mathematics: "mathematics",
  "String Algorithms": "string-algorithms",
  Geometry: "geometry",
  "Advanced Techniques": "advanced-techniques",
  "Additional Problems": "additional-problems",
};

function slugifySection(name) {
  return (
    SECTION_SLUGS[name] ||
    (name || "misc")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "misc"
  );
}

const LANG_EXT = [
  [/c\+\+|cpp/i, "cpp"],
  [/\bjava\b/i, "java"],
  [/python|pypy/i, "py"],
  [/\bc\b/i, "c"],
  [/rust/i, "rs"],
  [/haskell/i, "hs"],
  [/pascal/i, "pas"],
  [/javascript|node/i, "js"],
  [/kotlin/i, "kt"],
  [/scala/i, "scala"],
  [/go\b/i, "go"],
];

function extFor(language) {
  const hit = LANG_EXT.find(([re]) => re.test(language || ""));
  return hit ? hit[1] : "cpp";
}

function isSessionActive(html) {
  return /href=["'][^"']*\/logout["']|Logout<\/a>/i.test(html || "");
}

function isSessionInactive(html) {
  return /<form[^>]+action=["'][^"']*\/login|href=["'][^"']*\/login["']/i.test(html || "");
}

// Fetch a CSES page with session cookies from background worker.
async function csesGet(path) {
  const url = path.startsWith("http") ? path : `${CSES}${path}`;
  let res;
  try {
    res = await fetch(url, {
      credentials: "include",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
  } catch (e) {
    if (e.name === "TimeoutError" || e.name === "AbortError") {
      throw transientError("CSES request timed out — will retry");
    }
    throw transientError(`CSES request failed (${e.message}) — will retry`);
  }
  if (res.status === 401 || res.status === 403) {
    throw authError("Not signed in to CSES");
  }
  if (res.status === 429 || res.status >= 500) {
    noteOutcome(false);
    // Retry-After when CSES sends one, otherwise the gap we have learned —
    // a flat minute both ignored the server and over-waited on a blip.
    throw transientError(`CSES is busy (${res.status}) — slowing down`, throttleBackoffMs(res));
  }
  if (!res.ok) throw new Error(`CSES ${res.status}`);
  const html = await res.text();
  noteOutcome(true);
  return html;
}

// Fallback: borrow an open CSES tab if background fetch lacks cookies.
async function fetchViaTab(path) {
  if (!chrome.tabs?.query || !chrome.scripting?.executeScript) return null;
  const tabs = await chrome.tabs.query({ url: ["https://cses.fi/*"] });
  const tab = tabs.find((t) => Number.isInteger(t.id));
  if (!tab) return null;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (urlPath) =>
        fetch(urlPath, { credentials: "include" })
          .then((r) => r.text())
          .catch(() => null),
      args: [path],
    });
    return results?.[0]?.result || null;
  } catch {
    return null;
  }
}

async function getPageHtml(path) {
  try {
    const html = await csesGet(path);
    if (isSessionActive(html)) return html;
    const tabHtml = await fetchViaTab(path);
    if (tabHtml && isSessionActive(tabHtml)) return tabHtml;
    return html;
  } catch (err) {
    const tabHtml = await fetchViaTab(path);
    if (tabHtml) return tabHtml;
    throw err;
  }
}

export async function checkSession() {
  try {
    const html = await getPageHtml("/problemset/");
    const ok = isSessionActive(html);
    const profilePath = ok ? html.match(/href=["'](\/user\/\d+)["']/i)?.[1] : null;
    if (!ok && !isSessionInactive(html)) return { ok: null, error: null };
    return {
      ok,
      error: ok ? null : "Not signed in to CSES",
      profileUrl: profilePath ? `${CSES}${profilePath}` : null,
    };
  } catch (e) {
    return e?.code === "auth" ? { ok: false, error: e.message } : { ok: null, error: null };
  }
}

// Robust task list parsing that handles arbitrary whitespace and newlines.
function parseProblemList(html) {
  const sections = html.split(/<h2>/i).slice(1);
  const allTasks = {};

  for (const section of sections) {
    const sectionNameMatch = section.match(/^([^<]+)/);
    const sectionName = sectionNameMatch ? sectionNameMatch[1].trim() : "misc";

    // Split section by <li class="task"
    const items = section.split(/<li\s+class=["']task["']/i).slice(1);
    for (const item of items) {
      const taskMatch = item.match(/href=["']\/problemset\/task\/(\d+)["'][^>]*>([^<]+)<\/a>/i);
      if (!taskMatch) continue;

      const taskId = taskMatch[1];
      const taskName = taskMatch[2].trim();
      allTasks[taskId] = { name: taskName, section: sectionName };
    }
  }

  return allTasks;
}

let problemMapCache = null;
let problemMapAt = 0;
const MAP_TTL = 24 * 60 * 60 * 1000;

async function getProblemMap() {
  if (problemMapCache && Date.now() - problemMapAt < MAP_TTL) return problemMapCache;
  const html = await getPageHtml("/problemset/");
  const allTasks = parseProblemList(html);
  problemMapCache = allTasks;
  problemMapAt = Date.now();
  return allTasks;
}

// Look for submission result IDs for a given task.
async function findLatestSubmission(taskId) {
  // Try both /problemset/task/ID/ and /problemset/task/ID
  let html = await getPageHtml(`/problemset/task/${taskId}/`);
  if (!isSessionActive(html)) {
    html = await getPageHtml(`/problemset/task/${taskId}`);
  }

  if (!isSessionActive(html)) {
    throw authError("Not signed in to CSES");
  }

  // Broad search for any result URLs anywhere in the page:
  // href="/problemset/result/1234567/", /result/1234567/, etc.
  const subPattern = /(?:\/problemset)?\/result\/(\d+)/gi;
  const matches = [...html.matchAll(subPattern)];
  const allIds = matches.map((m) => m[1]);

  if (allIds.length > 0) {
    // Sort descending to get the most recent submission ID
    const unique = [...new Set(allIds)].sort((a, b) => Number(b) - Number(a));
    return unique[0];
  }

  return null;
}

export async function inspectSubmission(resultId, expectedTaskId = "") {
  if (!/^\d+$/.test(String(resultId || ""))) return { status: "waiting" };
  const html = await getPageHtml(`/problemset/result/${resultId}/`);
  if (!isSessionActive(html)) throw authError("Not signed in to CSES");
  const taskId = taskIdFromResult(html);
  if (expectedTaskId && taskId && String(expectedTaskId) !== taskId) {
    return { status: "rejected" };
  }
  if (isAcceptedResult(html)) return { status: "accepted", taskId: taskId || expectedTaskId };
  if (/WRONG ANSWER|TIME LIMIT EXCEEDED|RUNTIME ERROR|COMPILE ERROR|REJECTED/i.test(html)) {
    return { status: "rejected" };
  }
  return { status: "waiting" };
}

// Extract source code from a CSES result page.
function extractSource(html) {
  const patterns = [
    /<pre[^>]*class=["'][^"']*(?:prettyprint|linenums|source|code)[^"']*["'][^>]*>([\s\S]*?)<\/pre>/i,
    /<pre[^>]*id=["'][^"']*(?:source|code|program-source-text)[^"']*["'][^>]*>([\s\S]*?)<\/pre>/i,
    /<code[^>]*class=["'][^"']*(?:source|code)[^"']*["'][^>]*>([\s\S]*?)<\/code>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/i,
    /<pre[^>]*>([\s\S]{5,}?)<\/pre>/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      let text = m[1];
      // If code was wrapped in <ol class="linenums"><li>...</li></ol>
      if (/<li/i.test(text)) {
        text = text
          .split(/<\/li>/i)
          .map((line) => line.replace(/<[^>]+>/g, ""))
          .join("\n");
      } else {
        text = text
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/(?:p|div)>/gi, "\n")
          .replace(/<[^>]+>/g, "");
      }
      const decoded = decodeEntities(text);
      if (decoded.trim()) return decoded.trim();
    }
  }
  return null;
}

// Extract programming language from result page.
function extractLanguage(html) {
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      decodeEntities(cell[1].replace(/<[^>]+>/g, "")).trim(),
    );
    if (/^(?:Language|Compiler)\s*:?$/i.test(cells[0] || "")) return cells[1] || "";
  }
  const m =
    html.match(/(?:Language|Compiler)[:\s]*<[^>]*>([^<]+)/i) ||
    html.match(/(?:Language|Compiler)[:\s]*([a-zA-Z0-9+#.]+)/i);
  return m ? m[1].trim() : "";
}

// Detect whether the result page indicates an accepted solution.
function isAcceptedResult(html) {
  const resultRow = html.match(/<tr\b[^>]*>[\s\S]*?\bResult\b[\s\S]*?<\/tr>/i)?.[0] || html;
  if (/WRONG ANSWER|TIME LIMIT EXCEEDED|RUNTIME ERROR|COMPILE ERROR/i.test(resultRow)) {
    return false;
  }
  return (
    /\bACCEPTED\b/i.test(resultRow) ||
    /100\s*\/\s*100/.test(resultRow) ||
    /task-score[^>]*?full/i.test(resultRow)
  );
}

function taskIdFromResult(html) {
  return html.match(/\/problemset\/task\/(\d+)/i)?.[1] || null;
}

// Metadata and source must describe the same accepted result. Cache only
// verified results, so a pending verdict can still be checked again.
const detailsCache = new Map();
const DETAILS_CACHE_MAX = 50;

async function submissionDetails(sub) {
  const resultId = String(
    sub.resultId || (await paced(() => findLatestSubmission(sub.taskId || sub.id))) || "",
  );
  if (!resultId) {
    const err = new Error(`No submission found for CSES task ${sub.taskId || sub.id}`);
    err.code = "unavailable";
    throw err;
  }
  let details = detailsCache.get(resultId);
  if (!details)
    details = await paced(async () => {
      const html = await getPageHtml(`/problemset/result/${resultId}/`);
      if (!isSessionActive(html)) {
        throw authError("CSES session expired — sign in to cses.fi, then retry");
      }

      if (!isAcceptedResult(html)) {
        const err = new Error(`CSES submission #${resultId} is not accepted`);
        err.code = "unavailable";
        throw err;
      }

      const source = extractSource(html);
      if (!source) {
        const err = new Error(`Could not read source from CSES submission #${resultId}`);
        err.code = "unavailable";
        throw err;
      }

      return { resultId, taskId: taskIdFromResult(html), language: extractLanguage(html), source };
    });
  if (sub.taskId && details.taskId && String(sub.taskId) !== details.taskId) {
    const err = new Error(`CSES submission #${resultId} belongs to a different task`);
    err.code = "unavailable";
    throw err;
  }
  if (!detailsCache.has(resultId)) {
    if (detailsCache.size >= DETAILS_CACHE_MAX)
      detailsCache.delete(detailsCache.keys().next().value);
    detailsCache.set(resultId, details);
  }
  // Keep task-only fallback calls pinned to the result chosen for metadata.
  sub.resultId = resultId;
  return details;
}

async function fetchSource(sub) {
  return (await submissionDetails(sub)).source;
}

function submissionUrl(taskId) {
  return `${CSES}/problemset/task/${taskId}`;
}

// Platform adapter shape used by sync.js.
export const PLATFORM = {
  name: "cses",
  label: "CSES",
  async fetchMetadata(sub) {
    const details = await submissionDetails(sub);
    const taskId = sub.taskId || details.taskId || String(sub.id);
    let problemInfo = null;
    try {
      const map = await getProblemMap();
      problemInfo = map[taskId];
    } catch {
      // Fallback
    }

    const name = sanitizeName(problemInfo?.name || sub.name || sub.title || "Problem");
    const section = problemInfo?.section || sub.section || "misc";
    const folder = slugifySection(section);
    const language = details.language || sub.language || "";
    const ext = extFor(language);

    return {
      platform: "cses",
      id: details.resultId,
      key: taskId,
      title: name,
      language,
      ext,
      folder,
      path: `cses/${folder}/${taskId} - ${name}.${ext}`,
      url: submissionUrl(taskId),
      tags: [folder],
    };
  },
  fetchSource,
};
