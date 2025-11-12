/*
  versionStorage.js
  ---------------------------------------------
  Quotation version history (v1, v2...) per ticket.

  ✅ Automation (5):
  1) Auto-increment version numbers per ticket.
  2) Changelog snapshot on every version create.
  3) JSON export for any version.
  4) Quick diff builder (shallow key compare) between versions.
  5) Safe-restore to any version (creates a new snapshot).
*/

const NS = "chalo.multi.versions.v1";

const getRoot = () => {
  try {
    return JSON.parse(localStorage.getItem(NS)) || { tickets: {} };
  } catch {
    return { tickets: {} };
  }
};
const setRoot = (r) => localStorage.setItem(NS, JSON.stringify(r));

const nowIso = () => new Date().toISOString();

export function createVersion(ticketId, kind, payload, meta = {}) {
  // kind: "quotation" | "invoice" | etc. (kept flexible)
  const root = getRoot();
  if (!root.tickets[ticketId]) root.tickets[ticketId] = {};
  if (!root.tickets[ticketId][kind]) root.tickets[ticketId][kind] = { counter: 0, items: [] };

  const bucket = root.tickets[ticketId][kind];
  const version = ++bucket.counter;

  const entry = {
    version,
    savedAt: nowIso(),
    payload,
    meta,
  };
  bucket.items.push(entry);
  setRoot(root);
  return entry;
}

export function getVersions(ticketId, kind = "quotation") {
  const r = getRoot();
  return r.tickets?.[ticketId]?.[kind]?.items || [];
}

export function getLatestVersion(ticketId, kind = "quotation") {
  const vs = getVersions(ticketId, kind);
  return vs[vs.length - 1] || null;
}

export function exportVersion(ticketId, kind, version) {
  const vs = getVersions(ticketId, kind);
  const item = vs.find((v) => v.version === Number(version));
  if (!item) return null;
  return JSON.stringify(item, null, 2);
}

export function diffVersions(aPayload = {}, bPayload = {}) {
  // shallow diff only (fast and stable)
  const keys = Array.from(new Set([...Object.keys(aPayload), ...Object.keys(bPayload)]));
  const changed = {};
  keys.forEach((k) => {
    if (JSON.stringify(aPayload[k]) !== JSON.stringify(bPayload[k])) {
      changed[k] = { from: aPayload[k], to: bPayload[k] };
    }
  });
  return changed;
}

export function restoreVersion(ticketId, kind, version) {
  // Restore by creating a new snapshot with the old payload
  const vs = getVersions(ticketId, kind);
  const target = vs.find((v) => v.version === Number(version));
  if (!target) return null;
  return createVersion(ticketId, kind, target.payload, {
    restoredFrom: version,
  });
}
