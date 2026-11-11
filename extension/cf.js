// Codeforces platform adapter.
//
// The public API covers submission metadata and problem ratings. Source code
// has no API endpoint, so it is read two ways, in order:
//
//   1. Directly from the worker, using the user's own session cookies (host
//      permission on codeforces.com means our requests carry them). This needs
//      no tab and no content script, so it keeps working when the extension is
//      installed or reloaded while Codeforces tabs are already open.
//   2. As a one-off injected script in any open Codeforces tab, which can use
//      the page's own CSRF token against /data/submitSource.
//
// It never opens or navigates a tab.

import * as store from "./storage.js";

import { createPacer } from "./pace.js";

const pacer = createPacer({ min: 300, max: 20000 });
const { paced, noteOutcome, throttleBackoffMs } = pacer;

const API = "https://codeforces.com/api";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const MIN_RECHECK = 4 * 60 * 60 * 1000; // 4 hours — don't hammer API on repeated failures
const REQUEST_TIMEOUT = 30_000;

const LANG_EXT = [
  [/gnu c\+\+|clang\+\+|ms c\+\+|c\+\+/i, "cpp"],
  [/gnu c\b|c11|c99/i, "c"],
  [/python|pypy/i, "py"],
  [/java\b|java \d/i, "java"],
  [/kotlin/i, "kt"],
  [/c#|mono|\.net/i, "cs"],
  [/rust/i, "rs"],
  [/go\b/i, "go"],
  [/javascript|node/i, "js"],
  [/typescript/i, "ts"],
  [/ruby/i, "rb"],
  [/php/i, "php"],
  [/scala/i, "scala"],
  [/haskell/i, "hs"],
  [/pascal|delphi|fpc/i, "pas"],
  [/perl/i, "pl"],
  [/ocaml/i, "ml"],
  [/d\b/i, "d"],
];

function extFor(language) {
  const hit = LANG_EXT.find(([re]) => re.test(language || ""));
  return hit ? hit[1] : "txt";
}

// GitHub paths and most filesystems choke on these; the contestId+index
// prefix keeps names unique even when sanitization collapses them.
function sanitizeName(name) {
  return (
    (name || "Problem")
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/[\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\.+$/, "")
      .trim()
      .slice(0, 80) || "Problem"
  );
}

function problemKey(sub) {
  const p = sub.problem || {};
  const contest = p.contestId ?? sub.contestId ?? "0";
  const index = p.index ?? sub.problemIndex ?? sub.index ?? "";
  return `${contest}${index}`;
}

function transientError(message, retryAfterMs) {
  const err = new Error(message);
  err.code = "transient";
  if (retryAfterMs) err.retryAfter = retryAfterMs;
  return err;
}

async function apiGet(path) {
  let res;
  try {
    res = await fetch(`${API}/${path}`, {
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
  } catch (e) {
    if (e.name === "TimeoutError" || e.name === "AbortError") {
      throw transientError("Codeforces request timed out — will retry");
    }
    throw transientError(`Codeforces request failed (${e.message}) — will retry`);
  }

  if (res.status === 401 || res.status === 403) {
    const err = new Error("codeforces-auth");
    err.code = "auth";
    throw err;
  }
  if (res.status === 429 || res.status >= 500) {
    const retryAfter = Number(res.headers.get("retry-after") || 0) * 1000;
    throw transientError(
      `Codeforces API is busy (${res.status}) — slowing down`,
      retryAfter || 60_000,
    );
  }
  if (!res.ok) throw new Error(`Codeforces API ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK") throw new Error(json.comment || "Codeforces API error");
  return json.result;
}

export async function getRecentSubmissions(handle, count = 200) {
  return apiGet(`user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`);
}

export async function getContestSubmissions(handle, contestId) {
  return apiGet(
    `contest.status?contestId=${encodeURIComponent(contestId)}&handle=${encodeURIComponent(handle)}&from=1&count=1000`,
  );
}

export async function getSubmission(handle, submissionId, contestId) {
  const submissions = contestId
    ? await getContestSubmissions(handle, contestId)
    : await getRecentSubmissions(handle, 1000);
  return submissions.find((submission) => String(submission.id) === String(submissionId)) || null;
}

export async function getAcceptedSubmissions(handle, count = 200) {
  const list = await getRecentSubmissions(handle, count);
  return list.filter((s) => s.verdict === "OK");
}

export function isFinalAcceptedSubmission(submission) {
  if (submission?.verdict !== "OK") return false;
  const participantType = String(submission.author?.participantType || "").toUpperCase();
  if (!["CONTESTANT", "OUT_OF_COMPETITION", "VIRTUAL"].includes(participantType)) return true;
  return String(submission.testset || "").toUpperCase() !== "PRETESTS";
}

export function isPendingSubmission(submission) {
  const verdict = String(submission?.verdict || "").toUpperCase();
  if (!verdict || verdict === "TESTING") return true;
  return verdict === "OK" && !isFinalAcceptedSubmission(submission);
}

// Only fail when Codeforces explicitly says the handle doesn't exist.
// Network blocks, rate limits and timeouts must never block setup.
export async function handleExists(handle) {
  if (!handle || !handle.trim()) return false;
  try {
    const res = await fetch(`${API}/user.info?handles=${encodeURIComponent(handle.trim())}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    const json = await res.json().catch(() => null);
    if (json && json.status === "FAILED" && /not found/i.test(json.comment || "")) return false;
    return true;
  } catch {
    return true;
  }
}

// ~9k problems. Fetched once, cached, refreshed weekly — never per lookup.
// On repeated failures, wait at least MIN_RECHECK before retrying.
async function getRatingMap() {
  const cached = await store.get(store.KEYS.problemset, null);
  if (cached && Date.now() - cached.fetchedAt < WEEK) return cached.map;
  // Don't re-fetch if a recent attempt failed
  if (cached && cached.failedAt && Date.now() - cached.failedAt < MIN_RECHECK) {
    return cached.map || {};
  }
  try {
    const result = await apiGet("problemset.problems");
    const map = {};
    for (const p of result.problems) {
      if (p.rating) map[`${p.contestId}${p.index}`] = p.rating;
    }
    await store.set(store.KEYS.problemset, { fetchedAt: Date.now(), map });
    return map;
  } catch {
    // Record failure time so we don't hammer the API
    if (cached) {
      await store.set(store.KEYS.problemset, { ...cached, failedAt: Date.now() });
    }
    return cached ? cached.map : {};
  }
}

async function ratingFor(sub) {
  if (sub.problem && sub.problem.rating) return String(sub.problem.rating);
  const map = await getRatingMap();
  const r = map[problemKey(sub)];
  return r ? String(r) : "Unrated";
}

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// Codeforces serves a submission under different paths depending on where it
// was made. All of them are tried when reading source, and the first is used
// for links written to metadata.
function submissionUrls(sub) {
  const contestId = sub.contestId ?? (sub.problem && sub.problem.contestId);
  const participant = (sub.author && sub.author.participantType) || "";
  const urls = [];
  if (participant === "GYM" || Number(contestId) >= 100000) {
    urls.push(`https://codeforces.com/gym/${contestId}/submission/${sub.id}`);
  }
  urls.push(`https://codeforces.com/contest/${contestId}/submission/${sub.id}`);
  urls.push(`https://codeforces.com/problemsets/acmsguru/submission/${contestId}/${sub.id}`);
  return [...new Set(urls)];
}

function submissionUrl(sub) {
  return submissionUrls(sub)[0];
}

class SourceError extends Error {
  constructor(reason, code) {
    super(reason);
    this.code = code; // "transient" | "unavailable" | "parse"
  }
}

function authError(message) {
  const err = new Error(message);
  err.code = "auth";
  return err;
}

const INTERSTITIAL =
  /Just a moment|Checking your browser|cf-browser-verification|Attention Required|DDoS|Please wait while|Service Temporarily Unavailable|502 Bad Gateway|Gateway Time-out/i;
const LOGIN_WALL = /Login into the s(?:ite|ystem)|handleOrEmail|enter\/login/i;

function looksLikeCodeforcesPage(html) {
  return /codeforces/i.test(html) && /<\/html>/i.test(html);
}

// Markup for the source block has changed before, so several shapes are
// accepted rather than one exact regex. Includes textarea variant (2024+).
function extractSource(html) {
  const patterns = [
    /<pre[^>]*id=["']program-source-text["'][^>]*>([\s\S]*?)<\/pre>/i,
    /id=["']program-source-text["'][^>]*>([\s\S]*?)<\/pre>/i,
    /<pre[^>]*class=["'][^"']*prettyprint[^"']*["'][^>]*>([\s\S]*?)<\/pre>/i,
    /<textarea[^>]*id=["']program-source-text["'][^>]*>([\s\S]*?)<\/textarea>/i,
    /<textarea[^>]*class=["'][^"']*prettyprint[^"']*["'][^>]*>([\s\S]*?)<\/textarea>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const text = m[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(?:li|div|p)>/gi, "\n")
        .replace(/<[^>]+>/g, "");
      const decoded = decodeEntities(text);
      if (decoded.trim()) return decoded;
    }
  }
  return null;
}

// Route 1 — the worker asks Codeforces directly. Our own cookies ride along
// because of the host permission, exactly as the session check does.
async function fetchSourceFromPage(sub) {
  let best = null;
  const remember = (err) => {
    const rank = { auth: 3, unavailable: 2, transient: 1 };
    if (!best || (rank[err.code] || 0) > (rank[best.code] || 0)) best = err;
  };

  for (const url of submissionUrls(sub)) {
    let res;
    try {
      res = await fetch(url, {
        credentials: "include",
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch (e) {
      if (e.name === "TimeoutError" || e.name === "AbortError") {
        remember(new SourceError("Codeforces request timed out — will retry", "transient"));
      } else {
        remember(
          new SourceError(`Codeforces request failed (${e.message}) — will retry`, "transient"),
        );
      }
      continue;
    }
    // A submission simply does not live under every URL shape.
    if (res.status === 404) {
      noteOutcome(true);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      noteOutcome(false);
      const err = new SourceError(
        `Codeforces is busy (${res.status}) — slowing down and retrying`,
        "transient",
      );
      err.retryAfter = throttleBackoffMs(res);
      throw err;
    }

    const html = await res.text();
    if (INTERSTITIAL.test(html)) {
      noteOutcome(false);
      const err = new SourceError(
        "Codeforces is throttling requests — slowing down and retrying",
        "transient",
      );
      err.retryAfter = throttleBackoffMs(res);
      throw err;
    }

    const source = extractSource(html);
    if (source) {
      noteOutcome(true);
      return source;
    }

    if (LOGIN_WALL.test(html)) {
      remember(authError("Codeforces session expired — sign in to Codeforces, then retry"));
      continue;
    }
    if (looksLikeCodeforcesPage(html)) {
      noteOutcome(true);
      remember(new SourceError("This submission's source isn't accessible", "unavailable"));
      continue;
    }
    remember(new SourceError("Codeforces blocked the source request — will retry", "transient"));
  }

  throw best || new SourceError("Codeforces did not return the source — will retry", "transient");
}

// Runs inside the Codeforces page (MAIN world), so it has the site's real
// origin, cookies and current CSRF token. Serialized by chrome.scripting, so
// it must be entirely self-contained.
function requestSourceInPage(submissionId) {
  const meta = document.querySelector('meta[name="X-Csrf-Token"]');
  const csrf = (meta && meta.content) || (window.Codeforces && window.Codeforces.csrf) || "";
  if (!csrf) return { ok: false, status: 0, error: "Codeforces session token is unavailable" };
  return fetch("/data/submitSource", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Csrf-Token": csrf,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: new URLSearchParams({ submissionId: String(submissionId), csrf_token: csrf }),
  })
    .then((response) =>
      response.text().then((text) => ({ ok: response.ok, status: response.status, text })),
    )
    .catch((error) => ({ ok: false, status: 0, error: error.message }));
}

function needsTab(message) {
  const err = new Error(message);
  err.code = "needs-tab";
  return err;
}

// Route 2 — borrow an open Codeforces tab.
async function fetchSourceViaTab(submissionId) {
  if (!chrome.scripting?.executeScript) {
    throw needsTab("This browser build can't read Codeforces source from a tab");
  }

  const tabs = await chrome.tabs.query({ url: ["https://codeforces.com/*"] });
  const tab =
    tabs.find((candidate) => Number.isInteger(candidate.id) && candidate.status === "complete") ||
    tabs.find((candidate) => Number.isInteger(candidate.id));
  if (!tab) throw needsTab("Open a signed-in Codeforces tab so the import can read your source");

  let frames;
  try {
    frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: requestSourceInPage,
      args: [String(submissionId)],
    });
  } catch (e) {
    throw needsTab(`Codeforces tab is not reachable (${e.message})`);
  }

  const result = frames && frames[0] ? frames[0].result : null;
  if (!result) throw needsTab("The Codeforces tab returned nothing — leave a Codeforces page open");

  if (result.status >= 500 || result.status === 429) {
    throw new SourceError(
      `Codeforces is temporarily unavailable (${result.status}) — will retry`,
      "transient",
    );
  }
  if (result.status === 401 || result.status === 403) {
    throw authError(
      "Codeforces denied source access — sign in to Codeforces, then retry the import",
    );
  }
  if (!result.ok) {
    throw new SourceError(
      result.error || `Codeforces returned ${result.status || "an error"} — will retry`,
      "transient",
    );
  }

  const text = result.text || "";
  if (INTERSTITIAL.test(text)) {
    throw new SourceError("Codeforces is throttling requests — will retry", "transient");
  }
  if (LOGIN_WALL.test(text) && !/program-source-text/.test(text)) {
    throw authError("Codeforces session expired — sign in to Codeforces, then retry");
  }

  // The endpoint answers with JSON; older deployments answered with markup.
  if (text.trim().startsWith("{")) {
    try {
      const json = JSON.parse(text);
      if (json.source && String(json.source).trim()) return String(json.source);
    } catch {
      // Fall through to the markup readers below.
    }
  }
  const source = extractSource(text);
  if (source) return source;
  const plain = decodeEntities(text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
  if (plain.trim() && !/forbidden|access denied|please wait|error/i.test(plain)) return plain;

  throw new SourceError("This submission's source isn't accessible", "unavailable");
}

async function fetchSource(sub) {
  return paced(async () => {
    let direct;
    try {
      return await fetchSourceFromPage(sub);
    } catch (err) {
      direct = err;
    }

    try {
      return await fetchSourceViaTab(sub.id);
    } catch (tabErr) {
      if (tabErr.code !== "needs-tab") throw tabErr;
      throw direct;
    }
  });
}

// Resilient session check for Codeforces that checks an open tab, then the site itself.
export async function checkSession() {
  // 1. Try checking via open Codeforces tab if available
  if (chrome.tabs?.query && chrome.scripting?.executeScript) {
    try {
      const tabs = await chrome.tabs.query({
        url: ["https://codeforces.com/*"],
      });
      const statuses = await Promise.all(
        tabs
          .filter((tab) => Number.isInteger(tab.id))
          .map((tab) =>
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                func: () => ({
                  hasLogout: Boolean(
                    document.querySelector("a[href*='logout'], a[href*='/logout']"),
                  ),
                  hasProfile: Boolean(document.querySelector(".lang-chooser a[href*='/profile/']")),
                }),
              })
              .then((results) => results?.[0]?.result || null)
              .catch(() => null),
          ),
      );
      if (statuses.some((status) => status?.hasLogout || status?.hasProfile)) {
        return { ok: true, error: null };
      }
    } catch {
      // Tab check failed, fall through to the network probe.
    }
  }

  // Direct fetch fallback
  try {
    const res = await fetch("https://codeforces.com/", {
      credentials: "include",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    // Cloudflare anti-bot challenge returns 403/503 from background workers.
    // This is NOT an auth failure, so treat as OK to prevent false-positive warning banners.
    if (res.status === 401) return { ok: false, error: "Not signed in to Codeforces" };
    if (res.status === 403 || res.status === 429 || res.status >= 500) {
      return { ok: null, error: null };
    }
    const html = await res.text();
    if (INTERSTITIAL.test(html)) {
      return { ok: null, error: null };
    }
    if (/\/logout|Logout/i.test(html)) return { ok: true, error: null };
    if (/handleOrEmail|href=["'][^"']*\/enter/i.test(html)) {
      return { ok: false, error: "Not signed in to Codeforces" };
    }
    return { ok: null, error: null };
  } catch {
    // Network or timeout errors should not trigger a "session expired" banner
    return { ok: null, error: null };
  }
}

// Platform adapter shape used by sync.js.
export const PLATFORM = {
  name: "codeforces",
  label: "Codeforces",
  async fetchMetadata(sub) {
    const key = problemKey(sub);
    const contest = sub.contestId || (sub.problem && sub.problem.contestId) || "0";
    const index = sub.problemIndex || sub.index || (sub.problem && sub.problem.index) || "";
    const rawName = sub.problemName || (sub.problem && sub.problem.name) || `Problem ${key}`;
    const name = sanitizeName(rawName);
    const language = sub.language || sub.programmingLanguage || "C++";
    const ext = extFor(language);
    const rating =
      sub.rating ||
      (await ratingFor({
        ...sub,
        problem: { contestId: contest, index, name, rating: sub.rating },
      }));
    return {
      platform: "codeforces",
      id: String(sub.id),
      key,
      title: name,
      language,
      ext,
      folder: String(rating),
      path: `codeforces/${rating}/${key} - ${name}.${ext}`,
      url: submissionUrl(sub),
      tags: [],
    };
  },
  fetchSource,
};
