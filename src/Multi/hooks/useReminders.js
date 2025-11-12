/*
  useReminders.js
  ---------------------------------------------
  Step inactivity reminders with escalation and persistence.

  ✅ Automation (5):
  1) Auto-create reminder if a step inactive beyond threshold.
  2) Persistent store in localStorage across sessions.
  3) Auto-dismiss reminders when step completes or edited.
  4) Escalation flag after long overdue (e.g., > 3 days).
  5) Emits events to power ReminderBar and timeline.
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const NS = "chalo.multi.reminders.v1";
const readRoot = () => {
  try {
    return JSON.parse(localStorage.getItem(NS)) || { items: [] };
  } catch {
    return { items: [] };
  }
};
const writeRoot = (r) => localStorage.setItem(NS, JSON.stringify(r));

function upsertReminder(items, r) {
  const idx = items.findIndex((x) => x.ticketId === r.ticketId && x.stepId === r.stepId);
  if (idx >= 0) items[idx] = { ...items[idx], ...r };
  else items.push(r);
  return items;
}

export default function useReminders({
  ticketId,
  stepId,
  inactivityMs = 3 * 24 * 60 * 60 * 1000, // 3 days
  onEvent,
  isStepComplete = false,
  lastUpdatedIso,
}) {
  const [root, setRoot] = useState(readRoot());
  const tRef = useRef(null);

  const reminders = useMemo(() => root.items.filter((x) => x.ticketId === ticketId), [root, ticketId]);
  const stepReminder = useMemo(
    () => reminders.find((r) => r.stepId === stepId),
    [reminders, stepId]
  );

  const dismiss = useCallback(() => {
    const next = { ...root, items: root.items.filter((x) => !(x.ticketId === ticketId && x.stepId === stepId)) };
    writeRoot(next);
    setRoot(next);
    onEvent?.({ type: "reminder:dismiss", payload: { ticketId, stepId } });
  }, [root, ticketId, stepId, onEvent]);

  useEffect(() => {
    if (isStepComplete) {
      if (stepReminder) dismiss();
      return;
    }
    if (!lastUpdatedIso) return;

    const schedule = () => {
      if (tRef.current) clearTimeout(tRef.current);
      const last = new Date(lastUpdatedIso).getTime();
      const dueIn = Math.max(0, last + inactivityMs - Date.now());
      tRef.current = setTimeout(() => {
        const r = readRoot();
        const overdueDays = Math.floor((Date.now() - (last + inactivityMs)) / (24 * 60 * 60 * 1000));
        upsertReminder(r.items, {
          ticketId,
          stepId,
          createdAt: new Date().toISOString(),
          inactiveSince: lastUpdatedIso,
          escalate: overdueDays >= 3, // escalation after 3 extra days
        });
        writeRoot(r);
        setRoot(r);
        onEvent?.({ type: "reminder:created", payload: { ticketId, stepId } });
      }, dueIn);
    };

    schedule();
    return () => clearTimeout(tRef.current);
  }, [ticketId, stepId, lastUpdatedIso, inactivityMs, isStepComplete, dismiss, onEvent, stepReminder]);

  return {
    reminders,
    stepReminder,
    dismiss,
  };
}
