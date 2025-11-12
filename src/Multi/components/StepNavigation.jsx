import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";

/*
  StepNavigation.jsx
  ---------------------------------------------
  Interactive navigation bar for moving across 5 workflow steps.

  ✅ Automation (5):
  1) Auto-locks unfinished steps (cannot skip ahead unless prior complete).
  2) Auto-syncs progress bar (% complete) with stepStatus from context.
  3) Keyboard shortcuts ← / → navigate between steps (with debounce).
  4) Tooltip per step shows last updated + completion info.
  5) Smooth animation + checkmark pulse when a step is marked complete.
*/

const COLORS = {
  complete: "bg-emerald-600",
  active: "bg-blue-600",
  pending: "bg-slate-300",
};

export default function StepNavigation() {
  const { STEP_IDS, currentStep, stepStatus, actions, formData } = useContext(MultiContext);
  const [animStep, setAnimStep] = useState(null);

  // (2) Progress bar: count % of completed steps
  const progressPct = useMemo(() => {
    const done = Object.values(stepStatus).filter((s) => s.complete).length;
    return Math.round((done / STEP_IDS.length) * 100);
  }, [stepStatus, STEP_IDS.length]);

  // (3) Keyboard shortcuts ← / →
  useEffect(() => {
    let last = 0;
    const onKey = (e) => {
      if (Date.now() - last < 300) return; // debounce
      if (e.key === "ArrowRight") actions.nextStep();
      if (e.key === "ArrowLeft") actions.prevStep();
      last = Date.now();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  // (5) Animate when a step completes
  useEffect(() => {
    const doneSteps = STEP_IDS.filter((id) => stepStatus[id]?.complete);
    const recent = doneSteps[doneSteps.length - 1];
    if (recent) {
      setAnimStep(recent);
      const t = setTimeout(() => setAnimStep(null), 700);
      return () => clearTimeout(t);
    }
  }, [stepStatus, STEP_IDS]);

  // Step metadata
  const getStepInfo = (sid) => {
    const st = stepStatus[sid];
    const data = formData[sid];
    const updated = data?.lastUpdated
      ? new Date(data.lastUpdated).toLocaleString([], { hour: "2-digit", minute: "2-digit" })
      : "Not updated";
    return {
      complete: !!st?.complete,
      updated,
      active: sid === currentStep,
    };
  };

  // (1) Lock logic — disable clicking future steps
  const isLocked = (sid) => {
    const idx = STEP_IDS.indexOf(sid);
    const curIdx = STEP_IDS.indexOf(currentStep);
    if (idx <= curIdx) return false;
    const prev = STEP_IDS[idx - 1];
    return !stepStatus[prev]?.complete;
  };

  const handleStepClick = (sid) => {
    if (isLocked(sid)) return;
    actions.setCurrentStep(sid);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 mb-4">
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>

      {/* Step buttons */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        {STEP_IDS.map((sid) => {
          const info = getStepInfo(sid);
          const locked = isLocked(sid);
          const color = info.active
            ? COLORS.active
            : info.complete
            ? COLORS.complete
            : COLORS.pending;
          const pulse = animStep === sid ? "animate-pulse" : "";

          return (
            <button
              key={sid}
              title={`${sid} • ${info.updated}`}
              disabled={locked}
              onClick={() => handleStepClick(sid)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300
              ${locked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"}
              ${info.active ? "border-blue-400 bg-blue-50" : "border-slate-200"}
              `}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${color} ${pulse}`}
              >
                {info.complete ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="white"
                    className="w-3 h-3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[10px] text-white font-semibold">
                    {STEP_IDS.indexOf(sid) + 1}
                  </span>
                )}
              </span>
              <span className="text-sm font-medium capitalize text-slate-700">{sid}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-500 text-right">
        {progressPct}% completed • Use ← / → to navigate
      </div>
    </div>
  );
}
