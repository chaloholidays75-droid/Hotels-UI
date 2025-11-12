/*
  useFormState.js
  ---------------------------------------------
  Centralized form state manager for a step with validation and autosave glue.
*/

import { useCallback, useEffect, useRef, useState } from "react";

export default function useFormState({
  initial = {},
  schema = {},
  onChange, // (nextState)
  onEvent,  // ({type, payload})
}) {
  const [form, setForm] = useState(() => hydrate(initial, schema));
  const [errors, setErrors] = useState({});
  const dirtyRef = useRef(false);

  // 🔁 Re-hydrate when external initial changes
  useEffect(() => {
    setForm((prev) => mergeSafe(prev, hydrate(initial, schema)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  const validateField = useCallback(
    (name, value) => {
      const rule = schema[name];
      if (!rule) return null;
      let err = null;

      if (rule.required && (value === "" || value === null || value === undefined)) {
        err = "Required";
      }
      if (!err && rule.type === "number") {
        const n = Number(value);
        if (Number.isNaN(n)) err = "Invalid number";
        if (!err && rule.min !== undefined && n < rule.min) err = `Min ${rule.min}`;
        if (!err && rule.max !== undefined && n > rule.max) err = `Max ${rule.max}`;
      }
      if (!err && rule.pattern && !rule.pattern.test(String(value))) {
        err = "Invalid format";
      }
      return err;
    },
    [schema]
  );

  // ✅ Fixed: async-safe updates using queueMicrotask
  const safeEmitChange = useCallback((next) => {
    if (!onChange) return;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => onChange(next));
    } else {
      setTimeout(() => onChange(next), 0);
    }
  }, [onChange]);

  const setField = useCallback(
    (name, value) => {
      const rule = schema[name];
      const clean = rule?.transform ? rule.transform(value) : value;

      setForm((prev) => {
        const next = { ...prev, [name]: clean };
        safeEmitChange(next); // ✅ async safe emit
        dirtyRef.current = true;
        onEvent?.({ type: "field:change", payload: { name, value: clean } });

        // Validate immediately
        const err = validateField(name, clean);
        setErrors((e) => ({ ...e, [name]: err }));

        return next;
      });
    },
    [safeEmitChange, onEvent, validateField, schema]
  );

  const blurField = useCallback(
    (name) => {
      const err = validateField(name, form[name]);
      setErrors((e) => ({ ...e, [name]: err }));
      onEvent?.({ type: "field:blur", payload: { name } });
    },
    [validateField, form, onEvent]
  );

  const onDirty = useCallback(() => {
    const wasDirty = dirtyRef.current;
    dirtyRef.current = false;
    return wasDirty;
  }, []);

  const setMany = useCallback(
    (patch) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        safeEmitChange(next); // ✅ async safe emit
        dirtyRef.current = true;
        onEvent?.({ type: "fields:batch", payload: { keys: Object.keys(patch) } });

        // validate touched fields
        const errs = {};
        Object.keys(patch).forEach((k) => (errs[k] = validateField(k, next[k])));
        setErrors((e) => ({ ...e, ...errs }));

        return next;
      });
    },
    [safeEmitChange, onEvent, validateField]
  );

  return {
    form,
    errors,
    setField,
    blurField,
    setMany,
    onDirty,
    reset: (next = {}) => {
      setForm(hydrate(next, schema));
      setErrors({});
      onEvent?.({ type: "form:reset" });
    },
  };
}

// --------------------------
// Helpers
// --------------------------
function hydrate(obj, schema) {
  const out = { ...(obj || {}) };
  Object.keys(schema || {}).forEach((k) => {
    if (out[k] === undefined) {
      const t = schema[k]?.type;
      if (t === "string") out[k] = "";
      else if (t === "number") out[k] = "";
      else if (t === "boolean") out[k] = false;
      else out[k] = null;
    }
    if (schema[k]?.type === "string" && typeof out[k] === "string") {
      out[k] = out[k].trim();
    }
  });
  return out;
}

function mergeSafe(prev, next) {
  const merged = { ...prev };
  Object.keys(next).forEach((k) => (merged[k] = next[k]));
  return merged;
}
