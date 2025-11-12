import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";
import useVersioning from "../hooks/useVersioning";

/*
  VersionModal.jsx
  ---------------------------------------------
  Displays and manages Quotation versions (v1, v2, ...).

  ✅ Automation (5):
  1) Automatically lists all versions for current ticket (sorted by time).
  2) Highlights changed fields between current form and latest version (diff detection).
  3) One-click restore creates a new version snapshot automatically.
  4) JSON export of any version for audit or external sharing.
  5) Auto-labels author & timestamp with visual badges.
*/

export default function VersionModal({ open, onClose, quotationData, currentUser }) {
  const { ticketId, actions } = useContext(MultiContext);
  const {
    versions,
    latest,
    getDiffWithLatest,
    restore,
    snapshot,
  } = useVersioning({
    ticketId,
    kind: "quotation",
    payload: quotationData,
    currentUser,
  });

  const [diff, setDiff] = useState({});
  const [selectedVersion, setSelectedVersion] = useState(null);

  // (2) Detect differences dynamically
  useEffect(() => {
    setDiff(getDiffWithLatest());
  }, [quotationData, getDiffWithLatest]);

  // (1) Sorted version list
  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }, [versions]);

  // (4) Export handler
  const handleExport = (v) => {
    const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticketId}_quotation_v${v.version}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // (3) Restore version
  const handleRestore = (v) => {
    const entry = restore(v.version);
    actions.pushAudit(
      `Quotation restored to version v${v.version} → new snapshot v${entry.version}`
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">
            Quotation Versions — {ticketId}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {sortedVersions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">
              No versions yet. Make a change to create v1 automatically.
            </p>
          )}

          {sortedVersions.map((v) => (
            <div
              key={v.version}
              className={`p-3 mb-3 border rounded-lg ${
                selectedVersion === v.version ? "border-blue-400 bg-blue-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    v{v.version}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(v.savedAt).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {v.meta?.restoredFrom && (
                    <span className="px-2 py-0.5 text-[10px] bg-slate-200 rounded-md">
                      restored from v{v.meta.restoredFrom}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(v)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleRestore(v)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setSelectedVersion(v.version)}
                    className="text-xs text-slate-600 hover:underline"
                  >
                    View Diff
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-semibold">
                  {v.meta?.createdBy?.[0]?.toUpperCase() || "U"}
                </span>
                <span>{v.meta?.createdBy || "Unknown Author"}</span>
              </div>
            </div>
          ))}

          {/* (2) Diff viewer */}
          {selectedVersion && (
            <div className="mt-4 border-t pt-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Differences from latest
              </h4>
              {Object.keys(diff).length === 0 && (
                <div className="text-xs text-slate-400">No differences detected.</div>
              )}
              {Object.entries(diff).map(([key, val]) => (
                <div key={key} className="text-xs mb-1">
                  <span className="font-semibold text-slate-700">{key}:</span>{" "}
                  <span className="line-through text-red-500">{String(val.from)}</span>{" "}
                  <span className="text-emerald-600">→ {String(val.to)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3 text-right">
          <button
            onClick={() => {
              snapshot({ reason: "manual" });
              actions.pushAudit("Manual version snapshot created");
            }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Create New Version
          </button>
        </div>
      </div>
    </div>
  );
}
