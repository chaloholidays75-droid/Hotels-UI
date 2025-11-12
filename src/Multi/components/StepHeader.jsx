import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";

/*
  StepHeader.jsx
  ---------------------------------------------
  Smart header for the 5-step workflow.

  ✅ Automation (5):
  1) Auto-title: derives a human label from current step.
  2) Live status chips: save state + online/offline indicator auto-update.
  3) Last-updated clock: shows "x mins ago" from the active step’s lastUpdated (auto-refreshes every 30s).
  4) Auto-user avatar: pulls user from localStorage ("currentUser") → initials fallback.
  5) Animated step transition: subtle fade/slide whenever currentStep changes (no external deps).

  Usage: place at the top of your workflow layout.
*/

const STEP_TITLES = {
  requisition: "Requisition — Supplier Request",
  quotation: "Quotation — Client Proposal",
  requestToBook: "Request to Hotel — Supplier Confirmation",
  clientConfirmation: "Client Confirmation — Voucher & Payments",
  invoice: "Invoice — Final Billing & Closure",
};

export default function StepHeader() {
  const { currentStep, formData, ticketId, saveState, online } = useContext(MultiContext);
  const [tick, setTick] = useState(0); // re-render for "x mins ago"
  const [anim, setAnim] = useState(false);

  // (1) Auto-title for current step
  const title = STEP_TITLES[currentStep] || "Workflow";

  // (3) Compute "last updated" for active step
  const lastUpdatedIso = formData?.[currentStep]?.lastUpdated || null;
  const timeAgo = useMemo(() => {
    if (!lastUpdatedIso) return "No changes yet";
    const ms = Date.now() - new Date(lastUpdatedIso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins <= 0) return "Just now";
    if (mins === 1) return "1 minute ago";
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs === 1) return "1 hour ago";
    if (hrs < 24) return `${hrs} hours ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }, [lastUpdatedIso, tick]);

  // Auto refresh the "x mins ago" chip every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // (4) Auto-user avatar (from localStorage or initials)
  const { avatarUrl, initials, userName } = useMemo(() => {
    let u = null;
    try {
      u = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {}
    const name = u?.name || u?.fullName || u?.email || "User";
    const inits =
      (u?.name &&
        u.name
          .split(" ")
          .map((p) => p[0]?.toUpperCase())
          .join("")
          .slice(0, 2)) ||
      (name[0] ? name[0].toUpperCase() : "U");
    return { avatarUrl: u?.avatarUrl || null, initials: inits, userName: name };
  }, []);

  // (5) Animate when step changes
  useEffect(() => {
    setAnim(true);
    const t = setTimeout(() => setAnim(false), 350);
    return () => clearTimeout(t);
  }, [currentStep]);

  // Save chip color
  const saveChip =
    saveState === "saving"
      ? { label: "Saving…", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" }
      : saveState === "saved"
      ? { label: "Saved", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" }
      : saveState === "error"
      ? { label: "Save Error", cls: "bg-red-100 text-red-800 border-red-300" }
      : { label: "Idle", cls: "bg-slate-100 text-slate-700 border-slate-300" };

  const netChip = online
    ? { label: "Online", cls: "bg-blue-100 text-blue-800 border-blue-300" }
    : { label: "Offline (Local Drafts)", cls: "bg-orange-100 text-orange-800 border-orange-300" };

  return (
    <header
      className={`w-full mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ${
        anim ? "translate-y-[-2px] opacity-100" : "opacity-100"
      }`}
      style={{ willChange: "transform, opacity" }}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white text-sm font-semibold">
              {ticketId ? String(ticketId).slice(0, 4) : "TKT"}
            </span>
            <h2 className="truncate text-xl font-semibold text-slate-900">{title}</h2>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip label={`Ticket: ${ticketId || "—"}`} cls="bg-slate-100 text-slate-700 border-slate-300" />
            <Chip label={saveChip.label} cls={saveChip.cls} />
            <Chip label={netChip.label} cls={netChip.cls} />
            <Chip
              label={`Last update: ${timeAgo}`}
              cls="bg-violet-100 text-violet-800 border-violet-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">Current Step</div>
            <div className="text-sm font-medium text-slate-800 capitalize">{currentStep}</div>
          </div>
          <Avatar avatarUrl={avatarUrl} initials={initials} title={userName} />
        </div>
      </div>
    </header>
  );
}

function Chip({ label, cls = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function Avatar({ avatarUrl, initials, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-700 text-sm font-semibold">{initials}</span>
        )}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-medium text-slate-800 leading-4">{title}</div>
        <div className="text-xs text-slate-500">Owner</div>
      </div>
    </div>
  );
}
