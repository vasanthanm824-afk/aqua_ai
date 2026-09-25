"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Search,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Camera,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Activity,
  Layers,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from "@/lib/complaints";

function ComplaintTrackerContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [trackingInput, setTrackingInput] = useState(initialId);
  const [complaint, setComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/track?id=${encodeURIComponent(id.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Grievance not found. Please check your tracking ID.");
      }
      setComplaint(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to locate grievance.");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setTrackingInput(initialId);
      fetchComplaint(initialId);
    }
  }, [initialId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(trackingInput);
  };

  const statusObj = complaint
    ? COMPLAINT_STATUSES.find((s) => s.value === complaint.status)
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              <span>Track My Grievance</span>
            </h1>
            <span className="font-mono text-xs bg-cyan-950/80 text-blue-600 border border-cyan-800 px-2 py-0.5 rounded">
              Citizen Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Check the live departmental resolution progress of your Aqua-Lens registered grievance
          </p>
        </div>

        <Link
          href="/complaints"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <span>← Back to Complaint Center</span>
        </Link>
      </div>

      {/* Tracking ID Search Bar */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#091530] p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. AQL-2026-TN-RAM-000124 or CMP-2026-0001)"
              className="w-full rounded-xl bg-[#060c1c] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-500 border border-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !trackingInput.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Track Grievance</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Grievance Tracking Details Card */}
      {complaint && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Dossier Summary */}
          <div className="rounded-2xl border border-slate-200 bg-[#091530] p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">
                  OFFICIAL GRIEVANCE TRACKING DOSSIER
                </span>
                <h2 className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {complaint.trackingId || complaint.complaintNumber}
                </h2>
                <span className="text-xs text-slate-500">
                  Registered:{" "}
                  {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    statusObj?.color || "bg-cyan-950 text-blue-700 border-cyan-800"
                  }`}
                >
                  {statusObj?.label || complaint.status}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold ${
                    complaint.verificationStatus === "VERIFIED"
                      ? "bg-emerald-950 text-emerald-700 border border-emerald-800"
                      : "bg-blue-950 text-blue-400 border border-blue-800"
                  }`}
                >
                  {complaint.verificationStatus}
                </span>
              </div>
            </div>

            {/* Grievance Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Category
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {complaint.category.replace("_", " ")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Assigned Department
                </span>
                <span className="font-bold text-blue-700 text-xs mt-0.5 block truncate">
                  {complaint.routedDepartment || "Central Administrative Queue"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Jurisdiction Authority
                </span>
                <span className="font-semibold text-slate-700 text-xs mt-0.5 block truncate">
                  {complaint.jurisdiction || "Local Administrative Authority"}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="p-4 rounded-xl bg-[#060c1c] border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">{complaint.title}</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* Location & Live Evidence Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Location: {complaint.locationName || "Verified GPS Coordinates"}</span>
              </div>

              {complaint.evidence && complaint.evidence.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-700 text-[11px] font-mono">
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>LIVE CAMERA EVIDENCE RECORDED ({complaint.evidence.length})</span>
                </div>
              )}
            </div>
          </div>

          {/* Canonical 8-Step Lifecycle Timeline (Requirement 14 & 15) */}
          <div className="rounded-2xl border border-slate-200 bg-[#091530] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Resolution Lifecycle Timeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time progression verified against official departmental logs
                </p>
              </div>
              <span className="text-[11px] font-mono text-blue-700 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                8-Stage Protocol
              </span>
            </div>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {complaint.timeline?.map((step: any, index: number) => {
                const isPassed = step.completed;
                const isActive = step.active;

                return (
                  <div key={step.step} className="relative flex items-start gap-4">
                    {/* Step Circle Indicator */}
                    <div
                      className={`absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/40 ring-4 ring-[#091530]"
                          : isActive
                          ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/40 animate-pulse ring-4 ring-[#091530]"
                          : "bg-slate-100 text-slate-500 ring-4 ring-[#091530]"
                      }`}
                    >
                      {isPassed ? "✓" : step.step}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            isPassed
                              ? "text-emerald-700"
                              : isActive
                              ? "text-blue-700 font-extrabold"
                              : "text-slate-500"
                          }`}
                        >
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(step.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs ${
                          isPassed || isActive ? "text-slate-600" : "text-slate-500"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aqua-Lens Community Connection & Deterministic Risk Context (Requirement 17) */}
          {complaint.community && (
            <div className="rounded-2xl border border-cyan-500/30 bg-[#091530] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Community Geospatial Intelligence Context
                  </h3>
                </div>
                <Link
                  href={`/communities/${complaint.community.id}`}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Community</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {complaint.community.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {complaint.community.district}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">
                    Composite Vulnerability
                  </span>
                  <span className="font-bold text-blue-600 font-mono text-base mt-0.5 block">
                    {complaint.community.compositeVulnerabilityScore?.toFixed(1) || "N/A"}/100
                  </span>
                  <span className="text-[10px] text-slate-500">Official Risk Score</span>
                </div>

                <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Water Access</span>
                  <span className="font-bold text-emerald-700 font-mono text-base mt-0.5 block">
                    {complaint.community.waterAccessPct || 0}%
                  </span>
                  <span className="text-[10px] text-slate-500">Pipeline Coverage</span>
                </div>

                <div className="p-3 rounded-xl bg-[#060c1c] border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Flood Exposure</span>
                  <span className="font-bold text-amber-400 font-mono text-base mt-0.5 block">
                    {complaint.community.floodHazardLevel || "LOW"}
                  </span>
                  <span className="text-[10px] text-slate-500">Geospatial Hazard</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-200 text-[11px] text-slate-500 italic">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <b>Model Invariance Notice:</b> Grievances logged by citizens provide field ground-truth
                  evidence for dispatch verification. Grievance submissions do not arbitrarily rewrite
                  the official 6-factor deterministic vulnerability model.
                </span>
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href="/complaints/register"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-white font-semibold"
            >
              <span>+ Register Another Grievance</span>
            </Link>

            <Link
              href="/complaints"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Return to Administrative Complaint Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComplaintTrackerPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Loading tracking portal...</span>
          </div>
        }
      >
        <ComplaintTrackerContent />
      </Suspense>
    </AppShell>
  );
}
