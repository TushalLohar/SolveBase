// Live-only sync engine.
//
// A content script detects an accepted submission it witnessed, the background
// worker calls processLive(), and that call writes the solution to GitHub
// before it returns. Failures retry a couple of times in-process, then report
// failure to the background worker, which retains accepted submissions for retry.

import * as store from "./storage.js";
import * as gh from "./github.js";
import { getPlatform, sessionKeyFor } from "./platforms.js";

const PROCESSED_TTL = 30 * 24 * 60 * 60 * 1000;
const MAX_PROCESSED = 1000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 700;
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const TEXT_ENCODER = new TextEncoder();

// Serialize GitHub writes so two solves landing at once cannot race on README.
let writeChain = Promise.resolve();
let summaryChain = Promise.resolve();

/** @template T @param {() => Promise<T>} task */
function runExclusive(task) {
  const result = writeChain.then(task, task);
  writeChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** @template T @param {() => Promise<T>} task */
function runSummaryExclusive(task) {
  const result = summaryChain.then(task, task);
  summaryChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function processedKey(platform, id) {
  return `${platform}:${id}`;
}

function comparableTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

async function markProcessed(platform, id) {
  const processed = await store.get(store.KEYS.processed, {});
  const now = Date.now();
  processed[processedKey(platform, id)] = now;
  const entries = Object.entries(processed)
    .filter(([, ts]) => now - ts < PROCESSED_TTL)
    .sort((a, b) => b[1] - a[1]);
  await store.set(store.KEYS.processed, Object.fromEntries(entries.slice(0, MAX_PROCESSED)));
}

async function wasProcessed(platform, id) {
  if (!id) return false;
  const processed = await store.get(store.KEYS.processed, {});
  return Boolean(processed[processedKey(platform, id)]);
}

async function persistRepositorySummary(config) {
  const synced = await store.get(store.KEYS.synced, {});
  await gh.putReadme(config.token, config.owner, config.repo, synced, config.handle);
}

async function writeOnce(config, platformName, submission) {
  const platform = getPlatform(platformName);
  if (!platform) throw new Error(`Unknown platform: ${platformName}`);

  const meta = await platform.fetchMetadata(submission);
  if (
    !meta ||
    typeof meta.path !== "string" ||
    !meta.path.startsWith(`${platformName === "gfg" ? "geeksforgeeks" : platformName}/`) ||
    meta.path.length > 500 ||
    meta.path.split("/").some((part) => !part || part === "." || part === "..") ||
    /[\u0000-\u001f\u007f]/.test(meta.path)
  ) {
    throw new Error("Platform returned an invalid repository path");
  }

  const attachedSource =
    typeof submission.source === "string" && submission.source.trim() ? submission.source : null;
  const code = attachedSource || (await platform.fetchSource(submission));
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("No source code available for submission");
  }
  if (code.length > MAX_SOURCE_BYTES || TEXT_ENCODER.encode(code).byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Source code is too large to sync (maximum 2 MB)");
  }

  // Key by the PROBLEM, not the submission, so a re-submit overwrites instead
  // of inflating the README count.
  const syncedKey = `${platformName}:${meta.key || meta.title || meta.id}`;
  const synced = await store.get(store.KEYS.synced, {});
  const importedCandidates =
    platformName === "gfg"
      ? Object.entries(synced).filter(
          ([, item]) =>
            item?.imported &&
            item.platform === "gfg" &&
            comparableTitle(item.title) === comparableTitle(meta.title),
        )
      : [];
  const importedFallback =
    importedCandidates.find(([, item]) => item.folder === meta.folder) || importedCandidates[0];
  const previousKey = importedFallback?.[0] || syncedKey;
  const previous = synced[previousKey] || null;
  // Keep imported folders and filename stems, but match the extension to the
  // new solution's language. C++'s conventional aliases can stay as they are.
  const preserveImportedPath = Boolean(previous?.imported && previous?.path);
  let targetPath = preserveImportedPath ? previous.path : meta.path;
  if (preserveImportedPath) {
    const oldExt = previous.path.split(".").at(-1).toLowerCase();
    const sameLanguage =
      oldExt === meta.ext || (meta.ext === "cpp" && ["cc", "cxx"].includes(oldExt));
    if (!sameLanguage) targetPath = previous.path.replace(/\.[^/.]+$/, `.${meta.ext}`);
  }
  const targetFolder = preserveImportedPath ? previous.folder || meta.folder : meta.folder;
  const stale = previous && previous.path && previous.path !== targetPath ? previous : null;
  const existingKnown = Object.values(synced).some((item) => item?.path === targetPath);

  const writeResult = await gh.putFile(
    config.token,
    config.owner,
    config.repo,
    targetPath,
    code,
    `Add ${meta.title} (${meta.folder})`,
    { existingKnown },
  );

  if (stale) {
    await gh.deleteFile(
      config.token,
      config.owner,
      config.repo,
      stale.path,
      `Move ${stale.title || syncedKey} to ${targetPath}`,
    );
  }

  for (const [key, item] of Object.entries(synced)) {
    if (
      key !== syncedKey &&
      (key === previousKey || item?.path === targetPath || item?.path === stale?.path)
    )
      delete synced[key];
  }
  synced[syncedKey] = {
    platform: platformName,
    folder: targetFolder,
    title: meta.title,
    path: targetPath,
    tags: meta.tags || [],
    at: Date.now(),
    ...(preserveImportedPath ? { imported: true } : {}),
  };
  await store.set(store.KEYS.synced, synced);
  await markProcessed(platformName, submission.id);
  await store.set(store.KEYS.readmeDirty, { at: Date.now(), id: crypto.randomUUID() });

  return {
    outcome: writeResult.outcome || "synced",
    meta: { ...meta, path: targetPath, folder: targetFolder },
  };
}

export async function flushRepositorySummary() {
  return runSummaryExclusive(async () => {
    const dirty = await store.get(store.KEYS.readmeDirty, null);
    if (!dirty) return { outcome: "clean" };
    const config = await store.getConfig();
    if (!config?.token || config.setupComplete === false) return { outcome: "deferred" };

    await persistRepositorySummary(config);
    const latest = await store.get(store.KEYS.readmeDirty, null);
    if (latest?.id === dirty.id) await store.remove(store.KEYS.readmeDirty);
    return { outcome: "synced" };
  });
}

/**
 * Detect → metadata → commit, awaited end to end.
 * Retries a couple of times in-process, then reports failure so the caller can
 * re-send.
 */
export async function processLive(platformName, submission) {
  if (!submission || !submission.id) return { outcome: "failed", error: "Missing submission id" };

  return runExclusive(async () => {
    const config = await store.getConfig();
    if (!config) return { outcome: "unconfigured" };
    if (await wasProcessed(platformName, submission.id)) return { outcome: "duplicate" };
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await writeOnce(config, platformName, submission);
      } catch (err) {
        lastError = err;
        if (err && (err.code === "auth" || err.code === "github-auth")) {
          const session = (await store.get(store.KEYS.session, {})) || {};
          const flag = sessionKeyFor(platformName);
          if (flag) session[flag] = false;
          await store.setSession(session);
          break;
        }
        if (attempt < MAX_ATTEMPTS) {
          const wait =
            err && err.retryAfter ? Math.min(err.retryAfter, 10000) : RETRY_BASE_MS * attempt;
          await new Promise((resolve) => setTimeout(resolve, wait));
        }
      }
    }
    return {
      outcome: "failed",
      error: lastError ? lastError.message : "unknown error",
      code: lastError?.code || "unknown",
      ...(Number.isFinite(lastError?.retryAfter) ? { retryAfter: lastError.retryAfter } : {}),
    };
  });
}
