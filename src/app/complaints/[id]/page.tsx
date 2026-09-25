"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ChevronLeft,
  MessageSquareWarning,
  MapPin,
  Calendar,
  User,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Send,
  RefreshCw,
  Camera,
  EyeOff,
  UserCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_CATEGORIES,
} from "@/lib/complaints";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Field Verification Creation
  const [creatingVerification, setCreatingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // Assign Officer
  const [assignedOfficerName, setAssignedOfficerName] = useState("");

  const loadComplaint = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (!res.ok) {
        throw new Error("Complaint not found.");
      }
      const json = await res.json();
      setComplaint(json.data);
      setNewStatus(json.data.status);
      setAssignedOfficerName(json.data.assignedOfficerName || "");
    } catch (err: any) {
      setError(err.message || "Failed to load complaint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadComplaint();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || undefined,
          assignedOfficerName: assignedOfficerName || undefined,
        }),
      });
      if (res.ok) {
        setIsUpdatingStatus(false);
        setStatusNote("");
        loadComplaint();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFieldVerification = async () => {
    if (!complaint) return;
    setCreatingVerification(true);
    setVerificationSuccess(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerName: assignedOfficerName || "Subramanian, Assistant Engineer",
          notes: `Inspection ordered for grievance ${complaint.complaintNumber} (${complaint.title}). Verify water/sanitation physical condition.`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setVerificationSuccess("Field verification task generated successfully!");
        loadComplaint();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create verification task");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingVerification(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Loading grievance dossier...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !complaint) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Grievance Record Not Found</h2>
          <p className="text-xs text-slate-500">
            {error || "The requested grievance does not exist or may have been purged."}
          </p>
          <Link
            href="/complaints"
            className="inline-block px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-800 text-xs font-semibold text-blue-700 hover:bg-cyan-900"
          >
            ← Return to Complaint Center
          </Link>
        </div>
      </AppShell>
    );
  }

  const categoryObj = COMPLAINT_CATEGORIES.find((c) => c.value === complaint.category);
  const statusObj = COMPLAINT_STATUSES.find((s) => s.value === complaint.status);
  const priorityObj = COMPLAINT_PRIORITIES.find((p) => p.value === complaint.priority);

  // Workflow steps
  const WORKFLOW_STEPS = ["REPORTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const currentStepIndex = WORKFLOW_STEPS.indexOf(complaint.status);

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/complaints"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Complaint Center Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-aqualens", {
                    detail: complaint.community
                      ? { id: complaint.community.id, name: complaint.community.name }
                      : null,
                  })
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask AI about this Issue</span>
            </button>

            {complaint.community && (
              <Link
                href={`/communities/${complaint.community.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:text-white"
              >
                <span>View Community Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Header Dossier Panel */}
        <div className="rounded-2xl border border-cyan-500/30 bg-[#091530] p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-blue-700 bg-cyan-950 px-3 py-1 rounded-xl border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.15)]">
                  {complaint.complaintNumber}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                    priorityObj?.badgeClass || "bg-slate-100 text-slate-600"
                  }`}
                >
                  Priority: {complaint.priority}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                    statusObj?.color || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {statusObj?.label || complaint.status}
                </span>
              </div>

              <h1 className="text-xl font-black text-slate-900 mt-2 tracking-wide">
                {complaint.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-slate-700">{complaint.locationName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Reported on{" "}
                    {new Date(complaint.createdAt).toLocaleDateString([], {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
                {complaint.isAnonymous && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-teal-700 font-medium">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Anonymous Citizen Submission</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUpdatingStatus(true)}
                className="px-3.5 py-2 rounded-xl bg-[#f8fafc] hover:bg-[#112248] text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
              >
                Update Status / Assign
              </button>

              <button
                onClick={handleCreateFieldVerification}
                disabled={creatingVerification || complaint.verificationStatus === "VERIFIED"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>
                  {creatingVerification
                    ? "Dispatching..."
                    : complaint.verificationStatus === "VERIFIED"
                    ? "Verified on Site"
                    : "Create Field Verification"}
                </span>
              </button>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
              Institutional Status Pipeline
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                const label = COMPLAINT_STATUSES.find((s) => s.value === step)?.label || step;

                return (
                  <div
                    key={step}
                    className={`rounded-xl p-2.5 text-center text-xs border transition-all ${
                      isCurrent
                        ? "bg-cyan-950/80 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                        : isPassed
                        ? "bg-slate-50 border-emerald-500/50 text-emerald-700"
                        : "bg-[#060c1c] border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] block opacity-70">Step {idx + 1}</span>
                    <span className="font-semibold block truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {verificationSuccess && (
          <div className="rounded-xl bg-emerald-950/70 p-4 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span>{verificationSuccess}</span>
            </div>
            <Link
              href="/field-verification"
              className="text-emerald-700 font-bold underline hover:text-white"
            >
              Open Field Verification Worklist →
            </Link>
          </div>
        )}

        {/* Two-Column Grid: Left Grievance Data, Right Community Context & Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Description, Evidence, Status History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Priority Rationale */}
            <div className="rounded-2xl border border-slate-200 bg-[#091530] p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Grievance Description
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-[#060c1c] p-4 rounded-xl border border-slate-200">
                {complaint.description}
              </p>

              {complaint.priorityReason && (
                <div className="rounded-xl bg-amber-950/40 p-3.5 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Explainable Priority Rationale:</span>
                  </span>
                  <p className="text-slate-600 text-[11px]">{complaint.priorityReason}</p>
                </div>
              )}

              {/* Coordinates & Map link */}
              {complaint.latitude && complaint.longitude && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c1c] border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-blue-700">
                      Latitude: {complaint.latitude.toFixed(6)}°N, Longitude:{" "}
                      {complaint.longitude.toFixed(6)}°E
                    </span>
                  </div>
                  <Link
                    href={`/map?highlight=${complaint.communityId || ""}`}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View Marker on GIS Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Photo & Document Evidence */}
            <div className="rounded-2xl border border-slate-200 bg-[#091530] p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Photo & Physical Evidence ({complaint.evidence?.length || 0})</span>
              </h3>

              {complaint.evidence && complaint.evidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.evidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="rounded-xl overflow-hidden border border-slate-200 bg-[#060c1c] group"
                    >
                      <img
                        src={ev.fileUrl}
                        alt="Evidence"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {ev.caption && (
                        <p className="p-3 text-[11px] text-slate-600 border-t border-slate-200">
                          {ev.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No photographic attachments uploaded for this complaint.
                </p>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-[#091530] p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Audit & Status Change History</span>
              </h3>

              <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {complaint.statusHistory?.map((hist: any) => (
                  <div key={hist.id} className="relative text-xs space-y-1">
                    <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-cyan-400 border-2 border-[#091530]" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">
                        {hist.newStatus}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(hist.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Actor: {hist.changedByName || "System Dispatcher"}
                    </span>
                    {hist.notes && (
                      <p className="text-[11px] text-cyan-300/90 bg-[#060c1c] p-2 rounded-lg border border-slate-200 mt-1">
                        {hist.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Community Context & Operational Assignment */}
          <div className="space-y-6">
            {/* Associated Community Vulnerability Dossier */}
            {complaint.community ? (
              <div className="rounded-2xl border border-cyan-500/40 bg-[#091530] p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    Community Context
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    LGD: {complaint.community.code}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {complaint.community.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Block: {complaint.community.block || "Taluk"}, District:{" "}
                    {complaint.community.district}
                  </p>
                </div>

                {/* Score Banner */}
                <div className="rounded-xl bg-[#060c1c] p-3 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Vulnerability Score
                    </span>
                    <span className="text-2xl font-black font-mono text-blue-700">
                      {complaint.community.compositeVulnerabilityScore}/100
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-800">
                    {complaint.community.vulnerabilityCategory}
                  </span>
                </div>

                {/* Indicator metrics */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-[#070f22] border border-slate-200/80">
                    <span className="text-slate-500">JJM Tap Water Access:</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {complaint.community.waterAccessPct}%
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070f22] border border-slate-200/80">
                    <span className="text-slate-500">SBM-G Sanitation:</span>
                    <span className="font-mono text-teal-700 font-bold">
                      {complaint.community.sanitationAccessPct}%
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070f22] border border-slate-200/80">
                    <span className="text-slate-500">Hydrological Flood Hazard:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {complaint.community.floodHazardLevel}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#070f22] border border-slate-200/80">
                    <span className="text-slate-500">Infrastructure Resilience:</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {complaint.community.infrastructureScore}/100
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 italic">
                  Note: Deterministic vulnerability score is based on official 6-factor model; complaints serve as ground truth evidence and do not overwrite baseline scores.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-[#091530] p-5 text-xs text-slate-500 text-center">
                <MapPin className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                <p>No Aqua-Lens community linked to this grievance.</p>
              </div>
            )}

            {/* Officer Assignment & Operational Details */}
            <div className="rounded-2xl border border-slate-200 bg-[#091530] p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Operational Assignment</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Officer:</span>
                  <span className="font-semibold text-slate-700">
                    {complaint.assignedOfficerName || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Field Verification Status:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {complaint.verificationStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Reporter:</span>
                  <span className="text-slate-700">
                    {complaint.isAnonymous
                      ? "Anonymous Citizen"
                      : complaint.reporterName || "Citizen"}
                  </span>
                  {!complaint.isAnonymous && complaint.reporterContact && (
                    <span className="text-[10px] text-slate-500 block">
                      {complaint.reporterContact}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Field Verifications */}
            {complaint.verifications && complaint.verifications.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-[#091530] p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                  <span>Linked Field Verifications</span>
                </h4>

                <div className="space-y-2">
                  {complaint.verifications.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-[#060c1c] border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-700">{v.officerName}</span>
                        <span className="font-mono text-emerald-700">{v.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{v.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Status / Assign Modal */}
        {isUpdatingStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-white p-6 shadow-2xl text-xs text-slate-700 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Update Grievance Status & Officer</span>
                <button
                  onClick={() => setIsUpdatingStatus(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </h3>

              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    Workflow Status:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400"
                  >
                    {COMPLAINT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    Assigned Officer:
                  </label>
                  <input
                    type="text"
                    value={assignedOfficerName}
                    onChange={(e) => setAssignedOfficerName(e.target.value)}
                    placeholder="e.g. M. Subramanian, Assistant Engineer (TWAD)"
                    className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">
                    Action / Resolution Note:
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    placeholder="Provide details on action taken, contractor assigned, or verification conclusion..."
                    className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingStatus(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Updates"}
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
