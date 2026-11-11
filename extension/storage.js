// Minimal storage layer for the live-only build.
//
// The repository is the source of truth for what has been solved. Locally we keep
// only: config, a small "synced" mirror for the README, a "processed" dedup map
// so a re-reported submission is a no-op, and the session flags for the popup.

export const KEYS = {
  config: "config",
  synced: "synced",
  problemset: "problemset",
  session: "session",
  processed: "processed",
  pendingSubmissions: "pendingSubmissions",
  readmeDirty: "readmeDirty",
  lastSync: "lastSync",
  githubAuthNoticeAt: "githubAuthNoticeAt",
  projectRepoStarred: "projectRepoStarred",
  schemaVersion: "schemaVersion",
};

const restrictAccess = (area) =>
  typeof area?.setAccessLevel === "function"
    ? area.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {})
    : Promise.resolve();

export const accessReady = Promise.all([
  restrictAccess(chrome.storage.local),
  restrictAccess(chrome.storage.session),
]);

export async function get(key, fallback) {
  await accessReady;
  const res = await chrome.storage.local.get(key);
  return res[key] === undefined ? fallback : res[key];
}

export async function set(key, value) {
  await accessReady;
  await chrome.storage.local.set({ [key]: value });
}

export async function remove(key) {
  await accessReady;
  await chrome.storage.local.remove(key);
}

export async function getConfig() {
  return get(KEYS.config, null);
}

export async function setConfig(config) {
  await set(KEYS.config, config);
}

// One-line "last sync" record so a silent failure is visible in the popup.
export async function setLastSync(record) {
  await set(KEYS.lastSync, { at: Date.now(), ...record });
}

export async function setSession(session) {
  await accessReady;
  await set(KEYS.session, { checkedAt: Date.now(), ...session });
  const config = await getConfig();
  const githubBad = config?.githubAuthInvalid === true;
  const anyBad =
    githubBad ||
    Object.entries(session).some(([key, value]) => key.endsWith("Ok") && value === false);
  await chrome.action.setBadgeText({ text: anyBad ? "!" : "" });
  if (anyBad) await chrome.action.setBadgeBackgroundColor({ color: "#e5533d" });
}

// Drop anything left behind by older queue/import/hold versions.
export async function migrate() {
  await accessReady;
  const schemaVersion = await get(KEYS.schemaVersion, 0);
  if (schemaVersion >= 7) return;
  await chrome.storage.local.remove([
    "queue",
    "cursors",
    "blocked",
    "paces",
    "importJobs",
    "log",
    "heldContest",
    "pendingLive",
    "liveBaseline",
    "aliases",
  ]);
  const processed = await get(KEYS.processed, {});
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  await set(
    KEYS.processed,
    Object.fromEntries(Object.entries(processed).filter(([, ts]) => ts > cutoff)),
  );
  await set(KEYS.schemaVersion, 7);
}

export async function clearWorkState() {
  await Promise.all([
    set(KEYS.processed, {}),
    set(KEYS.pendingSubmissions, []),
    remove(KEYS.readmeDirty),
  ]);
}
