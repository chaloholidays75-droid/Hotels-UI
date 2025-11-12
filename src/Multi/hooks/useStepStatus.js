/*
  useStepStatus.js
  ---------------------------------------------
  Live step completion % with validation-aware tracking.

  ✅ Automation (5):
  1) Computes completion % based on required fields or validator.
  2) Auto-updates when dependencies change.
  3) Emits "complete" event once when 100% reached.
  4) Provides color state: "danger" | "warn" | "ok".
  5) Integrates with reminders (consumers can dismiss on complete).
*/

import { useEffect, useMemo, useRef, useState } from "react";

export default function useStepStatus({
  data,
  required = [], // array of field names to check
  validator, // optional (data) => { ok:boolean, missing:[...]}
  onEvent,
}) {
  const [pct, setPct] = useState(0);
  const [state, setState] = useState("danger"); // danger | warn | ok
  const firedCompleteRef = useRef(false);

  const missing = useMemo(() => {
    if (validator) {
      const res = validator(data);
      if (!res || typeof res.ok === "undefined") return [];
      return res.ok ? [] : res.missing || [];
    }
    // field presence check
    return required.filter((k) => {
      const v = data?.[k];
      return v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v));
    });
  }, [data, required, validator]);

  useEffect(() => {
    const total = (required && required.length) || (validator ? 1 : 0);
    let percent = 0;

    if (validator) {
      percent = missing.length ? 0 : 100;
    } else if (total > 0) {
      percent = Math.round(((total - missing.length) / total) * 100);
    }
    setPct(percent);

    const st = percent >= 90 ? "ok" : percent >= 50 ? "warn" : "danger";
    setState(st);

    if (percent === 100 && !firedCompleteRef.current) {
      firedCompleteRef.current = true;
      onEvent?.({ type: "step:complete", payload: { percent } });
    }
    if (percent < 100) firedCompleteRef.current = false;
  }, [missing, required, validator, onEvent]);

  return { percent: pct, state, missing };
}
