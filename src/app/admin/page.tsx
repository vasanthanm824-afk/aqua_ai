"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Layers,
  ShieldCheck,
  Users,
  Key,
  CheckCircle2,
  XCircle,
  FileText,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

export default function AdministrationPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For local dev, display seeded users and system audit
    setUsers([
      { id: "1", name: "Dr. K. Senthil Nathan, IAS", email: "admin@aqualens.gov.in", role: "ADMINISTRATOR", org: "TWAD Board & JJM State Directorate" },
      { id: "2", name: "Dr. Ananya Sharma", email: "ananya.sharma@aqualens.gov.in", role: "ANALYST", org: "Tamil Nadu State GIS Cell" },
      { id: "3", name: "M. Subramanian", email: "m.subramanian@aqualens.gov.in", role: "FIELD_OFFICER", org: "TWAD Board Ramanathapuram Division" },
      { id: "4", name: "Public WASH Observer", email: "viewer@aqualens.gov.in", role: "VIEWER", org: "State Water Observatory" },
    ]);

    setAuditLogs([
      { id: "log-1", user: "Dr. K. Senthil Nathan, IAS", action: "SEED", entity: "System Database", time: "2026-09-25 14:17:10", details: "India National Policy v1 and 12 Tamil Nadu baseline pilot Gram Panchayats initialized." },
      { id: "log-2", user: "Dr. Ananya Sharma", action: "SIMULATE", entity: "PlanningScenario", time: "2026-09-25 14:17:11", details: "Tamil Nadu Priority Coastal Inundation & Drought Defense Plan (₹5.0 Crore budget)." },
      { id: "log-3", user: "M. Subramanian", action: "FIELD_AUDIT", entity: "Mandapam Block Habitations", time: "2026-09-25 14:17:12", details: "Ground truth inspection submitted with GPS coordinates." },
    ]);
    setLoading(false);
  }, []);

  const roles = ["ADMINISTRATOR", "ANALYST", "FIELD_OFFICER", "VIEWER"] as const;

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <span>SYSTEM ADMINISTRATION & ACCESS CONTROL</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-based access matrix, security auditing, organization memberships, and credential governance
            </p>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Role-Based Access Control (RBAC) Permission Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Guaranteed server-side permission enforcement across all critical operational endpoints
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white text-slate-600 font-mono border-b border-slate-200">
                  <th className="py-2.5 px-3">System Permission</th>
                  <th className="py-2.5 px-3 text-center text-blue-600 font-bold">Administrator</th>
                  <th className="py-2.5 px-3 text-center text-teal-700 font-bold">Analyst</th>
                  <th className="py-2.5 px-3 text-center text-amber-400 font-bold">Field Officer</th>
                  <th className="py-2.5 px-3 text-center text-slate-500 font-bold">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {[
                  { key: "canManageUsers", label: "User & Security Management" },
                  { key: "canConfigureScoring", label: "Scoring Weight & Policy Adjustment" },
                  { key: "canImportData", label: "CSV & GeoJSON Data Ingestion" },
                  { key: "canCreateInterventions", label: "Create Capital Interventions" },
                  { key: "canUpdateInterventions", label: "Update Status & Workflow" },
                  { key: "canSubmitFieldVerification", label: "Submit Field Audit Sensors" },
                  { key: "canRunSimulations", label: "Resource Allocation Simulator" },
                  { key: "canExportReports", label: "Export Official Intelligence Reports" },
                ].map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-100/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{perm.label}</td>
                    {roles.map((r) => {
                      const allowed = ROLE_PERMISSIONS[r][perm.key as keyof typeof ROLE_PERMISSIONS["ADMINISTRATOR"]];
                      return (
                        <td key={r} className="py-2.5 px-3 text-center">
                          {allowed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Accounts Management */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Active User Accounts ({users.length})</span>
              </h3>
              <p className="text-xs text-slate-500">Authorized operators registered in this workspace</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-100/30">
                    <td className="py-3 px-3 font-semibold text-slate-700">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-blue-700">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] font-bold bg-cyan-950/80 text-blue-600 px-2 py-0.5 rounded border border-cyan-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.org}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Security & Governance Audit Trail</span>
          </h3>
          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{log.action}</span>
                    <span className="text-slate-600 font-semibold">{log.entity}</span>
                    <span className="text-slate-500 text-[10px]">by {log.user}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
