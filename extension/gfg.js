// GeeksforGeeks platform adapter.
//
// GFG publishes no stable API for submission source, so source is read from the
// signed-in editor or a known practice endpoint. Missing source fails the sync.

import * as store from "./storage.js";
import { createPacer } from "./pace.js";
import { sanitizeName, transientError } from "./adapter-utils.js";

const GFG_API = "https://practiceapi.geeksforgeeks.org/api/vr/user/problems/submissions/";
const REQUEST_TIMEOUT = 15_000;

const DIFFICULTIES = ["School", "Basic", "Easy", "Medium", "Hard"];

const EXT_BY_LANG = {
  cpp: "cpp",
  "c++": "cpp",
  "c++14": "cpp",
  "c++17": "cpp",
  "c++20": "cpp",
  c: "c",
  java: "java",
  java8: "java",
  java11: "java",
  python: "py",
  python3: "py",
  py: "py",
  py3: "py",
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  csharp: "cs",
  "c#": "cs",
  golang: "go",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  php: "php",
  ruby: "rb",
  swift: "swift",
};

function extFor(language) {
  if (!language) return "cpp";
  const cleaned = language.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  return EXT_BY_LANG[cleaned] || EXT_BY_LANG[language.toLowerCase()] || "cpp";
}

function normalizeDifficulty(diff) {
  const lower = String(diff || "")
    .toLowerCase()
    .trim();
  const hit = DIFFICULTIES.find((d) => d.toLowerCase() === lower);
  return hit || "Easy";
}

// The title is used only for the human-readable filename.
function keyFor(sub) {
  return sanitizeName(sub.title || sub.name || sub.slug || String(sub.id));
}

// GFG exposes no submission ID. A content-derived ID deduplicates the same
// solution while still allowing a changed solution to sync.
export function submissionIdFor(slug, source) {
  let hash = 5381;
  const text = String(source || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return `${slug || "problem"}:${(hash >>> 0).toString(36)}`;
}

const pacer = createPacer({ min: 250, max: 8000 });
const { paced, noteOutcome, throttleBackoffMs } = pacer;

// No User-Agent header: it is a forbidden header name, so the browser dropped
// the old one silently and the request went out with Chrome's own anyway.
async function api(body) {
  return paced(async () => {
    let res;
    try {
      res = await fetch(GFG_API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch (e) {
      noteOutcome(false);
      if (e.name === "TimeoutError" || e.name === "AbortError") {
        throw transientError("GeeksforGeeks request timed out — will retry");
      }
      throw transientError(`GeeksforGeeks request failed (${e.message}) — will retry`);
    }
    if (res.status === 406 || res.status === 404) {
      throw new Error(`GeeksforGeeks user "${body.handle}" not found — check the username`);
    }
    if (res.status === 429 || res.status >= 500) {
      noteOutcome(false);
      const retryAfter = Number(res.headers.get("retry-after") || 0) * 1000;
      throw transientError(
        `GeeksforGeeks is busy (${res.status}) — slowing down`,
        retryAfter || throttleBackoffMs(res),
      );
    }
    if (!res.ok) throw new Error(`GeeksforGeeks API returned HTTP ${res.status}`);
    noteOutcome(true);
    return res.json();
  });
}

export async function handleExists(handle) {
  if (!handle) return false;
  try {
    await api({ handle: handle.trim(), request_type: "solved", page: 1 });
    return true;
  } catch {
    // Network/CORS hiccups must not block setup.
    return true;
  }
}

export async function findSolved(handle, slug, submittedAt) {
  if (!handle || !slug || !Number.isFinite(Number(submittedAt))) return null;
  const payload = await api({ handle: handle.trim(), request_type: "solved", page: 1 });
  const target = String(slug).toLowerCase();
  const groups = payload?.result && typeof payload.result === "object" ? payload.result : {};
  for (const [difficulty, entries] of Object.entries(groups)) {
    if (!entries || typeof entries !== "object") continue;
    for (const [id, item] of Object.entries(entries)) {
      if (!item || typeof item !== "object") continue;
      if (String(item.slug || "").toLowerCase() !== target) continue;
      const rawTime = String(item.user_subtime || "").trim();
      const timestamp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawTime)
        ? Date.parse(`${rawTime.replace(" ", "T")}+05:30`)
        : Date.parse(rawTime);
      if (!Number.isFinite(timestamp) || timestamp < Number(submittedAt) - 2 * 60 * 1000) {
        continue;
      }
      return {
        id: String(id),
        slug,
        title: item.pname || undefined,
        difficulty: difficulty || undefined,
        language: item.lang || undefined,
        submittedAt: timestamp,
      };
    }
  }
  return null;
}

// The practice API answers for any public handle, so a successful reply says
// nothing about *our* session. What matters for syncing is whether the code is
// reachable, which needs the site's own cookies or an open tab.
export async function checkSession() {
  const config = await store.getConfig();
  // Platforms are enabled by default. Someone who never set up GeeksforGeeks
  // should not be shown a red "session expired" banner for it.
  if (!config?.gfgHandle) return { ok: true, error: null };

  if (chrome.tabs?.query && chrome.scripting?.executeScript) {
    try {
      const tabs = await chrome.tabs.query({
        url: ["https://*.geeksforgeeks.org/*", "https://geeksforgeeks.org/*"],
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
                      "a[href*='logout'], a[href*='/user/'], [class*='profile'] img, [class*='avatar'] img",
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
      return { ok: null, error: null };
    }
  }

  return { ok: null, error: null };
}

// Reads the editor's own model instead of the rendered DOM. Monaco virtualizes:
// only the lines inside the viewport exist as elements, so the old approach of
// joining `.view-line` text silently truncated every solution taller than the
// editor — and returned Monaco's non-breaking spaces as indentation.
export async function readEditorFromTab(tabId) {
  if (!Number.isInteger(tabId) || !chrome.scripting?.executeScript) return null;
  try {
    const frames = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const usable = (value) =>
          typeof value === "string" && value.trim().length > 10 ? value : null;
        try {
          for (const model of window.monaco?.editor?.getModels?.() || []) {
            const value = usable(model.getValue?.());
            if (value) return value;
          }
        } catch {
          /* not Monaco */
        }
        try {
          if (window.ace?.edit) {
            for (const el of document.querySelectorAll(".ace_editor")) {
              const value = usable(window.ace.edit(el).getValue());
              if (value) return value;
            }
          }
        } catch {
          /* not Ace */
        }
        try {
          for (const el of document.querySelectorAll(".CodeMirror")) {
            const value = usable(el.CodeMirror?.getValue?.());
            if (value) return value;
          }
        } catch {
          /* not CodeMirror */
        }
        return null;
      },
    });
    return frames?.[0]?.result || null;
  } catch {
    return null;
  }
}

// Runs inside a signed-in GFG page, so it can reach whatever the practice UI
// itself uses. Serialized by chrome.scripting, so it must be self-contained.
//
// These endpoint shapes are not documented and are not verified against the
// current site, which is why every unexpected answer returns null: a wrong guess
// must degrade to "skipped", never to a file with the wrong contents in it.
function requestSubmissionsInPage(slug) {
  const urls = [
    `https://practiceapi.geeksforgeeks.org/api/latest/problems/${slug}/submissions/`,
    `https://practiceapi.geeksforgeeks.org/api/vr/problems/${slug}/submissions/`,
  ];
  const findCode = (value, depth) => {
    if (depth > 6 || !value) return null;
    if (typeof value === "string") {
      return value.includes("\n") && value.trim().length > 20 ? value : null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const hit = findCode(item, depth + 1);
        if (hit) return hit;
      }
      return null;
    }
    if (typeof value === "object") {
      for (const field of ["code", "sub_code", "solution", "source", "user_code"]) {
        const direct = value[field];
        if (typeof direct === "string" && direct.trim().length > 20) return direct;
      }
      for (const nested of Object.values(value)) {
        const hit = findCode(nested, depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  };
  const attempt = (i) => {
    if (i >= urls.length) return null;
    return fetch(urls[i], { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => findCode(json, 0) || attempt(i + 1))
      .catch(() => attempt(i + 1));
  };
  return attempt(0);
}

async function sourceViaTab(slug) {
  if (!slug || !chrome.tabs?.query || !chrome.scripting?.executeScript) return null;
  let tabs;
  try {
    tabs = await chrome.tabs.query({ url: ["*://*.geeksforgeeks.org/*"] });
  } catch {
    return null;
  }
  const tab =
    tabs.find((t) => Number.isInteger(t.id) && t.status === "complete") ||
    tabs.find((t) => Number.isInteger(t.id));
  if (!tab) return null;
  try {
    const frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: requestSubmissionsInPage,
      args: [String(slug)],
    });
    return frames?.[0]?.result || null;
  } catch {
    return null;
  }
}

export async function fetchSource(sub) {
  if (sub.source && String(sub.source).trim()) return String(sub.source);
  const fromTab = await sourceViaTab(sub.slug);
  if (fromTab && fromTab.trim()) return fromTab;
  return null;
}

export const PLATFORM = {
  name: "gfg",
  label: "GeeksforGeeks",
  async fetchMetadata(sub) {
    const slug = sub.slug || sub.problemSlug || "problem";
    const title = keyFor(sub);
    const difficulty = normalizeDifficulty(sub.difficulty);
    const language = sub.language || "C++";
    return {
      platform: "gfg",
      id: String(sub.id || slug),
      key: String(slug).toLowerCase(),
      title,
      difficulty,
      language,
      ext: extFor(language),
      folder: difficulty,
      path: `geeksforgeeks/${difficulty}/${title}.${extFor(language)}`,
      url: sub.url || `https://www.geeksforgeeks.org/problems/${slug}/1`,
      tags: [difficulty],
    };
  },
  fetchSource,
};
