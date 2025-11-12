import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "./MultiContext";

/*
  WorkflowDashboard.jsx
  ---------------------------------------------
  Displays a live summary of all workflows (tickets) with KPIs and filters.

  ✅ Automation (5):
  1) Auto-refreshes every 60s to reflect new updates.
  2) Live KPIs (Pending, Completed, Overdue) update instantly via context.
  3) Status-colored badges for each step.
  4) Quick filter/search by Ticket ID or Step.
  5) Reminder integration — highlights workflows with overdue tasks.
*/

export default function WorkflowDashboard() {
  const { workflows, STEP_IDS, actions } = useContext(MultiContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStep, setFilterStep] = useState("all");
  const [tick, setTick] = useState(0);

  // (1) Auto refresh every 60s
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // (4) Filtering logic
  const filtered = useMemo(() => {
    return workflows
      .filter(
        (w) =>
          (!searchTerm || String(w.ticketId).includes(searchTerm)) &&
          (filterStep === "all" || w.currentStep === filterStep)
      )
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [workflows, searchTerm, filterStep]);

  // (2) Live KPI summary
  const summary = useMemo(() => {
    const total = workflows.length;
    const completed = workflows.filter((w) => w.status === "completed").length;
    const pending = workflows.filter((w) => w.status !== "completed").length;
    const overdue = workflows.filter((w) => w.reminders?.some((r) => r.escalate)).length;
    return { total, completed, pending, overdue };
  }, [workflows, tick]);

  const handleOpenWorkflow = (ticketId) => {
    actions.setActiveWorkflow(ticketId);
  };

  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-semibold text-slate-800">Workflow Dashboard</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search Ticket ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 rounded-md"
          />
          <select
            value={filterStep}
            onChange={(e) => setFilterStep(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 rounded-md"
          >
            <option value="all">All Steps</option>
            {STEP_IDS.map((sid) => (
              <option key={sid} value={sid}>
                {sid}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* (2) KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total" value={summary.total} color="bg-slate-800" />
        <KpiCard label="Completed" value={summary.completed} color="bg-emerald-600" />
        <KpiCard label="Pending" value={summary.pending} color="bg-blue-500" />
        <KpiCard label="Overdue" value={summary.overdue} color="bg-rose-600" />
      </div>

      {/* (3) Workflow Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Ticket ID</th>
              <th className="px-3 py-2">Current Step</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reminders</th>
              <th className="px-3 py-2">Last Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  No matching workflows found
                </td>
              </tr>
            )}

            {filtered.map((w) => {
              const overdue = w.reminders?.some((r) => r.escalate);
              const color =
                w.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : overdue
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-blue-50 text-blue-700 border-blue-200";
              return (
                <tr
                  key={w.ticketId}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="px-3 py-2 font-semibold text-slate-800">{w.ticketId}</td>
                  <td className="px-3 py-2 capitalize">{w.currentStep}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-md border ${color}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {w.reminders?.length ? (
                      <span
                        className={`text-xs font-medium ${
                          overdue ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {w.reminders.length} active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(w.lastUpdated).toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleOpenWorkflow(w.ticketId)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className="flex flex-col justify-center items-center border border-slate-100 rounded-lg bg-slate-50 py-3">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white ${color}`}
      >
        {value}
      </div>
      <div className="text-xs mt-1 text-slate-600 font-medium">{label}</div>
    </div>
  );
}
