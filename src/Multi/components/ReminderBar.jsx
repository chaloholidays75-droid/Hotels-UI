import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";
import useReminders from "../hooks/useReminders";

/*
  ReminderBar.jsx
  ---------------------------------------------
  Floating bar displaying pending or overdue reminders per ticket/step.

  ✅ Automation (5):
  1) Live reminder count auto-updates (listens to useReminders output).
  2) Pulsing bell animation when any reminder becomes overdue.
  3) Click on a reminder opens its related step automatically.
  4) Auto-dismiss reminders when corresponding step completes.
  5) Tooltip shows "due since" age dynamically (refresh every 30s).
*/

export default function ReminderBar() {
  const { STEP_IDS, ticketId, stepStatus, actions, formData } = useContext(MultiContext);
  const [tick, setTick] = useState(0);

  // (1) Collect reminders from all steps
  const reminders = useMemo(() => {
    const all = [];
    STEP_IDS.forEach((sid) => {
      const last = formData[sid]?.lastUpdated;
      const complete = stepStatus[sid]?.complete;
      const { stepReminder } = useReminders({
        ticketId,
        stepId: sid,
        lastUpdatedIso: last,
        isStepComplete: complete,
      });
      if (stepReminder) all.push(stepReminder);
    });
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, stepStatus, ticketId, tick]);

  // (5) Refresh age display every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const overdue = reminders.filter((r) => r.escalate);
  const isAlert = overdue.length > 0;

  // (3) Click handler → jump to step
  const handleJump = (stepId) => {
    actions.setCurrentStep(stepId);
  };

  return (
    <div
      className={`w-full border-b transition-all duration-300 flex items-center justify-between px-5 py-2 text-sm font-medium
      ${isAlert ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700"}
      `}
    >
      <div className="flex items-center gap-2">
        <BellIcon active={isAlert} />
        {reminders.length === 0 ? (
          <span>No pending reminders</span>
        ) : (
          <span>
            {reminders.length} pending reminder{reminders.length > 1 ? "s" : ""} —{" "}
            {overdue.length > 0
              ? `${overdue.length} overdue`
              : "all within acceptable time"}
          </span>
        )}
      </div>

      {/* (3) Step chips */}
      <div className="flex gap-2 flex-wrap">
        {reminders.map((r, i) => {
          const ago = getAgo(r.inactiveSince);
          return (
            <button
              key={i}
              onClick={() => handleJump(r.stepId)}
              title={`Inactive since ${ago}`}
              className={`px-2 py-1 rounded-md text-xs border ${
                r.escalate
                  ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                  : "bg-amber-100 border-amber-300 text-amber-800"
              }`}
            >
              {r.stepId}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BellIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-5 h-5 transition-transform duration-500 ${
        active ? "animate-bounce text-rose-600" : "text-amber-600"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.657A1.657 1.657 0 0113.2 19H10.8a1.657 1.657 0 01-1.657-1.343L8 10a4 4 0 118 0l-1.143 7.657z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 19h8m-4 2a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
    </svg>
  );
}

function getAgo(iso) {
  if (!iso) return "unknown";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
