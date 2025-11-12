/*
  useVersioning.js
  ---------------------------------------------
  Quotation version control (v1, v2, ...) with diffs and restore.

  ✅ Automation (5):
  1) Auto-create version on significant change (keys watchlist).
  2) Auto-label versions (v1, v2...) with timestamp + author meta.
  3) Shallow diff helper between latest and current form payload.
  4) One-click restore (creates a fresh snapshot with restored payload).
  5) Emits audit-compatible events via onEvent hook callback.
*/

import { useCallback, useMemo, useRef } from "react";
import { createVersion, getVersions, getLatestVersion, diffVersions, restoreVersion } from "../storage/versionStorage";

export default function useVersioning({
  ticketId,
  kind = "quotation",
  payload,
  watchKeys = ["sellingRate", "currency", "markupPercent", "marginPercent", "profit"],
  currentUser = null,
  onEvent, // emit events outward
}) {
  const lastSnapshotRef = useRef(null);

  const versions = useMemo(() => getVersions(ticketId, kind), [ticketId, kind]);
  const latest = useMemo(() => getLatestVersion(ticketId, kind), [ticketId, kind]);

  const shouldSnapshot = useCallback(
    (prev, next) => {
      if (!prev) return true; // first-time
      return watchKeys.some((k) => JSON.stringify(prev[k]) !== JSON.stringify(next[k]));
    },
    [watchKeys]
  );

  const snapshot = useCallback(
    (meta = {}) => {
      const entry = createVersion(ticketId, kind, payload, {
        createdBy: currentUser?.name || currentUser?.id || "system",
        ...meta,
      });
      lastSnapshotRef.current = payload;
      onEvent?.({ type: "version:created", payload: { ticketId, kind, version: entry.version } });
      return entry;
    },
    [ticketId, kind, payload, currentUser, onEvent]
  );

  const maybeSnapshotOnChange = useCallback(() => {
    const prev = lastSnapshotRef.current || latest?.payload;
    if (shouldSnapshot(prev, payload)) {
      return snapshot({ reason: "auto" });
    }
    return null;
  }, [payload, latest, shouldSnapshot, snapshot]);

  const getDiffWithLatest = useCallback(() => {
    const base = latest?.payload || {};
    return diffVersions(base, payload);
  }, [latest, payload]);

  const restore = useCallback(
    (version) => {
      const entry = restoreVersion(ticketId, kind, version);
      onEvent?.({ type: "version:restored", payload: { ticketId, kind, version, newVersion: entry.version } });
      return entry;
    },
    [ticketId, kind, onEvent]
  );

  return {
    versions,
    latest,
    snapshot,
    maybeSnapshotOnChange,
    getDiffWithLatest,
    restore,
  };
}
