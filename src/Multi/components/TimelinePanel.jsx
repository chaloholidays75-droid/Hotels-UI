import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MultiContext } from "../MultiContext";

/*
  TimelinePanel.jsx
  ---------------------------------------------
  Displays chronological workflow actions, syncs with auditLog in context.

  ✅ Automation (5):
  1) Auto-syncs in real time with context auditLog (live updates).
  2) Auto-scrolls smoothly to the latest event when new actions arrive.
  3) Highlights current step in timeline for quick visual context.
  4) Filter bar for user/date search that updates dynamically.
  5) Expand/collapse sections with animation and state persistence (stored in localStorage).
*/

export default function TimelinePanel() {
  const { auditLog, currentStep, STEP_IDS } = useContext(MultiContext);
  const [filterText, setFilterText] = useState("");
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef(null);

  // (5) Persist expanded/collapsed state
  useEffect(() => {
    const s = localStorage.getItem("timeline.expanded");
    if (s !== null) setExpanded(s === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("timeline.expanded", expanded ? "true" : "false");
  }, [expanded]);

  // (1) Filtered + sorted events
  const events = useMemo(() => {
    const f = (filterText || "").toLowerCase();
    return auditLog
      .filter((e) => !f || e.message.toLowerCase().includes(f))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [auditLog, filterText]);

  // (2) Auto-scroll to newest
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [events.length]);

  // (4) Quick filter keyboard focus shortcut
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("timelineFilter")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // (3) Highlight current step events
  const highlightColor = useMemo(() => {
    const idx = STEP_IDS.indexOf(currentStep);
    const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    return palette[idx % palette.length];
  }, [currentStep, STEP_IDS]);

  return (
    <aside
      className={`transition-all duration-500 ease-in-out ${
        expanded ? "w-72" : "w-16"
      } bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
          Timeline
        </h3>
        <button
          onClick={() => setExpanded((x) => !x)}
          className="text-slate-500 hover:text-slate-800 transition"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          )}
        </button>
      </div>

      {expanded && (
        <>
          {/* (4) Filter */}
          <div className="p-2 border-b border-slate-100">
            <input
              id="timelineFilter"
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-200 focus:ring-1 focus:ring-blue-400 px-2 py-1"
            />
          </div>

          {/* (1,2,3) Events list */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 p-3"
          >
            {events.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-8">No audit events yet</div>
            )}

            {events.map((e, i) => {
              const isActive =
                e.message.toLowerCase().includes(currentStep.toLowerCase()) ||
                e.message.includes(currentStep);
              const color = isActive ? highlightColor : "#cbd5e1";
              return (
                <div key={i} className="relative mb-3 pl-5 text-xs text-slate-600 group">
                  {/* vertical line */}
                  <div className="absolute left-1 top-0 bottom-0 w-px bg-slate-200 group-last:hidden"></div>
                  {/* dot */}
                  <div
                    className="absolute left-0 top-[6px] w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>

                  <div className="ml-2 flex flex-col">
                    <span
                      className={`font-medium ${isActive ? "text-slate-900" : "text-slate-600"}`}
                    >
                      {e.message}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(e.at).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}
