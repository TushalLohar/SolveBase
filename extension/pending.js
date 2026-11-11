import * as store from "./storage.js";

const MAX_JOBS = 30;
const PHASE_PRIORITY = { ready: 0, verdict: 1, watch: 2 };
let mutationChain = Promise.resolve();

function normalized(jobs) {
  if (!Array.isArray(jobs)) return [];
  const now = Date.now();
  return jobs
    .filter(
      (job) =>
        job &&
        typeof job.id === "string" &&
        typeof job.platform === "string" &&
        Number(job.expiresAt || 0) > now,
    )
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
}

export async function list() {
  return normalized(await store.get(store.KEYS.pendingSubmissions, []));
}

function mutate(change) {
  const task = mutationChain.then(async () => {
    const jobs = await list();
    const next = normalized(change(jobs) || jobs)
      .sort((a, b) => {
        if (a.phase === b.phase) return Number(b.createdAt || 0) - Number(a.createdAt || 0);
        return (PHASE_PRIORITY[a.phase] ?? 3) - (PHASE_PRIORITY[b.phase] ?? 3);
      })
      .slice(0, MAX_JOBS);
    await store.set(store.KEYS.pendingSubmissions, next);
    return next;
  });
  mutationChain = task.catch(() => {});
  return task;
}

export function upsert(job) {
  return mutate((jobs) => [job, ...jobs.filter((candidate) => candidate.id !== job.id)]);
}

// Replace a witnessed event with its verified submission ID in one write.
export function promote(job, replacement) {
  return mutate((jobs) => [
    replacement,
    ...jobs.filter((candidate) => candidate.id !== job.id && candidate.id !== replacement.id),
  ]);
}

export function update(id, changes) {
  return mutate((jobs) => jobs.map((job) => (job.id === id ? { ...job, ...changes } : job)));
}

export function remove(id) {
  return mutate((jobs) => jobs.filter((job) => job.id !== id));
}

export function removeMatching(platform, tabId) {
  return mutate((jobs) =>
    jobs.filter(
      (job) =>
        !(
          job.phase === "watch" &&
          job.platform === platform &&
          Number(job.tabId) === Number(tabId)
        ),
    ),
  );
}
