/* 
  draftStorage.js
  ---------------------------------------------
  Local-first, versioned draft storage for workflow steps.

  ✅ Automation (5):
  1) Auto-expire old drafts after 30 days.
  2) Versioned backups on every save (timestamped snapshots).
  3) Merge strategy with "lastUpdated" precedence.
  4) Integrity hash per snapshot (detect corruption).
  5) Silent auto-restore of the most recent valid snapshot.
*/

const NS = "chalo.multi.drafts.v1"; // namespace key in localStorage
const MAX_AGE_DAYS = 30;

// -----------------------------
// Utilities
// -----------------------------
const nowIso = () => new Date().toISOString();

const daysAgo = (iso) => {
  const d = new Date(iso).getTime();
  return (Date.now() - d) / (1000 * 60 * 60 * 24);
};

const safeParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const getRoot = () => {
  const parsed = safeParse(localStorage.getItem(NS));
  if (!parsed || typeof parsed !== "object" || !parsed.tickets) {
    return { tickets: {} };
  }
  return parsed;
};

const setRoot = (root) => {
  if (!root || typeof root !== "object") return;
  localStorage.setItem(NS, JSON.stringify(root));
};


const hash = (obj) => {
  // lightweight DJB2 over stringified payload
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
};

// -----------------------------
// Core helpers
// -----------------------------
export function purgeOldDrafts() {
  const root = getRoot();
  let changed = false;

  Object.keys(root.tickets).forEach((ticketId) => {
    const steps = root.tickets[ticketId] || {};
    Object.keys(steps).forEach((stepId) => {
      const rec = steps[stepId];
      if (!rec?.snapshots?.length) return;
      // keep only non-expired snapshots
      const kept = rec.snapshots.filter((s) => daysAgo(s.savedAt) <= MAX_AGE_DAYS);
      if (kept.length !== rec.snapshots.length) {
        steps[stepId].snapshots = kept;
        changed = true;
      }
      // cleanup empty
      if (!kept.length) delete steps[stepId];
    });
    if (!Object.keys(steps).length) delete root.tickets[ticketId];
  });

  if (changed) setRoot(root);
  return changed;
}

export function _ensureTicket(root, ticketId) {
  if (!root.tickets[ticketId]) root.tickets[ticketId] = {};
  return root.tickets[ticketId];
}

export function saveDraft(ticketId, stepId, data) {
  const root = getRoot();
  const steps = _ensureTicket(root, ticketId);

  const payload = {
    ticketId,
    stepId,
    data,
    lastUpdated: data?.lastUpdated || nowIso(),
  };

  const snapshot = {
    savedAt: nowIso(),
    payload,
    hash: hash(payload),
  };

  if (!steps[stepId]) {
    steps[stepId] = { snapshots: [snapshot] };
  } else {
    steps[stepId].snapshots.push(snapshot);
  }

  setRoot(root);
  return snapshot;
}

export function loadLatestDraft(ticketId, stepId) {
  // 🔁 Auto-restore newest valid snapshot
  const root = getRoot();
  const rec = root.tickets?.[ticketId]?.[stepId];
  if (!rec?.snapshots?.length) return null;

  // newest at the end
  for (let i = rec.snapshots.length - 1; i >= 0; i--) {
    const s = rec.snapshots[i];
    if (s.hash === hash(s.payload)) return s.payload; // integrity OK
  }
  return null; // nothing valid
}

export function listDrafts(ticketId) {
  const root = getRoot();
  const steps = root.tickets?.[ticketId] || {};
  const out = {};
  Object.keys(steps).forEach((stepId) => {
    const snaps = steps[stepId].snapshots || [];
    out[stepId] = snaps.map((s) => ({
      savedAt: s.savedAt,
      lastUpdated: s.payload?.lastUpdated,
      valid: s.hash === hash(s.payload),
    }));
  });
  return out;
}

export function mergeDraft(ticketId, stepId, incoming) {
  // 🧠 Merge by lastUpdated precedence
  const current = loadLatestDraft(ticketId, stepId);
  if (!current) return saveDraft(ticketId, stepId, incoming);

  const curTs = new Date(current.lastUpdated || 0).getTime();
  const incTs = new Date(incoming.lastUpdated || 0).getTime();

  const winner = incTs >= curTs ? incoming : current;
  return saveDraft(ticketId, stepId, winner);
}

export function clearTicketDrafts(ticketId) {
  const root = getRoot();
  if (root.tickets?.[ticketId]) {
    delete root.tickets[ticketId];
    setRoot(root);
    return true;
  }
  return false;
}

// Run an opportunistic purge each import
try {
  purgeOldDrafts();
} catch {}
