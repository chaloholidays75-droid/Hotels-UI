/*
  MultiContext.jsx
  ---------------------------------------------
  Global state brain for the 5-step workflow.

  ✅ Automation (5):
  1) Auto-hydrate last session (ticket + drafts) at mount.
  2) Auto-propagate forward: next step pre-fills from previous.
  3) Smart-diff autosave to local draftStorage on state changes.
  4) Online listener: pushes UPSERT jobs to syncQueue automatically.
  5) Step-gate validation (lightweight) before moving forward.
*/

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveDraft, loadLatestDraft, mergeDraft } from "./storage/draftStorage";
import { enqueue, subscribe, runSync } from "./storage/syncQueue";
import * as VersionStore from "./storage/versionStorage";
// Optional: if you already have it elsewhere, this import will resolve.
// If not yet created, context still works without it.
let MultiApis = {};
try {
  // eslint-disable-next-line global-require
  MultiApis = require("./MultiApis");
} catch {}

// -----------------------------
// Types & defaults
// -----------------------------
const STEP_IDS = ["requisition", "quotation", "requestToBook", "clientConfirmation", "invoice"];

const defaultFormData = {
  requisition: {
    hotelId: null,
    hotelName: "",
    checkIn: "",
    checkOut: "",
    nights: 0,
    currency: "USD",
    rate: "",
    vatPercent: "",
    commissionable: false,
    commissionType: "percentage",
    commissionValue: "",
    lastUpdated: null,
  },
  quotation: {
    version: 1,
    currency: "USD",
    sellingRate: "",
    markupPercent: "",
    marginPercent: "",
    profit: "",
    notes: "",
    lastUpdated: null,
  },
  requestToBook: {
    supplierReference: "",
    paidStatus: "Unpaid",
    commissionPaid: 0,
    balance: 0,
    lastUpdated: null,
  },
  clientConfirmation: {
    status: "On-Request",
    voucherNo: "",
    invoiceNo: "",
    receivedAmount: 0,
    balance: 0,
    lastUpdated: null,
  },
  invoice: {
    netAmount: 0,
    totalPayable: 0,
    pdfPath: "",
    lastUpdated: null,
  },
};

const defaultStepStatus = {
  requisition: { complete: false, updatedAt: null },
  quotation: { complete: false, updatedAt: null },
  requestToBook: { complete: false, updatedAt: null },
  clientConfirmation: { complete: false, updatedAt: null },
  invoice: { complete: false, updatedAt: null },
};

// -----------------------------
// Context
// -----------------------------
export const MultiContext = createContext(null);

export function MultiProvider({ children, initialTicketId = null }) {
  const [ticketId, setTicketId] = useState(initialTicketId || generateTicketId());
  const [currentStep, setCurrentStep] = useState("requisition");
  const [formData, setFormData] = useState(defaultFormData);
  const [stepStatus, setStepStatus] = useState(defaultStepStatus);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [auditLog, setAuditLog] = useState([]);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // -----------------------------
  // 1) AUTO-HYDRATE LAST SESSION
  // -----------------------------
  useEffect(() => {
    STEP_IDS.forEach((sid) => {
      const d = loadLatestDraft(ticketId, sid);
      if (d?.data) {
        setFormData((prev) => ({
          ...prev,
          [sid]: { ...prev[sid], ...d.data, lastUpdated: d.data.lastUpdated || d.lastUpdated },
        }));
      }
    });
  }, [ticketId]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const pushAudit = useCallback((msg) => {
    const entry = { at: new Date().toISOString(), message: msg };
    setAuditLog((prev) => [...prev, entry]);
  }, []);

  const updateStepData = useCallback((stepId, partial) => {
    // small diff writer
    setFormData((prev) => {
      const next = {
        ...prev,
        [stepId]: {
          ...prev[stepId],
          ...partial,
          lastUpdated: new Date().toISOString(),
        },
      };
      return next;
    });
  }, []);

  // -----------------------------
  // 3) SMART-DIFF AUTOSAVE (local)
  // -----------------------------
  const lastSavedRef = useRef({});
  useEffect(() => {
    setSaveState("saving");

    const id = setTimeout(() => {
      try {
        STEP_IDS.forEach((sid) => {
          const current = formData[sid];
          const last = lastSavedRef.current[sid];
          const changed = JSON.stringify(current) !== JSON.stringify(last);
          if (changed) {
            saveDraft(ticketId, sid, current);
            lastSavedRef.current[sid] = current;
          }
        });
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 800); // debounce

    return () => clearTimeout(id);
  }, [formData, ticketId]);

  // -----------------------------
  // 2) AUTO-PROP FORWARD
  // (when a dependency changes, hint next step)
  // -----------------------------
  useEffect(() => {
    // nights from requisition -> used downstream
    const r = formData.requisition;
    if (r.checkIn && r.checkOut) {
      const nights = Math.max(
        0,
        Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24))
      );
      if (nights !== (r.nights || 0)) {
        updateStepData("requisition", { nights });
      }
    }
    // carry hotel/currency into quotation if empty
    const q = formData.quotation;
    if (!q.currency && r.currency) updateStepData("quotation", { currency: r.currency });
  }, [formData.requisition?.checkIn, formData.requisition?.checkOut, formData.requisition?.currency]);

  // -----------------------------
  // 4) ONLINE LISTENER -> SYNC QUEUE
  // -----------------------------
  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (evt.type === "net:online") {
        setOnline(true);
        pushAudit("Reconnected. Attempting background sync…");
        if (MultiApis?.syncJob) {
          runSync(MultiApis.syncJob);
        }
      } else if (evt.type === "net:offline") {
        setOnline(false);
        pushAudit("Going offline. Changes stored locally.");
      }
    });
    if (typeof window !== "undefined") {
      const handler = () => setOnline(navigator.onLine);
      window.addEventListener("online", handler);
      window.addEventListener("offline", handler);
      return () => {
        window.removeEventListener("online", handler);
        window.removeEventListener("offline", handler);
        unsub?.();
      };
    }
    return unsub;
  }, [pushAudit]);

  const queueStepUpsert = useCallback(
    (stepId) => {
      const payload = formData[stepId];
      if (!payload) return;
      enqueue({
        kind: "UPSERT_STEP",
        ticketId,
        stepId,
        payload,
      });
    },
    [formData, ticketId]
  );

  // -----------------------------
  // 5) STEP-GATE VALIDATION
  // -----------------------------
  const canAdvance = useCallback(
    (fromStep) => {
      try {
        // Optional soft validation: call a function if exposed on MultiApis
        if (MultiApis?.validate) {
          const res = MultiApis.validate(fromStep, formData[fromStep]);
          if (res?.ok === false) {
            pushAudit(`Validation failed on ${fromStep}: ${res?.message || "Check required fields"}`);
            return false;
          }
        }
        return true;
      } catch {
        return true; // non-blocking if validation not wired
      }
    },
    [formData, pushAudit]
  );

  const nextStep = useCallback(() => {
    const idx = STEP_IDS.indexOf(currentStep);
    if (idx === -1 || idx === STEP_IDS.length - 1) return;
    if (!canAdvance(currentStep)) return;

    // mark current as complete + enqueue for sync
    setStepStatus((prev) => ({
      ...prev,
      [currentStep]: { complete: true, updatedAt: new Date().toISOString() },
    }));
    queueStepUpsert(currentStep);

    setCurrentStep(STEP_IDS[idx + 1]);
  }, [currentStep, canAdvance, queueStepUpsert]);

  const prevStep = useCallback(() => {
    const idx = STEP_IDS.indexOf(currentStep);
    if (idx <= 0) return;
    setCurrentStep(STEP_IDS[idx - 1]);
  }, [currentStep]);

  const actions = useMemo(
    () => ({
      setTicketId,
      setCurrentStep,
      updateStepData,
      nextStep,
      prevStep,
      markComplete: (stepId) =>
        setStepStatus((p) => ({ ...p, [stepId]: { complete: true, updatedAt: new Date().toISOString() } })),
      queueStepUpsert,
      createQuotationVersion: (payload, meta) => VersionStore.createVersion(ticketId, "quotation", payload, meta),
      getQuotationVersions: () => VersionStore.getVersions(ticketId, "quotation"),
      pushAudit,
    }),
    [nextStep, prevStep, queueStepUpsert, pushAudit, ticketId, updateStepData]
  );

  const value = useMemo(
    () => ({
      ticketId,
      currentStep,
      formData,
      stepStatus,
      saveState,
      auditLog,
      online,
      actions,
      STEP_IDS,
    }),
    [ticketId, currentStep, formData, stepStatus, saveState, auditLog, online, actions]
  );

  return <MultiContext.Provider value={value}>{children}</MultiContext.Provider>;
}

// Fallback ticket generator (you can replace with backend-generated)
function generateTicketId() {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `TKT-${n}`;
}
