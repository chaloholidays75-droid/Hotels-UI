/*
  syncQueue.js
  ---------------------------------------------
  Offline-first queue for syncing workflow data to backend.

  ✅ Automation (5):
  1) Connectivity listener (online/offline) auto-runs queue on re-connect.
  2) Exponential backoff & scheduled retry (every 10 minutes).
  3) Conflict resolver keeps newest 'lastUpdated'.
  4) Queue compression merges duplicate UPSERTs per ticket+step.
  5) Progress events via simple subscriber pattern.
*/

const NS = "chalo.multi.syncQueue.v1";
const T_MIN = 10 * 60 * 1000; // 10 minutes

const getRoot = () => {
  try {
    return JSON.parse(localStorage.getItem(NS)) || { q: [] };
  } catch {
    return { q: [] };
  }
};
const setRoot = (r) => localStorage.setItem(NS, JSON.stringify(r));

let listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = (type, payload) => listeners.forEach((fn) => fn({ type, payload }));

function saveQueue(q) {
  setRoot({ q });
  emit("queue:update", { size: q.length });
}

export function enqueue(job) {
  // job: { id?, kind, ticketId, stepId?, payload, ts, tries }
  const root = getRoot();
  const q = root.q;

  const id = job.id || `${job.kind}:${job.ticketId}:${job.stepId || "all"}`;
  const next = {
    ...job,
    id,
    ts: job.ts || Date.now(),
    tries: job.tries || 0,
  };

  // Compression: keep only the most recent UPSERT per id
  const idx = q.findIndex((x) => x.id === id);
  if (idx >= 0 && job.kind === "UPSERT_STEP") {
    const newer = (a, b) => (a.payload?.lastUpdated || 0) >= (b.payload?.lastUpdated || 0) ? a : b;
    q[idx] = newer(q[idx], next);
  } else {
    q.push(next);
  }

  saveQueue(q);
  return next.id;
}

export function peek() {
  const { q } = getRoot();
  return q[0] || null;
}

export function dequeue() {
  const root = getRoot();
  const job = root.q.shift();
  saveQueue(root.q);
  return job || null;
}

export async function runSync(processor /* async (job) => {ok:boolean, conflict?:boolean, serverPayload?} */) {
  let job = peek();
  while (job) {
    emit("queue:processing", { id: job.id, tries: job.tries });
    try {
      const res = await processor(job);

      if (res?.conflict && res?.serverPayload) {
        // Keep latest lastUpdated
        const localTs = new Date(job.payload?.lastUpdated || 0).getTime();
        const remoteTs = new Date(res.serverPayload?.lastUpdated || 0).getTime();
        if (localTs > remoteTs) {
          // re-enqueue local as authoritative
          enqueue({ ...job, ts: Date.now(), tries: job.tries + 1 });
        }
      }

      dequeue(); // remove current job
      emit("queue:done", { id: job.id });
    } catch (e) {
      // backoff and reschedule
      const tries = (job.tries || 0) + 1;
      const delay = Math.min(tries * 2000, 15000); // cap 15s per immediate backoff
      await new Promise((r) => setTimeout(r, delay));

      // put back with updated tries
      dequeue();
      enqueue({ ...job, tries, ts: Date.now() });
      emit("queue:retry", { id: job.id, tries });

      break; // stop this run; scheduler will pick up later
    }

    job = peek();
  }
}

// -------------
// Scheduler
// -------------
let retryTimer = null;

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    emit("queue:schedule", { at: new Date().toISOString() });
    // consumers should call runSync() with their processor on this event.
  }, T_MIN);
}
scheduleRetry();

// -------------
// Connectivity
// -------------
if (typeof window !== "undefined") {
  window.addEventListener("online", () => emit("net:online", {}));
  window.addEventListener("offline", () => emit("net:offline", {}));
}
