import * as store from "./storage.js";
import * as cf from "./cf.js";
import * as lc from "./leetcode.js";
import * as cses from "./cses.js";
import * as codechef from "./codechef.js";
import * as gfg from "./gfg.js";
import * as sync from "./sync.js";
import * as pending from "./pending.js";
import * as gh from "./github.js";
import * as oauth from "./oauth.js";
import { enabledPlatforms, sessionKeyFor } from "./platforms.js";

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_FIELD_LENGTH = 256;
const WITNESS_TTL_MS = 15 * 60 * 1000;
const GITHUB_AUTH_ALARM = "github-auth-health";
const README_SYNC_ALARM = "readme-summary-sync";
const PENDING_SYNC_ALARM = "pending-submission-sync";
const GITHUB_AUTH_NOTICE_ID = "solvebase-github-auth-required";
const GITHUB_AUTH_NOTICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PROJECT_REPO_OWNER = "TushalLohar";
const PROJECT_REPO_NAME = "SolveBase";
const TEXT_ENCODER = new TextEncoder();
const SETUP_FLOW_TTL_MS = 10 * 60 * 1000;
const READY_JOB_TTL_MS = 24 * 60 * 60 * 1000;
const CF_FINAL_VERDICT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let setupFlow = null;
let readmeSyncTimer = null;
let pendingSyncTimer = null;
let pendingSyncRunning = null;

function currentSetupFlow() {
  if (!setupFlow) return null;
  if (Date.now() - setupFlow.startedAt > SETUP_FLOW_TTL_MS) {
    setupFlow = null;
    return null;
  }
  return { ...setupFlow };
}

function beginSetupFlow(status) {
  setupFlow = { status, startedAt: Date.now(), error: "" };
}

function finishSetupFlow(status, error = "") {
  setupFlow = { status, startedAt: Date.now(), error };
  const openPopup = chrome.action?.openPopup;
  if (typeof openPopup === "function") {
    Promise.resolve(openPopup.call(chrome.action)).catch(() => {});
  }
}

function scheduleRepositorySummary(delayMs = 500) {
  if (readmeSyncTimer) clearTimeout(readmeSyncTimer);
  readmeSyncTimer = setTimeout(() => {
    readmeSyncTimer = null;
    sync
      .flushRepositorySummary()
      .then((result) => {
        if (result?.outcome === "deferred") {
          scheduleRepositorySummary(30_000);
        } else if (chrome.alarms?.clear) {
          chrome.alarms.clear(README_SYNC_ALARM).catch(() => {});
        }
      })
      .catch(() => scheduleRepositorySummary(5000));
  }, delayMs);
  if (chrome.alarms?.create) {
    chrome.alarms.create(README_SYNC_ALARM, { delayInMinutes: 0.5 });
  }
}

const PLATFORM_MESSAGE_HOSTS = {
  "cf-accepted": ["codeforces.com"],
  "lc-accepted": ["leetcode.com"],
  "cses-accepted": ["cses.fi"],
  "codechef-accepted": ["codechef.com"],
  "gfg-accepted": ["geeksforgeeks.org"],
  "cf-witness": ["codeforces.com"],
  "lc-witness": ["leetcode.com"],
  "cses-witness": ["cses.fi"],
  "codechef-witness": ["codechef.com"],
  "gfg-witness": ["geeksforgeeks.org"],
};

const WITNESS_PLATFORM = {
  "cf-witness": "codeforces",
  "lc-witness": "leetcode",
  "cses-witness": "cses",
  "codechef-witness": "codechef",
  "gfg-witness": "gfg",
};

const POPUP_MESSAGES = new Set([
  "status",
  "check-session",
  "star-project-repo",
  "save-config",
  "github-disconnect",
  "reset",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTrustedExtensionSender(sender) {
  return sender?.id === chrome.runtime.id;
}

function isPopupSender(sender) {
  return (
    isTrustedExtensionSender(sender) &&
    !sender.tab &&
    sender.url === chrome.runtime.getURL("popup.html")
  );
}

function hostMatches(hostname, domains) {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function isPlatformSender(sender, messageType) {
  if (!isTrustedExtensionSender(sender) || !sender.tab || !Number.isInteger(sender.tab.id)) {
    return false;
  }
  try {
    const url = new URL(sender.url || "");
    return (
      url.protocol === "https:" && hostMatches(url.hostname, PLATFORM_MESSAGE_HOSTS[messageType])
    );
  } catch {
    return false;
  }
}

function isAuthorizedMessage(msg, sender) {
  if (!isRecord(msg) || typeof msg.type !== "string") return false;
  if (Object.hasOwn(PLATFORM_MESSAGE_HOSTS, msg.type)) {
    return isPlatformSender(sender, msg.type);
  }
  return POPUP_MESSAGES.has(msg.type) && isPopupSender(sender);
}

function errorText(error, fallback = "Request failed") {
  const raw = error instanceof Error ? error.message : String(error || fallback);
  return raw
    .replace(/Bearer\s+[^\s)]+/gi, "Bearer [redacted]")
    .replace(/(token|secret|client_secret)\s*[:=]\s*[^\s,;}]+/gi, "$1=[redacted]")
    .slice(0, 500);
}

function isGithubUnauthorized(error) {
  return (
    error?.code === "github-auth" || error?.status === 401 || errorText(error).includes("(401)")
  );
}

async function setGithubAuthWarningBadge() {
  await chrome.action.setBadgeBackgroundColor({ color: "#d84f4f" });
  await chrome.action.setBadgeText({ text: "!" });
}

async function clearGithubAuthWarning() {
  await store.set(store.KEYS.githubAuthNoticeAt, 0);
  await chrome.action.setBadgeText({ text: "" });
  if (chrome.notifications?.clear) {
    const result = chrome.notifications.clear(GITHUB_AUTH_NOTICE_ID);
    await result?.catch?.(() => {});
  }
}

async function notifyGithubAuthRequired() {
  const lastNoticeAt = await store.get(store.KEYS.githubAuthNoticeAt, 0);
  if (Date.now() - Number(lastNoticeAt || 0) < GITHUB_AUTH_NOTICE_COOLDOWN_MS) return;
  await store.set(store.KEYS.githubAuthNoticeAt, Date.now());
  if (!chrome.notifications?.create) return;
  await chrome.notifications.create(GITHUB_AUTH_NOTICE_ID, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon.png"),
    title: "SolveBase needs GitHub access",
    message:
      "GitHub authorization is no longer valid. Open SolveBase and reconnect to resume syncing.",
    priority: 2,
  });
}

async function invalidateGithubAuth() {
  const config = await store.getConfig();
  if (!config) return;
  const alreadyInvalid =
    !config.token && config.setupComplete === false && config.githubAuthInvalid === true;
  await store.setConfig({
    ...config,
    token: "",
    setupComplete: false,
    githubAuthInvalid: true,
  });
  await store.set(store.KEYS.projectRepoStarred, false);
  await store.setLastSync({
    platform: "GitHub",
    status: "failed",
    error: "GitHub authorization expired — reconnect GitHub",
  });
  await setGithubAuthWarningBadge();
  if (!alreadyInvalid) await notifyGithubAuthRequired();
}

async function checkGithubAuthHealth() {
  const config = await store.getConfig();
  if (config?.githubAuthInvalid === true) {
    await setGithubAuthWarningBadge();
    return;
  }
  if (!config?.token) return;
  try {
    await gh.verifyToken(config.token);
  } catch (error) {
    if (isGithubUnauthorized(error)) await invalidateGithubAuth();
  }
}

function scheduleGithubAuthHealthCheck() {
  if (!chrome.alarms?.create) return;
  chrome.alarms.create(GITHUB_AUTH_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: 60,
  });
}

function sourceValue(value) {
  if (value == null) return null;
  if (
    typeof value !== "string" ||
    value.length > MAX_SOURCE_BYTES ||
    TEXT_ENCODER.encode(value).byteLength > MAX_SOURCE_BYTES
  ) {
    throw new Error("Source code is too large to sync (maximum 2 MB).");
  }
  return value;
}

function textValue(value, label, max = MAX_FIELD_LENGTH) {
  if (value == null) return "";
  if (typeof value !== "string" || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value.trim();
}

function publicConfig(config) {
  if (!config || typeof config !== "object") return null;
  return {
    handle: config.handle || "",
    codechefHandle: config.codechefHandle || "",
    gfgHandle: config.gfgHandle || "",
    repo: config.repo || "",
    owner: config.owner || "",
    platforms: config.platforms || {},
    setupComplete: config.setupComplete !== false,
    hasToken: typeof config.token === "string" && config.token.length > 0,
    repoVisibilityConfirmed: config.repoVisibilityConfirmed === true,
  };
}

function witnessKey(messageType, tabId) {
  return `submissionWitness:${messageType}:${tabId}`;
}

function validateProblemUrl(value) {
  const raw = textValue(value, "problem URL", 500);
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid GeeksforGeeks problem URL.");
  }
  if (url.protocol !== "https:" || !hostMatches(url.hostname, ["geeksforgeeks.org"])) {
    throw new Error("Invalid GeeksforGeeks problem URL.");
  }
  return url.toString();
}

function sanitizeWitness(messageType, value) {
  if (!isRecord(value)) throw new Error("Invalid submission witness.");

  if (messageType === "cf-witness") {
    const contestId = textValue(value.contestId, "Codeforces contest id", 24);
    const problemIndex = textValue(value.problemIndex, "Codeforces problem index", 24);
    if (
      (contestId && !/^\d+$/.test(contestId)) ||
      (problemIndex && !/^[A-Za-z0-9]+$/.test(problemIndex))
    ) {
      throw new Error("Invalid Codeforces submission witness.");
    }
    return {
      contestId: contestId || null,
      problemIndex: problemIndex || null,
      problemName: textValue(value.problemName, "Codeforces problem name") || null,
      language: textValue(value.language, "Codeforces language", 100) || null,
    };
  }

  if (messageType === "lc-witness") {
    const slug = textValue(value.slug, "LeetCode problem slug", 180);
    const submissionId = textValue(value.submissionId, "LeetCode submission id", 32);
    if (!/^[A-Za-z0-9-]+$/.test(slug) || (submissionId && !/^\d+$/.test(submissionId))) {
      throw new Error("Invalid LeetCode submission witness.");
    }
    return { slug, submissionId: submissionId || null };
  }

  if (messageType === "cses-witness") {
    const taskId = textValue(value.taskId, "CSES task id", 32);
    const resultId = textValue(value.resultId, "CSES result id", 32);
    if (!/^\d+$/.test(taskId) || (resultId && !/^\d+$/.test(resultId))) {
      throw new Error("Invalid CSES submission witness.");
    }
    return { taskId, resultId: resultId || null };
  }

  if (messageType === "codechef-witness") {
    const submissionId = textValue(value.submissionId, "CodeChef submission id", 32);
    const problemCode = textValue(value.problemCode, "CodeChef problem code", 80);
    if (
      (submissionId && !/^\d+$/.test(submissionId)) ||
      (problemCode && !/^[A-Za-z0-9_]+$/.test(problemCode))
    ) {
      throw new Error("Invalid CodeChef submission witness.");
    }
    return { submissionId: submissionId || null, problemCode: problemCode || null };
  }

  const slug = textValue(value.slug, "GeeksforGeeks problem slug", 180);
  if (!/^[A-Za-z0-9_-]+$/.test(slug)) {
    throw new Error("Invalid GeeksforGeeks submission witness.");
  }
  return {
    slug,
    title: textValue(value.title, "GeeksforGeeks problem title") || null,
    difficulty: textValue(value.difficulty, "GeeksforGeeks difficulty", 32) || null,
    language: textValue(value.language, "GeeksforGeeks language", 100) || null,
    url: validateProblemUrl(value.url) || null,
  };
}

function watchJobId(platform, tabId) {
  return `watch:${platform}:${tabId}`;
}

function readyJobId(platform, submissionId) {
  return `ready:${platform}:${submissionId}`;
}

function schedulePendingProcessing(delayMs = 0) {
  if (pendingSyncTimer) clearTimeout(pendingSyncTimer);
  pendingSyncTimer = setTimeout(
    () => {
      pendingSyncTimer = null;
      processPendingSubmissions().catch(() => schedulePendingProcessing(5000));
    },
    Math.max(0, delayMs),
  );
  if (chrome.alarms?.create) {
    chrome.alarms.create(PENDING_SYNC_ALARM, { delayInMinutes: 0.5 });
  }
}

async function queueWatch(platform, tabId, data, submittedAt = Date.now()) {
  if (platform === "codeforces") {
    const config = await store.getConfig();
    if (!config?.handle || config.platforms?.codeforces === false) return;
    // Contest verdicts can take days. Keep each witnessed submit separately
    // from the short-lived page witness and later submits in the same tab.
    await pending.upsert({
      id: `verdict:codeforces:witness:${tabId}:${submittedAt}`,
      platform,
      phase: "verdict",
      tabId,
      createdAt: submittedAt,
      submittedAt,
      expiresAt: submittedAt + CF_FINAL_VERDICT_TTL_MS,
      nextAt: Date.now() + 1200,
      attempts: 0,
      data: { ...data, handle: config.handle },
    });
    schedulePendingProcessing(1200);
    return;
  }
  const id = watchJobId(platform, tabId);
  const existing = (await pending.list()).find((job) => job.id === id);
  await pending.upsert({
    id,
    platform,
    phase: "watch",
    tabId,
    createdAt: existing?.createdAt || submittedAt,
    submittedAt: existing?.submittedAt || submittedAt,
    expiresAt: submittedAt + WITNESS_TTL_MS,
    nextAt: Date.now() + 1200,
    attempts: 0,
    data: { ...(existing?.data || {}), ...data },
  });
  schedulePendingProcessing(1200);
}

async function queueCodeforcesVerdict(submission, handle, witness = null) {
  const id = `verdict:codeforces:submission:${submission.id}`;
  const existing = (await pending.list()).find((job) => job.id === id);
  const now = Date.now();
  const job = {
    id,
    platform: "codeforces",
    phase: "verdict",
    tabId: witness?.tabId ?? null,
    createdAt: existing?.createdAt || witness?.createdAt || now,
    submittedAt: Number(submission.creationTimeSeconds || 0) * 1000 || now,
    expiresAt: existing?.expiresAt || witness?.expiresAt || now + CF_FINAL_VERDICT_TTL_MS,
    nextAt: now + 60_000,
    attempts: Number(existing?.attempts || witness?.attempts || 0) + 1,
    data: {
      handle,
      submissionId: String(submission.id),
      contestId: submission.contestId || submission.problem?.contestId || null,
    },
  };
  if (witness) await pending.promote(witness, job);
  else await pending.upsert(job);
  schedulePendingProcessing(60_000);
}

async function queueReady(platform, submissionId, data, tabId, startProcessing = true) {
  const now = Date.now();
  if (Number.isInteger(tabId)) await pending.removeMatching(platform, tabId);
  await pending.upsert({
    id: readyJobId(platform, submissionId),
    platform,
    phase: "ready",
    tabId: Number.isInteger(tabId) ? tabId : null,
    createdAt: now,
    submittedAt: Number(data.submittedAt || now),
    expiresAt: now + READY_JOB_TTL_MS,
    nextAt: now,
    attempts: 0,
    data,
  });
  if (startProcessing) schedulePendingProcessing(0);
}

async function handleWitnessMessage(msg, sender) {
  const key = witnessKey(msg.type, sender.tab.id);
  const platform = WITNESS_PLATFORM[msg.type];
  if (msg.action === "clear") {
    await chrome.storage.session.remove(key);
    await pending.removeMatching(platform, sender.tab.id);
    return { ok: true };
  }
  if (msg.action === "get") {
    const stored = (await chrome.storage.session.get(key))[key];
    if (!stored || Date.now() - Number(stored.at || 0) > WITNESS_TTL_MS) {
      if (stored) await chrome.storage.session.remove(key);
      return { ok: true, witness: null };
    }
    return { ok: true, witness: { ...stored.data, time: stored.at } };
  }
  if (msg.action !== "set") throw new Error("Invalid submission witness action.");

  const data = sanitizeWitness(msg.type, msg.data);
  if (msg.type === "gfg-witness") {
    const source = sourceValue(await gfg.readEditorFromTab(sender.tab.id));
    if (source) data.source = source;
  }
  const at = Date.now();
  await chrome.storage.session.set({ [key]: { at, data } });
  await queueWatch(platform, sender.tab.id, data, at);
  return { ok: true, witness: { ...data, time: at } };
}

// Manifest content scripts only attach after a navigation. Inject into
// already-open platform tabs so saving settings or reloading the extension does
// not leave live sync inactive until every tab is reloaded.
const LIVE_SCRIPTS = [
  { matches: ["https://codeforces.com/*"], files: ["content.js"], world: "ISOLATED" },
  {
    matches: ["https://leetcode.com/problems/*"],
    files: ["leetcode-main.js"],
    world: "MAIN",
  },
  {
    matches: ["https://leetcode.com/problems/*"],
    files: ["content-leetcode.js"],
    world: "ISOLATED",
  },
  { matches: ["https://cses.fi/*"], files: ["content-cses.js"], world: "ISOLATED" },
  {
    matches: [
      "https://*.codechef.com/problems/*",
      "https://*.codechef.com/submit/*",
      "https://*.codechef.com/*/problems/*",
      "https://*.codechef.com/*/submit/*",
      "https://codechef.com/problems/*",
      "https://codechef.com/submit/*",
      "https://codechef.com/*/problems/*",
      "https://codechef.com/*/submit/*",
    ],
    files: ["codechef-main.js"],
    world: "MAIN",
  },
  {
    matches: [
      "https://*.codechef.com/problems/*",
      "https://*.codechef.com/submit/*",
      "https://*.codechef.com/*/problems/*",
      "https://*.codechef.com/*/submit/*",
      "https://codechef.com/problems/*",
      "https://codechef.com/submit/*",
      "https://codechef.com/*/problems/*",
      "https://codechef.com/*/submit/*",
    ],
    files: ["content-codechef.js"],
    world: "ISOLATED",
  },
  {
    matches: ["https://*.geeksforgeeks.org/*", "https://geeksforgeeks.org/*"],
    files: ["content-gfg.js"],
    world: "ISOLATED",
  },
];

async function installLiveDetectors() {
  if (!chrome.scripting?.executeScript || !chrome.tabs?.query) return;
  for (const script of LIVE_SCRIPTS) {
    const tabs = await chrome.tabs.query({ url: script.matches }).catch(() => []);
    await Promise.all(
      tabs
        .filter((tab) => Number.isInteger(tab.id))
        .map((tab) =>
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              files: script.files,
              world: script.world,
            })
            .catch(() => {}),
        ),
    );
  }
}

async function handleAccepted(platform, label, build, options = {}) {
  const config = await store.getConfig();
  if (!config) {
    await store.setLastSync({ platform: label, status: "failed", error: "Finish setup first" });
    return { ok: false, retry: false, error: "Finish setup first" };
  }
  if (config.setupComplete === false) {
    await store.setLastSync({ platform: label, status: "failed", error: "Finish setup first" });
    return { ok: false, retry: false, error: "Finish setup first" };
  }
  if (config.platforms?.[platform] === false) {
    return { ok: false, retry: false, error: `${label} is not enabled` };
  }
  let persistedJobId = options.jobId || null;
  try {
    const submission = await build(config);
    if (!submission || !submission.id) {
      await store.setLastSync({
        platform: label,
        status: "failed",
        error: "Submission not found yet",
      });
      return { ok: false, retry: true };
    }
    if (options.persist !== false) {
      persistedJobId = readyJobId(platform, submission.id);
      await queueReady(platform, submission.id, { submission }, options.tabId, false);
    }
    const result = await sync.processLive(platform, submission);
    const title = result?.meta?.title || submission.problemName || submission.title || "solution";
    if (result.outcome === "duplicate" || result.outcome === "unchanged") {
      if (persistedJobId) await pending.remove(persistedJobId);
      await store.setLastSync({ platform: label, title, status: "already synced" });
      return { ok: true, result };
    }
    if (result.outcome === "unconfigured") {
      return { ok: false, retry: false, error: "Finish setup first" };
    }
    if (result.outcome === "failed") {
      const errMsg = errorText(result.error);
      const safeResult = { ...result, error: errMsg };
      // A revoked/expired OAuth token must flip the popup back to "Connect
      // GitHub" instead of looping on a token that will never work again.
      if (result.code === "github-auth" || isGithubUnauthorized(result.error)) {
        await invalidateGithubAuth();
        await store.setLastSync({
          platform: label,
          title,
          status: "failed",
          error: "GitHub access expired — reconnect GitHub",
        });
        return { ok: false, retry: false, result: safeResult, reauth: true };
      }
      await store.setLastSync({
        platform: label,
        title,
        status: "failed",
        error: errMsg,
      });
      return {
        ok: false,
        retry:
          result.code === "transient" ||
          result.code === "ratelimit" ||
          result.code === "unavailable" ||
          result.code === "needs-tab",
        result: safeResult,
      };
    }
    await store.setLastSync({
      platform: label,
      title,
      status: "committed",
      path: result?.meta?.path || "",
    });
    scheduleRepositorySummary();
    if (persistedJobId) await pending.remove(persistedJobId);
    return { ok: true, result };
  } catch (err) {
    const message = errorText(err);
    await store.setLastSync({ platform: label, status: "failed", error: message });
    if (isGithubUnauthorized(err)) {
      await invalidateGithubAuth();
      return { ok: false, retry: false, reauth: true, error: message };
    }
    if (err?.code === "auth") {
      const session = (await store.get(store.KEYS.session, {})) || {};
      const flag = sessionKeyFor(platform);
      if (flag) session[flag] = false;
      await store.setSession(session);
      return { ok: false, retry: false, error: message };
    }
    return { ok: false, retry: true, error: message };
  } finally {
    if (persistedJobId) schedulePendingProcessing(2000);
  }
}

const PLATFORM_LABELS = {
  codeforces: "Codeforces",
  leetcode: "LeetCode",
  cses: "CSES",
  codechef: "CodeChef",
  gfg: "GeeksforGeeks",
};

function retryDelay(attempts, requested = 0) {
  const stepped = Math.min(30_000, 1500 * 2 ** Math.min(attempts, 5));
  return Math.max(stepped, Math.min(Number(requested || 0), 5 * 60 * 1000));
}

async function resolveWatchJob(job, config) {
  const data = job.data || {};
  if (job.platform === "codeforces") {
    if (!config.handle) return { status: "waiting" };
    if (data.handle && data.handle.toLowerCase() !== config.handle.toLowerCase())
      return { status: "rejected" };
    if (data.submissionId) {
      const submission = await cf.getSubmission(config.handle, data.submissionId, data.contestId);
      if (!submission) return { status: "waiting" };
      if (cf.isPendingSubmission(submission)) return { status: "pending-final", submission };
      return submission.verdict === "OK"
        ? { status: "accepted", submission }
        : { status: "rejected" };
    }
    if (!data.problemIndex) return { status: "waiting" };
    const matchesWitness = (candidate) => {
      const createdAt = Number(candidate.creationTimeSeconds || 0) * 1000;
      if (createdAt < Number(job.submittedAt || 0) - 5000) return false;
      if (createdAt > Number(job.submittedAt || 0) + WITNESS_TTL_MS) return false;
      const candidateIndex = candidate.problem?.index || candidate.problemIndex || "";
      if (String(candidateIndex).toUpperCase() !== String(data.problemIndex).toUpperCase()) {
        return false;
      }
      const candidateContest = candidate.contestId || candidate.problem?.contestId || "";
      return !data.contestId || !candidateContest || String(candidateContest) === data.contestId;
    };
    const recent = await cf.getRecentSubmissions(config.handle, 30);
    let submission = recent.find(matchesWitness);
    if (!submission && data.contestId) {
      submission = (await cf.getContestSubmissions(config.handle, data.contestId)).find(
        matchesWitness,
      );
    }
    if (!submission) return { status: "waiting" };
    if (cf.isPendingSubmission(submission)) return { status: "pending-final", submission };
    if (submission.verdict !== "OK") return { status: "rejected" };
    submission.source = data.source || null;
    return { status: "accepted", submission };
  }

  if (job.platform === "leetcode") {
    if (!data.slug) return { status: "waiting" };
    const recent = await lc.fetchSubmissions(20);
    const submission = recent.find((candidate) => {
      if (data.submissionId) return String(candidate.id) === String(data.submissionId);
      return (
        candidate.slug === data.slug &&
        Number(candidate.timestamp || 0) >= Number(job.submittedAt || 0) - 5000
      );
    });
    return submission
      ? { status: "accepted", submission: { id: String(submission.id), slug: submission.slug } }
      : { status: "waiting" };
  }

  if (job.platform === "cses") {
    if (!data.resultId || !data.taskId) return { status: "waiting" };
    const result = await cses.inspectSubmission(data.resultId, data.taskId);
    return result.status === "accepted"
      ? {
          status: "accepted",
          submission: {
            id: String(data.resultId),
            resultId: String(data.resultId),
            taskId: String(data.taskId),
          },
        }
      : result;
  }

  if (job.platform === "codechef") {
    if (!data.submissionId) return { status: "waiting" };
    const result = await codechef.inspectSubmission(data.submissionId);
    return result.status === "accepted"
      ? {
          status: "accepted",
          submission: {
            id: String(data.submissionId),
            problemCode: result.problemCode || data.problemCode || undefined,
          },
        }
      : result;
  }

  if (job.platform === "gfg") {
    if (!config.gfgHandle || !data.slug || !data.source) return { status: "waiting" };
    const solved = await gfg.findSolved(config.gfgHandle, data.slug, job.submittedAt);
    if (!solved) return { status: "waiting" };
    return {
      status: "accepted",
      submission: {
        id: gfg.submissionIdFor(data.slug, data.source || ""),
        slug: data.slug,
        title: data.title || solved.title,
        difficulty: data.difficulty || solved.difficulty,
        language: data.language || solved.language,
        url: data.url || undefined,
        source: data.source || undefined,
      },
    };
  }

  return { status: "waiting" };
}

async function postponePendingJob(job, delayMs, attempts = Number(job.attempts || 0) + 1) {
  await pending.update(job.id, {
    attempts,
    nextAt: Date.now() + Math.max(1000, delayMs),
  });
}

async function processReadyJob(job) {
  const submission = job.data?.submission;
  if (!submission?.id) {
    await pending.remove(job.id);
    return;
  }
  const result = await handleAccepted(
    job.platform,
    PLATFORM_LABELS[job.platform] || job.platform,
    async () => submission,
    { persist: false, jobId: job.id },
  );
  if (result.ok) return;
  if (result.reauth) {
    await postponePendingJob(job, 60_000);
    return;
  }
  if (result.retry === false) {
    await pending.remove(job.id);
    return;
  }
  await postponePendingJob(job, retryDelay(Number(job.attempts || 0), result.result?.retryAfter));
}

async function processPendingJob(job, config) {
  if (config.platforms?.[job.platform] === false) {
    await pending.remove(job.id);
    return;
  }
  if (job.phase === "ready") {
    await processReadyJob(job);
    return;
  }

  const resolved = await resolveWatchJob(job, config);
  if (resolved.status === "pending-final") {
    await queueCodeforcesVerdict(resolved.submission, config.handle, job);
    return;
  }
  if (resolved.status === "rejected") {
    await pending.remove(job.id);
    return;
  }
  if (resolved.status !== "accepted" || !resolved.submission?.id) {
    await postponePendingJob(
      job,
      job.phase === "verdict" ? 60_000 : retryDelay(Number(job.attempts || 0)),
    );
    return;
  }

  const ready = {
    ...job,
    phase: "ready",
    expiresAt: Date.now() + READY_JOB_TTL_MS,
    nextAt: Date.now(),
    attempts: 0,
    data: { submission: resolved.submission },
  };
  await pending.upsert(ready);
  await processReadyJob(ready);
}

async function processPendingSubmissions() {
  if (pendingSyncRunning) return pendingSyncRunning;
  pendingSyncRunning = (async () => {
    const jobs = await pending.list();
    if (jobs.length === 0) {
      if (chrome.alarms?.clear) await chrome.alarms.clear(PENDING_SYNC_ALARM);
      return;
    }

    const config = await store.getConfig();
    const now = Date.now();
    const due = jobs.filter((job) => Number(job.nextAt || 0) <= now).slice(0, 6);
    for (const job of due) {
      if (!config?.token || config.setupComplete === false) {
        await postponePendingJob(job, 60_000, Number(job.attempts || 0));
        continue;
      }
      try {
        await processPendingJob(job, config);
      } catch (error) {
        if (error?.code === "auth") {
          const session = (await store.get(store.KEYS.session, {})) || {};
          const flag = sessionKeyFor(job.platform);
          if (flag) session[flag] = false;
          await store.setSession(session);
          await pending.remove(job.id);
        } else {
          await postponePendingJob(job, retryDelay(Number(job.attempts || 0), error?.retryAfter));
        }
      }
    }

    const remaining = await pending.list();
    if (remaining.length === 0) {
      if (chrome.alarms?.clear) await chrome.alarms.clear(PENDING_SYNC_ALARM);
      return;
    }
    const nextAt = Math.min(...remaining.map((job) => Number(job.nextAt || Date.now() + 30_000)));
    schedulePendingProcessing(Math.min(25_000, Math.max(1000, nextAt - Date.now())));
  })();
  try {
    await pendingSyncRunning;
  } finally {
    pendingSyncRunning = null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  store
    .migrate()
    .then(() => {
      scheduleGithubAuthHealthCheck();
      scheduleRepositorySummary(1000);
      schedulePendingProcessing(1000);
      return installLiveDetectors();
    })
    .catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  scheduleGithubAuthHealthCheck();
  scheduleRepositorySummary(1000);
  schedulePendingProcessing(1000);
  store
    .migrate()
    .then(() => checkGithubAuthHealth())
    .catch(() => {});
});

if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === GITHUB_AUTH_ALARM) checkGithubAuthHealth().catch(() => {});
    if (alarm.name === README_SYNC_ALARM) scheduleRepositorySummary(0);
    if (alarm.name === PENDING_SYNC_ALARM) schedulePendingProcessing(0);
  });
}

if (chrome.notifications?.onClicked) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId !== GITHUB_AUTH_NOTICE_ID) return;
    const result = chrome.action.openPopup?.();
    result?.catch?.(() => {});
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    await store.accessReady;
    if (!isAuthorizedMessage(msg, sender)) {
      return sendResponse({ ok: false, retry: false, error: "Forbidden" });
    }

    if (
      msg.type === "cf-witness" ||
      msg.type === "lc-witness" ||
      msg.type === "cses-witness" ||
      msg.type === "codechef-witness" ||
      msg.type === "gfg-witness"
    ) {
      return sendResponse(await handleWitnessMessage(msg, sender));
    }

    if (msg.type === "cf-accepted") {
      const submissionId = textValue(msg.submissionId, "Codeforces submission id", 32);
      if (!/^\d+$/.test(submissionId)) {
        return sendResponse({
          ok: false,
          retry: false,
          error: "Invalid Codeforces submission id.",
        });
      }
      const contestId = textValue(msg.contestId, "Codeforces contest id", 24);
      const problemIndex = textValue(msg.problemIndex, "Codeforces problem index", 24);
      const problemName = textValue(msg.problemName, "Codeforces problem name");
      const language = textValue(msg.language, "Codeforces language", 100);
      const source = sourceValue(msg.source);
      return sendResponse(
        await handleAccepted(
          "codeforces",
          "Codeforces",
          async (config) => {
            let match = null;
            let lookupError = null;
            const handle = config.handle || "";
            for (let attempt = 0; handle && attempt < 4 && !match; attempt++) {
              let submissions = [];
              try {
                submissions = await cf.getAcceptedSubmissions(handle, 100);
                lookupError = null;
              } catch (error) {
                lookupError = error;
                if (error?.code !== "transient") throw error;
              }
              match = submissions.find((sub) => String(sub.id) === submissionId);
              if (!match && attempt < 3) await new Promise((r) => setTimeout(r, 750));
            }
            if (!match && lookupError) throw lookupError;
            if (!match) {
              throw new Error("Codeforces has not confirmed this accepted submission yet.");
            }
            if (!cf.isFinalAcceptedSubmission(match)) {
              await queueCodeforcesVerdict(match, handle);
              const error = new Error(
                "Codeforces has passed pretests but has not finished system testing yet.",
              );
              error.code = "transient";
              error.retryAfter = 60_000;
              throw error;
            }
            const submittedAt = Number(match.creationTimeSeconds || 0) * 1000;
            if (submittedAt > 0 && Date.now() - submittedAt > 60 * 60 * 1000) {
              throw new Error("Codeforces rejected a stale submission event.");
            }
            if (contestId && !match.contestId) match.contestId = contestId;
            if (problemIndex || problemName) {
              match.problem = match.problem || {};
              if (problemIndex && !match.problem.index) match.problem.index = problemIndex;
              if (problemName && !match.problem.name) match.problem.name = problemName;
            }
            if (language && !match.programmingLanguage) match.programmingLanguage = language;
            match.source = source;
            return match;
          },
          { tabId: sender.tab.id },
        ),
      );
    }

    if (msg.type === "lc-accepted") {
      const incomingId = textValue(msg.submissionId, "LeetCode submission id", 32);
      const incomingSlug = textValue(msg.slug, "LeetCode problem slug", 180);
      const submittedAt = Number(msg.submittedAt || 0);
      if (
        (incomingId && !/^\d+$/.test(incomingId)) ||
        (!incomingId && !incomingSlug) ||
        !Number.isSafeInteger(submittedAt) ||
        submittedAt <= 0 ||
        Date.now() - submittedAt > 15 * 60 * 1000 ||
        submittedAt - Date.now() > 30 * 1000
      ) {
        return sendResponse({ ok: false, retry: false, error: "Invalid LeetCode submission id." });
      }
      return sendResponse(
        await handleAccepted(
          "leetcode",
          "LeetCode",
          async () => {
            if (incomingId) {
              return { id: incomingId, slug: incomingSlug || undefined };
            }
            let match = null;
            let lookupError = null;
            for (let attempt = 0; attempt < 4 && !match; attempt++) {
              let recent = [];
              try {
                recent = await lc.fetchSubmissions(20);
                lookupError = null;
              } catch (error) {
                lookupError = error;
                if (error?.code !== "transient") throw error;
              }
              match = incomingId
                ? recent.find((submission) => String(submission.id) === incomingId) || null
                : recent.find(
                    (submission) =>
                      submission.slug === incomingSlug &&
                      submission.timestamp > 0 &&
                      submission.timestamp >= submittedAt - 5000,
                  ) || null;
              if (!match && attempt < 3) await new Promise((resolve) => setTimeout(resolve, 750));
            }
            if (!match && lookupError) throw lookupError;
            if (!match || (incomingSlug && match.slug !== incomingSlug)) {
              throw new Error("LeetCode has not confirmed this accepted submission yet.");
            }
            if (match.timestamp > 0 && match.timestamp < submittedAt - 5000) {
              throw new Error("LeetCode rejected an older accepted submission.");
            }
            if (match.timestamp > 0 && Date.now() - match.timestamp > 60 * 60 * 1000) {
              throw new Error("LeetCode rejected a stale submission event.");
            }
            return { id: String(match.id), slug: match.slug || incomingSlug || undefined };
          },
          { tabId: sender.tab.id },
        ),
      );
    }

    if (msg.type === "cses-accepted") {
      const resultId = textValue(msg.resultId, "CSES result id", 32);
      const taskId = textValue(msg.taskId, "CSES task id", 32);
      if (
        (!resultId && !taskId) ||
        (resultId && !/^\d+$/.test(resultId)) ||
        (taskId && !/^\d+$/.test(taskId))
      ) {
        return sendResponse({ ok: false, retry: false, error: "Invalid CSES submission id." });
      }
      const name = textValue(msg.name, "CSES problem name");
      return sendResponse(
        await handleAccepted(
          "cses",
          "CSES",
          async () => ({
            id: resultId || taskId,
            resultId: resultId || undefined,
            taskId: taskId || undefined,
            name: name || undefined,
          }),
          { tabId: sender.tab.id },
        ),
      );
    }

    if (msg.type === "codechef-accepted") {
      const submissionId = textValue(msg.submissionId, "CodeChef submission id", 32);
      const submittedAt = Number(msg.submittedAt || 0);
      if (
        !/^\d+$/.test(submissionId) ||
        !Number.isSafeInteger(submittedAt) ||
        submittedAt <= 0 ||
        Date.now() - submittedAt > 15 * 60 * 1000 ||
        submittedAt - Date.now() > 30 * 1000
      ) {
        return sendResponse({ ok: false, retry: false, error: "Invalid CodeChef submission id." });
      }
      const problemCode = textValue(msg.problemCode, "CodeChef problem code", 80);
      return sendResponse(
        await handleAccepted(
          "codechef",
          "CodeChef",
          async () => ({
            id: submissionId,
            problemCode: problemCode || undefined,
          }),
          { tabId: sender.tab.id },
        ),
      );
    }

    if (msg.type === "gfg-accepted") {
      const slug = textValue(msg.slug, "GeeksforGeeks problem slug", 180);
      if (!/^[A-Za-z0-9_-]+$/.test(slug)) {
        return sendResponse({
          ok: false,
          retry: false,
          error: "Invalid GeeksforGeeks problem slug.",
        });
      }
      const title = textValue(msg.title, "GeeksforGeeks problem title");
      const difficulty = textValue(msg.difficulty, "GeeksforGeeks difficulty", 32);
      const language = textValue(msg.language, "GeeksforGeeks language", 100);
      const capturedSource = sourceValue(msg.source);
      const suppliedUrl = textValue(msg.url, "GeeksforGeeks problem URL", 500);
      let problemUrl = "";
      if (suppliedUrl) {
        try {
          const parsed = new URL(suppliedUrl);
          if (
            parsed.protocol !== "https:" ||
            !hostMatches(parsed.hostname, ["geeksforgeeks.org"])
          ) {
            throw new Error();
          }
          problemUrl = parsed.toString();
        } catch {
          return sendResponse({
            ok: false,
            retry: false,
            error: "Invalid GeeksforGeeks problem URL.",
          });
        }
      }
      return sendResponse(
        await handleAccepted(
          "gfg",
          "GeeksforGeeks",
          async (config) => {
            const currentSlug = (() => {
              try {
                return new URL(sender.url || "").pathname.match(
                  /\/(?:problems|problem)\/([A-Za-z0-9_-]+)/i,
                )?.[1];
              } catch {
                return null;
              }
            })();
            if (currentSlug && currentSlug.toLowerCase() !== slug.toLowerCase()) {
              throw new Error("GeeksforGeeks moved to another problem before syncing completed.");
            }
            let source = capturedSource;
            if (!source || !source.trim()) {
              source = await gfg.fetchSource({
                slug,
                title,
                difficulty,
                language,
                url: problemUrl,
                handle: config.gfgHandle,
              });
            }
            return {
              id: gfg.submissionIdFor(slug, source),
              slug,
              title: title || undefined,
              difficulty: difficulty || undefined,
              language: language || undefined,
              url: problemUrl || undefined,
              source,
            };
          },
          { tabId: sender.tab.id },
        ),
      );
    }

    if (msg.type === "status") {
      const [config, session, lastSync, projectRepoStarred] = await Promise.all([
        store.getConfig(),
        store.get(store.KEYS.session, null),
        store.get(store.KEYS.lastSync, null),
        store.get(store.KEYS.projectRepoStarred, false),
      ]);
      return sendResponse({
        config: publicConfig(config),
        session,
        lastSync,
        projectRepoStarred: projectRepoStarred === true,
        setupFlow: currentSetupFlow(),
      });
    }

    if (msg.type === "star-project-repo") {
      const config = await store.getConfig();
      if (!config?.token) {
        return sendResponse({ ok: false, error: "Connect GitHub before starring SolveBase." });
      }
      try {
        await gh.starRepository(config.token, PROJECT_REPO_OWNER, PROJECT_REPO_NAME);
        await store.set(store.KEYS.projectRepoStarred, true);
        return sendResponse({ ok: true, starred: true });
      } catch (error) {
        if (isGithubUnauthorized(error)) await invalidateGithubAuth();
        return sendResponse({
          ok: false,
          error: errorText(error, "Could not star SolveBase on GitHub."),
        });
      }
    }

    if (msg.type === "check-session") {
      const config = await store.getConfig();
      if (!config) {
        await store.setSession({});
        return sendResponse({ ok: true });
      }
      const checkers = {
        codeforces: cf.checkSession,
        leetcode: lc.checkSession,
        cses: cses.checkSession,
        codechef: codechef.checkSession,
        gfg: gfg.checkSession,
      };
      const session = { profiles: {} };
      await Promise.all(
        enabledPlatforms(config).map(async (platformName) => {
          const check = checkers[platformName];
          const key = sessionKeyFor(platformName);
          if (!check || !key) return;
          try {
            const result = await check();
            session[key] = result.ok;
            if (result.ok && typeof result.profileUrl === "string") {
              session.profiles[platformName] = result.profileUrl;
            }
          } catch {
            // A flaky probe must not raise a false "signed out" banner.
          }
        }),
      );
      if (Object.keys(session.profiles).length === 0) delete session.profiles;
      await store.setSession(session);
      return sendResponse({ ok: Object.values(session).every((value) => value !== false) });
    }

    if (msg.type === "save-config") {
      if (!isRecord(msg.payload)) {
        return sendResponse({ ok: false, error: "Invalid settings." });
      }
      const inProgress = currentSetupFlow();
      if (inProgress && ["authorizing", "saving", "finalizing"].includes(inProgress.status)) {
        return sendResponse({
          ok: false,
          pending: true,
          error: "GitHub setup is already in progress. Finish the open authorization window.",
        });
      }
      const previous = await store.getConfig();
      const handle = textValue(msg.payload.handle, "Codeforces handle", 64);
      const codechefHandle = textValue(msg.payload.codechefHandle, "CodeChef username", 64);
      const gfgHandle = textValue(msg.payload.gfgHandle, "GeeksforGeeks username", 64);
      const repo = textValue(msg.payload.repo, "repository name", 100);
      const repoVisibilityConfirmed = msg.payload.repoVisibilityConfirmed === true;
      const platforms = isRecord(msg.payload.platforms) ? msg.payload.platforms : {};
      for (const name of ["codeforces", "leetcode", "cses", "codechef", "gfg"]) {
        if (Object.hasOwn(platforms, name) && typeof platforms[name] !== "boolean") {
          return sendResponse({ ok: false, error: "Invalid platform settings." });
        }
      }
      const enabled = {
        codeforces: platforms.codeforces !== false,
        leetcode: platforms.leetcode !== false,
        cses: platforms.cses !== false,
        codechef: platforms.codechef !== false,
        gfg: platforms.gfg !== false,
      };
      try {
        const repoError = gh.validateRepoName(repo);
        if (repoError) throw new Error(repoError);
        if (!repoVisibilityConfirmed) {
          throw new Error(
            "Confirm that the solutions repository and committed files will be public.",
          );
        }
        for (const [value, label] of [
          [handle, "Codeforces handle"],
          [codechefHandle, "CodeChef username"],
          [gfgHandle, "GeeksforGeeks username"],
        ]) {
          if (value && !/^[A-Za-z0-9_.-]+$/.test(value)) throw new Error(`Invalid ${label}.`);
        }
        if (!Object.values(enabled).some(Boolean)) throw new Error("Enable at least one platform.");
        if (enabled.codeforces && !handle) throw new Error("Enter your Codeforces handle.");
        if (enabled.codechef && !codechefHandle) throw new Error("Enter your CodeChef username.");
        if (enabled.gfg && !gfgHandle) throw new Error("Enter your GeeksforGeeks username.");

        beginSetupFlow(msg.payload.connect === true ? "authorizing" : "saving");
        let token = "";
        let owner = "";
        if (msg.payload.connect === true) {
          const result = await oauth.connect();
          token = result.token;
          owner = result.owner;
          beginSetupFlow("finalizing");
        } else {
          token = previous?.token || "";
          owner = previous?.owner || "";
          if (!token) {
            throw new Error("Connect GitHub first.");
          }
          const user = await gh.verifyToken(token);
          owner = user.login;
        }

        const checks = [];
        if (enabled.codeforces) {
          checks.push(
            cf.handleExists(handle || "").then((ok) => {
              if (!ok) throw new Error("Codeforces handle not found");
            }),
          );
        }
        if (enabled.codechef && codechefHandle) {
          checks.push(
            codechef.handleExists(codechefHandle).then((ok) => {
              if (!ok) throw new Error("CodeChef username not found");
            }),
          );
        }
        if (enabled.gfg && gfgHandle) {
          checks.push(
            gfg.handleExists(gfgHandle).then((ok) => {
              if (!ok) throw new Error("GeeksforGeeks username not found");
            }),
          );
        }
        await Promise.all(checks);
        const repository = await gh.ensureRepo(token, owner, repo);
        const config = {
          handle: handle || "",
          codechefHandle: codechefHandle || "",
          gfgHandle: gfgHandle || "",
          token,
          repo,
          owner,
          platforms: enabled,
          repoVisibilityConfirmed: true,
          setupComplete: true,
          githubAuthInvalid: false,
        };
        const synced = repository.synced || {};
        await gh.putReadme(token, owner, repo, synced, handle || "");
        const sameRepository =
          previous?.owner?.toLowerCase() === owner.toLowerCase() &&
          previous?.repo?.toLowerCase() === repo.toLowerCase();
        if (!sameRepository) await store.clearWorkState();
        await store.set(store.KEYS.synced, synced);
        await store.setConfig(config);
        if (msg.payload.connect === true) {
          await store.set(store.KEYS.projectRepoStarred, false);
        }
        await clearGithubAuthWarning();
        await store.set(store.KEYS.lastSync, null);
        await installLiveDetectors();

        const session = {};
        for (const platformName of enabledPlatforms(config)) {
          const key = sessionKeyFor(platformName);
          if (key) session[key] = true;
        }
        await store.setSession(session);
        schedulePendingProcessing(0);
        scheduleRepositorySummary();
        finishSetupFlow("complete");
        return sendResponse({ ok: true, owner });
      } catch (err) {
        if (isGithubUnauthorized(err)) await invalidateGithubAuth();
        const message = errorText(err, "Could not save settings.");
        finishSetupFlow("failed", message);
        return sendResponse({ ok: false, error: message });
      }
    }

    if (msg.type === "github-disconnect") {
      await oauth.disconnect();
      await clearGithubAuthWarning();
      return sendResponse({ ok: true });
    }

    if (msg.type === "reset") {
      setupFlow = null;
      if (readmeSyncTimer) clearTimeout(readmeSyncTimer);
      readmeSyncTimer = null;
      if (pendingSyncTimer) clearTimeout(pendingSyncTimer);
      pendingSyncTimer = null;
      if (chrome.alarms?.clear) await chrome.alarms.clear(README_SYNC_ALARM);
      if (chrome.alarms?.clear) await chrome.alarms.clear(PENDING_SYNC_ALARM);
      await Promise.all([chrome.storage.local.clear(), chrome.storage.session.clear()]);
      await chrome.action.setBadgeText({ text: "" });
      if (chrome.notifications?.clear) {
        const result = chrome.notifications.clear(GITHUB_AUTH_NOTICE_ID);
        await result?.catch?.(() => {});
      }
      return sendResponse({ ok: true });
    }

    return sendResponse({ ok: false });
  })().catch((error) => sendResponse({ ok: false, error: errorText(error) }));
  return true;
});
