// CodeChef metadata is verified through its submission-details endpoint. Source
// is then read from viewplaintext with the user's active session.

import * as store from "./storage.js";

import { createPacer } from "./pace.js";
import { sanitizeName, transientError, authError, decodeEntities } from "./adapter-utils.js";

const pacer = createPacer({ min: 300, max: 10000 });
const { paced, noteOutcome, throttleBackoffMs } = pacer;

const CODECHEF = "https://www.codechef.com";
const REQUEST_TIMEOUT = 25_000;

const LANG_EXT = [
  [/c\+\+|cpp|gcc|g\+\+|clang/i, "cpp"],
  [/python|pypy/i, "py"],
  [/\bjava\b/i, "java"],
  [/rust/i, "rs"],
  [/\bc\b|c11|clang/i, "c"],
  [/c#|csharp|\.net/i, "cs"],
  [/go\b|golang/i, "go"],
  [/kotlin/i, "kt"],
  [/javascript|node/i, "js"],
  [/typescript/i, "ts"],
  [/ruby/i, "rb"],
  [/swift/i, "swift"],
  [/haskell/i, "hs"],
  [/d\b/i, "d"],
  [/scala/i, "scala"],
  [/nim/i, "nim"],
  [/lua/i, "lua"],
  [/pascal/i, "pas"],
  [/php/i, "php"],
  [/perl/i, "pl"],
  [/bash|sh/i, "sh"],
];

function extFor(language) {
  const hit = LANG_EXT.find(([re]) => re.test(language || ""));
  return hit ? hit[1] : "cpp";
}

export async function handleExists(handle) {
  if (!handle) return false;
  try {
    const res = await fetch(`${CODECHEF}/users/${encodeURIComponent(handle)}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    return res.status !== 404;
  } catch {
    return true;
  }
}

export async function checkSession() {
  if (chrome.tabs?.query && chrome.scripting?.executeScript) {
    try {
      const tabs = await chrome.tabs.query({
        url: ["https://*.codechef.com/*", "https://codechef.com/*"],
      });
      const statuses = await Promise.all(
        tabs
          .filter((entry) => Number.isInteger(entry.id))
          .map((tab) =>
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                func: () => ({
                  signedIn: Boolean(
                    document.querySelector(
                      "a[href*='logout'], a[href*='/users/'], [class*='profile'] img, [class*='avatar'] img",
                    ),
                  ),
                }),
              })
              .then((results) => results?.[0]?.result || null)
              .catch(() => null),
          ),
      );
      if (statuses.some((status) => status?.signedIn)) return { ok: true, error: null };
    } catch {
      // Fall through to the authenticated homepage probe.
    }
  }

  try {
    const response = await fetch(`${CODECHEF}/`, {
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (response.status === 401) return { ok: false, error: "Not signed in to CodeChef" };
    if (response.status === 403 || response.status === 429 || response.status >= 500) {
      return { ok: null, error: null };
    }
    const html = await response.text();
    if (/href=["'][^"']*logout/i.test(html)) return { ok: true, error: null };
    if (/href=["'][^"']*(?:login|accounts\/login)/i.test(html)) {
      return { ok: false, error: "Not signed in to CodeChef" };
    }
    return { ok: null, error: null };
  } catch {
    return { ok: null, error: null };
  }
}

const metaCache = new Map();
const META_TTL = 7 * 24 * 60 * 60 * 1000;

async function getSubmissionDetails(submissionId) {
  const hit = metaCache.get(submissionId);
  if (hit && Date.now() - hit.at < META_TTL) return hit.data;

  try {
    const res = await fetch(`${CODECHEF}/api/submission-details/${submissionId}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (res.ok) {
      const json = await res.json();
      const root = json?.data || json || {};
      const result = root.submitResult || root.submit_result || root;
      const details = root.other_details || root.otherDetails || {};
      const verdict = String(
        result.result_code ||
          root.result_code ||
          root.verdict ||
          root.status_msg ||
          details.resultCode ||
          details.result_code ||
          "",
      ).toLowerCase();
      const language =
        details.language || result.language || result.language_name || root.language || "";
      const data = {
        problemCode: details.problemCode || root.problemCode || "",
        problemName: details.problemName || root.problemName || details.problemCode || "",
        contestCode: details.contestCode || root.contestCode || "practice",
        language,
        owner:
          details.submissionOwnerHandle ||
          details.userHandle ||
          details.username ||
          root.username ||
          "",
        accepted:
          verdict === "accepted" ||
          verdict === "ac" ||
          verdict === "correct answer" ||
          Number(result.status_code || root.status_code || details.statusCode) === 15,
        verdictKnown: Boolean(
          verdict || result.status_code || root.status_code || details.statusCode,
        ),
      };
      if (data.accepted) metaCache.set(submissionId, { at: Date.now(), data });
      return data;
    }
  } catch {
    // Fallback
  }
  return null;
}

export async function inspectSubmission(submissionId) {
  const details = await getSubmissionDetails(submissionId);
  if (!details || !details.verdictKnown) return { status: "waiting" };
  return {
    status: details.accepted ? "accepted" : "rejected",
    problemCode: details.problemCode || "",
  };
}

// Fallback: borrow an open CodeChef tab to extract source.
async function fetchSourceViaTab(submissionId) {
  if (!chrome.tabs?.query || !chrome.scripting?.executeScript) return null;
  const tabs = await chrome.tabs.query({ url: ["https://www.codechef.com/*"] });
  const tab = tabs.find((t) => Number.isInteger(t.id));
  if (!tab) return null;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (sId) =>
        fetch(`https://www.codechef.com/viewplaintext/${sId}`, { credentials: "include" })
          .then((r) => r.text())
          .catch(() => null),
      args: [String(submissionId)],
    });
    return results?.[0]?.result || null;
  } catch {
    return null;
  }
}

function extractSource(html) {
  const patterns = [
    /<pre[^>]*>([\s\S]*?)<\/pre>/i,
    /<code[^>]*>([\s\S]*?)<\/code>/i,
    /<textarea[^>]*id=["']plaintext["'][^>]*>([\s\S]*?)<\/textarea>/i,
    /<textarea[^>]*>([\s\S]*?)<\/textarea>/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const text = decodeEntities(m[1]);
      if (text.trim()) return text.trim();
    }
  }
  return null;
}

async function fetchSource(sub) {
  return paced(async () => {
    const subId = sub.id;
    const url = `${CODECHEF}/viewplaintext/${subId}`;

    try {
      const apiResponse = await fetch(`${CODECHEF}/api/submission-code/${subId}`, {
        credentials: "include",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      if (apiResponse.ok) {
        const json = await apiResponse.json();
        const root = json?.data || json || {};
        const apiSource = root.code || root.sourceCode || root.source || root.solution || "";
        if (typeof apiSource === "string" && apiSource.trim()) return apiSource;
      }
    } catch {
      // Fall back to the plaintext submission page below.
    }

    let html;
    try {
      const res = await fetch(url, {
        credentials: "include",
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      if (res.status === 401 || res.status === 403) {
        throw authError("CodeChef session expired — sign in to codechef.com, then retry");
      }
      if (res.status === 429 || res.status >= 500) {
        noteOutcome(false);
        throw transientError(
          `CodeChef is busy (${res.status}) — will retry`,
          throttleBackoffMs(res),
        );
      }
      html = await res.text();
      noteOutcome(true);
    } catch (err) {
      if (err.code === "auth" || err.code === "transient") throw err;
      html = await fetchSourceViaTab(subId);
      if (!html) throw err;
    }

    const source = extractSource(html);
    if (!source) {
      const tabHtml = await fetchSourceViaTab(subId);
      if (tabHtml) {
        const tabSource = extractSource(tabHtml);
        if (tabSource) return tabSource;
      }
      const err = new Error(`Could not read source code from CodeChef submission #${subId}`);
      err.code = "unavailable";
      throw err;
    }

    return source;
  });
}

function submissionUrl(contestCode, problemCode) {
  if (!contestCode || contestCode === "practice") {
    return `${CODECHEF}/problems/${problemCode}`;
  }
  return `${CODECHEF}/${contestCode}/problems/${problemCode}`;
}

// Fetch problem difficulty rating from CodeChef API.
const ratingCache = new Map();
const RATING_TTL = 7 * 24 * 60 * 60 * 1000;

function bucket(value) {
  const r = Number(value);
  if (!r || r <= 0) return null;
  return String(Math.floor(r / 100) * 100);
}

// CodeChef exposes the rating under different keys depending on whether the
// problem is asked for through its contest or through PRACTICE, so try both
// before giving up and calling it Unrated.
async function getProblemRating(problemCode, contestCode) {
  if (!problemCode) return "Unrated";
  const hit = ratingCache.get(problemCode);
  if (hit && Date.now() - hit.at < RATING_TTL) return hit.rating;

  const contests = [];
  if (contestCode && contestCode !== "practice") contests.push(contestCode);
  contests.push("PRACTICE");

  for (const contest of contests) {
    try {
      const res = await fetch(`${CODECHEF}/api/contests/${contest}/problems/${problemCode}`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const folder =
        bucket(data.difficulty_rating) ||
        bucket(data.problem_difficulty_rating) ||
        bucket(data.problemDifficultyRating) ||
        bucket(data?.problem_data?.difficulty_rating);
      if (folder) {
        ratingCache.set(problemCode, { at: Date.now(), rating: folder });
        return folder;
      }
    } catch {
      // try the next source
    }
  }

  return "Unrated";
}

export const PLATFORM = {
  name: "codechef",
  label: "CodeChef",
  async fetchMetadata(sub) {
    const details = await getSubmissionDetails(sub.id).catch(() => null);
    if (!details) {
      throw transientError(`CodeChef could not verify submission #${sub.id} yet`);
    }
    if (!details.verdictKnown) {
      throw transientError(`CodeChef has not returned a verdict for submission #${sub.id} yet`);
    }
    if (!details.accepted) {
      throw new Error(`CodeChef submission #${sub.id} is not accepted`);
    }
    const config = await store.getConfig();
    const expectedOwner = config?.codechefHandle || "";
    if (!expectedOwner || !details.owner) {
      throw new Error(`CodeChef could not verify the owner of submission #${sub.id}`);
    }
    if (details.owner.toLowerCase() !== expectedOwner.toLowerCase()) {
      throw new Error(`CodeChef submission #${sub.id} belongs to another account`);
    }

    const problemCode = String(details.problemCode || sub.problemCode || "");
    if (!/^[A-Za-z0-9_]{1,64}$/.test(problemCode)) {
      throw new Error(`CodeChef returned an invalid problem code for submission #${sub.id}`);
    }
    const problemName = sanitizeName(details.problemName || sub.problemName || problemCode);
    const contestCode = String(details.contestCode || sub.contestCode || "practice");
    if (!/^[A-Za-z0-9_]{1,64}$/.test(contestCode)) {
      throw new Error(`CodeChef returned an invalid contest code for submission #${sub.id}`);
    }
    // Ask the contest the submission belongs to first — PRACTICE alone often
    // reports no rating and everything ended up in codechef/Unrated.
    const ratingFolder = await getProblemRating(problemCode, contestCode).catch(() => "Unrated");
    const language = details.language || sub.language || "";
    const ext = extFor(language);

    // Rating-wise folder: e.g. "1600", "900", "500", "Unrated" (just like Codeforces)
    const folder = ratingFolder || "Unrated";
    const title = `${problemCode} - ${problemName}`;

    return {
      platform: "codechef",
      id: String(sub.id),
      key: problemCode,
      title: problemName,
      language,
      ext,
      folder,
      path: `codechef/${folder}/${title}.${ext}`,
      url: submissionUrl(contestCode, problemCode),
      tags: [folder],
    };
  },
  fetchSource,
};
