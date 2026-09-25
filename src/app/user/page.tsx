"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  MessageSquareWarning,
  PlusCircle,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw,
  FileText,
} from "lucide-react";
import { ComplaintSubmissionModal } from "@/components/complaints/ComplaintSubmissionModal";

export default function UserPortalHomePage() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const fetchUserDataAndComplaints = async () => {
    setLoading(true);
    try {
      const [meRes, cmpRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/complaints?my=true"),
      ]);

      if (meRes.ok) {
        const d = await meRes.json();
        if (d.authenticated && d.user) {
          setUser(d.user);
        }
      }

      if (cmpRes.ok) {
        const d = await cmpRes.json();
        setComplaints(d.data || []);
      }
    } catch (err) {
      console.error("User portal data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndComplaints();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REPORTED":
        return { label: "Reported", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
      case "ROUTED":
        return { label: "Routed to Dept", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" };
      case "UNDER_REVIEW":
        return { label: "Under Review", bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" };
      case "ASSIGNED":
        return { label: "Officer Assigned", bg: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" };
      case "IN_PROGRESS":
        return { label: "In Progress", bg: "#ecfeff", border: "#a5f3fc", text: "#0891b2" };
      case "FIELD_VERIFIED":
        return { label: "Field Verified", bg: "#f0fdf4", border: "#86efac", text: "#166534" };
      case "RESOLVED":
        return { label: "Resolved", bg: "#dcfce7", border: "#4ade80", text: "#14532d" };
      case "CLOSED":
        return { label: "Closed", bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
      default:
        return { label: status, bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" };
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Citizen Intelligence Portal
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              AQUA-LENS — CITIZEN PORTAL
            </h1>
            <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
              Welcome, <span className="font-semibold text-white">{user?.name || "Citizen"}</span>. Submit grievances, track active complaints in real-time, and query local WASH intelligence.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user?.role && (user.role.includes("ADMIN") || user.role === "ADMINISTRATOR" || user.role === "ANALYST" || user.role === "FIELD_OFFICER") && (
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-600"
              >
                <span>← Admin Portal</span>
              </Link>
            )}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/25 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ REGISTER GRIEVANCE</span>
            </button>
          </div>
        </div>


        {/* 2 Primary Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Ask Aqua-Lens */}
          <div className="card rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all border-2 border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  AI ASSISTANT
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">ASK AQUA-LENS</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ask questions about drinking water access, sanitation coverage, monsoon flood preparedness, and community-related WASH information.
              </p>
            </div>
            <Link
              href="/ask"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>OPEN ASK AQUA-LENS</span>
            </Link>
          </div>

          {/* Card 2: Complaint Center */}
          <div className="card rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all border-2 border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <MessageSquareWarning className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  CITIZEN GRIEVANCE
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">COMPLAINT CENTER</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Register a new water/sanitation grievance with live camera photo evidence and GPS location, or track previously submitted complaints.
              </p>
            </div>
            <Link
              href="/complaints"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-sm"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>OPEN COMPLAINT CENTER</span>
            </Link>
          </div>
        </div>

        {/* MY COMPLAINTS SECTION */}
        <div className="card rounded-2xl p-6 space-y-4 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                MY COMPLAINTS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing complaints submitted by your registered account ({user?.email || "Current User"})
              </p>
            </div>
            <button
              onClick={fetchUserDataAndComplaints}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
              Loading your submitted complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <MessageSquareWarning className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">No Complaints Registered Yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                You haven't submitted any grievances from this account. Click below to lodge a water or sanitation issue.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Grievance Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-3 px-3">Tracking ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Submitted Date</th>
                    <th className="py-3 px-3">Last Updated</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {complaints.map((c) => {
                    const badge = getStatusBadge(c.status);
                    const trackingIdDisplay = c.trackingId || c.complaintNumber || c.id;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{trackingIdDisplay}</span>
                            <button
                              onClick={() => copyToClipboard(trackingIdDisplay)}
                              className="text-slate-400 hover:text-blue-600 p-0.5"
                              title="Copy Tracking ID"
                            >
                              {copiedId === trackingIdDisplay ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {c.category?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {c.routedDepartment || "TWAD / Gram Panchayat"}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/complaints?track=${encodeURIComponent(trackingIdDisplay)}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-[11px]"
                          >
                            <span>View / Track</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Register Grievance Modal */}
      <ComplaintSubmissionModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          fetchUserDataAndComplaints();
        }}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          fetchUserDataAndComplaints();
        }}
      />
    </AppShell>
  );
}
