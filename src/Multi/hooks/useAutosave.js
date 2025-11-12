/*
  useAutosave.js
  ---------------------------------------------
  Per-step autosave with debounced writes and status events.

  ✅ Automation (5):
  1) Debounced periodic autosave (default 1500ms).
  2) Smart diff (saves only when data actually changed).
  3) Tab-visibility aware (pauses when tab hidden).
  4) Status emitter: "saving" | "saved" | "error".
  5) Broadcasts autosave events via optional onEvent for chained hooks.
*/

import { useEffect, useRef, useState } from "react";
import { saveDraft } from "../storage/draftStorage";

export default function useAutosave({
  ticketId,
  stepId,
  data,
  delay = 1500,
  onEvent, // (evt: {type, payload})
}) {
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const lastRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);

  // Pause when tab hidden for performance
  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.visibilityState !== "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!ticketId || !stepId) return;
    if (pausedRef.current) return;

    const changed = JSON.stringify(lastRef.current) !== JSON.stringify(data);
    if (!changed) return;

    setStatus("saving");
    onEvent?.({ type: "autosave:begin", payload: { stepId } });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        saveDraft(ticketId, stepId, data);
        lastRef.current = data;
        setStatus("saved");
        onEvent?.({ type: "autosave:end", payload: { stepId, ok: true } });
      } catch (e) {
        setStatus("error");
        onEvent?.({ type: "autosave:end", payload: { stepId, ok: false, error: e?.message } });
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ticketId, stepId]);

  return { status };
}
