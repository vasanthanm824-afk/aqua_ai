"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function AlertsMonitoringPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const updateAlertStatus = async (alertId: string, status: "ACKNOWLEDGED" | "RESOLVED") => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, status }),
      });
      if (res.ok) {
        loadAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>ALERTS & EARLY MONITORING CENTER</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated threshold monitoring, hydrological hazard overlaps, and field disparity notifications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-600 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
              {activeCount} Active Warnings
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200 text-xs">
          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 mr-1">Status:</span>
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                  statusFilter === st
                    ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                    : "bg-white text-slate-500 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 mr-1">Severity:</span>
            {["ALL", "CRITICAL", "HIGH", "WARNING"].map((sv) => (
              <button
                key={sv}
                onClick={() => setSeverityFilter(sv)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                  severityFilter === sv
                    ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                    : "bg-white text-slate-500 hover:text-white"
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Checking monitoring feeds...</span>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl p-5 border transition-all ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : alert.severity === "HIGH"
                    ? "bg-orange-950/20 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    : "bg-[#091530] border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          alert.severity === "CRITICAL"
                            ? "bg-red-950 text-red-400 border border-red-700"
                            : alert.severity === "HIGH"
                            ? "bg-orange-950 text-orange-400 border border-orange-700"
                            : "bg-amber-950 text-amber-400 border border-amber-700"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm">{alert.title}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>
                        Source Engine: <b className="text-slate-700">{alert.source}</b>
                      </span>
                      {alert.community && (
                        <span>
                          Settlement:{" "}
                          <Link
                            href={`/communities/${alert.community.id}`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            {alert.community.name}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.status === "ACTIVE" && (
                      <button
                        onClick={() => updateAlertStatus(alert.id, "ACKNOWLEDGED")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-700 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== "RESOLVED" && (
                      <button
                        onClick={() => updateAlertStatus(alert.id, "RESOLVED")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-xs font-bold text-emerald-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                    {alert.status === "RESOLVED" && (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-500">
              No alerts found matching the selected filter criteria.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
