"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Wrench,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  DollarSign,
  Users,
  Search,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLUMNS = [
  { key: "IDENTIFIED", label: "Identified", color: "border-slate-600 text-slate-500" },
  { key: "AWAITING_VERIFICATION", label: "Awaiting Verification", color: "border-amber-600 text-amber-400" },
  { key: "PLANNED", label: "Planned", color: "border-blue-600 text-blue-400" },
  { key: "APPROVED", label: "Approved", color: "border-indigo-600 text-indigo-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-cyan-500 text-blue-700" },
  { key: "COMPLETED", label: "Completed", color: "border-emerald-600 text-emerald-700" },
];

export default function InterventionPlannerPage() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    communityId: "",
    title: "",
    issueCategory: "WATER_SUPPLY",
    recommendedAction: "",
    priority: "HIGH",
    estimatedBudget: 3500000,
    assignedOrg: "TWAD Board / JJM Mission Directorate",
    fundingSource: "Jal Jeevan Mission (CSS 60:40 Fund)",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, comRes] = await Promise.all([
        fetch("/api/interventions"),
        fetch("/api/communities?limit=100"),
      ]);
      if (intRes.ok) {
        const j = await intRes.json();
        setInterventions(j.data || []);
      }
      if (comRes.ok) {
        const c = await comRes.json();
        setCommunities(c.data || []);
        if (c.data?.length > 0 && !form.communityId) {
          setForm((prev) => ({ ...prev, communityId: c.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create intervention");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = interventions.filter((item) => {
    if (selectedPriority !== "ALL" && item.priority !== selectedPriority) return false;
    return true;
  });

  const totalBudget = interventions.reduce((sum, item) => sum + (item.estimatedBudget || 0), 0);
  const inProgressCount = interventions.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = interventions.filter((i) => i.status === "COMPLETED").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-6 h-6 text-blue-600" />
              <span>INTERVENTION ACTION PLANNER</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritize, assign, budget, track and verify on-ground water, sanitation and flood defense interventions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-[#f8fafc] p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 font-semibold rounded ${
                  viewMode === "kanban"
                    ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Kanban Pipeline
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 font-semibold rounded ${
                  viewMode === "table"
                    ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Data Table
              </button>
            </div>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-aqualens", {
                    detail: null,
                  })
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all"
              title="Ask AI questions about intervention priorities and resource allocation"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Aqua-Lens</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Intervention</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Pipeline Interventions</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {interventions.length} Projects
            </div>
            <span className="text-[10px] text-blue-600">Targeting critical basin needs</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-cyan-500/30">
            <span className="text-[11px] text-slate-500 block">Total Committed Budget</span>
            <div className="text-2xl font-black font-mono text-blue-700 mt-1">
              ₹{(totalBudget / 100000).toFixed(1)} Lakhs
            </div>
            <span className="text-[10px] text-slate-500">JJM & State SBM-G Outlay</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Currently Under Construction</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {inProgressCount} Active
            </div>
            <span className="text-[10px] text-slate-500">Mobilized on ground</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-emerald-500/30">
            <span className="text-[11px] text-slate-500 block">Delivered & Verified</span>
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {completedCount} Completed
            </div>
            <span className="text-[10px] text-emerald-400/80">Commissioned systems</span>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filter by Priority:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                selectedPriority === p
                  ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                  : "bg-white text-slate-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* View Mode 1: Kanban Board */}
        {viewMode === "kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((col) => {
              const colInterventions = filtered.filter((i) => i.status === col.key);
              return (
                <div
                  key={col.key}
                  className="w-80 shrink-0 rounded-2xl bg-white/90 border border-slate-200 p-3.5 space-y-3 flex flex-col max-h-[calc(100vh-22rem)]"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {colInterventions.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colInterventions.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs hover:border-cyan-500/40 transition-colors shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              item.priority === "CRITICAL"
                                ? "bg-red-950/80 text-red-400 border border-red-800"
                                : item.priority === "HIGH"
                                ? "bg-orange-950/80 text-orange-400 border border-orange-800"
                                : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {item.recommendedAction}
                        </p>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-blue-600 font-semibold">{item.community?.name}</span>
                          <span className="font-mono text-emerald-700 font-bold">
                            ₹{(item.estimatedBudget / 100000).toFixed(1)}L
                          </span>
                        </div>

                        {/* Status transition dropdown */}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Move status:</span>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className="bg-[#070e20] text-[10px] text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            {STATUS_COLUMNS.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {colInterventions.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-600 font-mono">
                        No interventions in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Data Table */}
        {viewMode === "table" && (
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                    <th className="py-3 px-4">Intervention Title</th>
                    <th className="py-3 px-4">Target Settlement</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Budget (₹ INR)</th>
                    <th className="py-3 px-4">Implementing Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.title}</div>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                          {item.recommendedAction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-blue-600 font-semibold">
                        {item.community?.name} ({item.community?.district})
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {item.issueCategory}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.priority === "CRITICAL"
                              ? "bg-red-950/80 text-red-400 border border-red-800"
                              : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className="bg-[#070e20] text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{(item.estimatedBudget / 100000).toFixed(2)} Lakhs
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.assignedOrg || "TWAD Board"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create Intervention */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#091530] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Create Planned Intervention</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Target Community *</label>
                  <select
                    value={form.communityId}
                    onChange={(e) => setForm({ ...form, communityId: e.target.value })}
                    className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district}) — Score: {c.compositeVulnerabilityScore}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Intervention Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Solar Borehole Pumping & Elevated Tank"
                    className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Issue Category</label>
                    <select
                      value={form.issueCategory}
                      onChange={(e) => setForm({ ...form, issueCategory: e.target.value })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200"
                    >
                      <option value="WATER_SUPPLY">Water Supply</option>
                      <option value="SANITATION_FACILITY">Sanitation Facility</option>
                      <option value="WATER_PURIFICATION">Water Purification</option>
                      <option value="FLOOD_DEFENSE">Flood Defense</option>
                      <option value="INFRASTRUCTURE_REPAIR">Infrastructure Repair</option>
                      <option value="CAPACITY_BUILDING">Capacity Building</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Recommended Action & Scope *</label>
                  <textarea
                    required
                    rows={2}
                    value={form.recommendedAction}
                    onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })}
                    placeholder="Detailed operational steps, equipment specifications, and deployment milestones..."
                    className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Estimated Budget (INR ₹) *</label>
                    <input
                      type="number"
                      required
                      value={form.estimatedBudget}
                      onChange={(e) => setForm({ ...form, estimatedBudget: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Executing Department</label>
                    <input
                      type="text"
                      value={form.assignedOrg}
                      onChange={(e) => setForm({ ...form, assignedOrg: e.target.value })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 font-bold text-white hover:from-cyan-500 hover:to-teal-500 shadow-lg"
                  >
                    Save Intervention Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
