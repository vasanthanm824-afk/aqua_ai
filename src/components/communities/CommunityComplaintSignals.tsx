"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Droplets,
  Flame,
  Waves,
} from "lucide-react";
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from "@/lib/complaints";
import { ComplaintSubmissionModal } from "@/components/complaints/ComplaintSubmissionModal";

interface Props {
  communityId: string;
  communityName: string;
}

export function CommunityComplaintSignals({ communityId, communityName }: Props) {
  const [signals, setSignals] = useState({
    total: 0,
    open: 0,
    water: 0,
    sanitation: 0,
    flooding: 0,
    verified: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const loadSignals = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/complaints`);
      if (res.ok) {
        const json = await res.json();
        if (json.signals) setSignals(json.signals);
        if (json.recentComplaints) setRecentComplaints(json.recentComplaints);
      }
    } catch (err) {
      console.error("Failed to load community complaint signals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) loadSignals();
  }, [communityId]);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquareWarning className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-wide">
              COMMUNITY COMPLAINT SIGNALS
            </h3>
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
              Citizen Feedback Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            On-ground citizen reported issues validating and corroborating modelled vulnerability factors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Issue Here</span>
          </button>

          <Link
            href={`/complaints?communityId=${communityId}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f8fafc] hover:bg-[#112248] text-xs font-bold text-blue-700 border border-slate-200 transition-colors"
          >
            <span>View All Complaints</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Signal KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-[#070f22] border border-slate-200 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total</span>
          <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
            {signals.total}
          </span>
          <span className="text-[10px] text-slate-500">Recorded</span>
        </div>

        <div className="rounded-xl bg-[#070f22] border border-amber-500/30 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Open</span>
          <span className="text-xl font-black font-mono text-amber-700 mt-1 block">
            {signals.open}
          </span>
          <span className="text-[10px] text-amber-500/80">Active issues</span>
        </div>

        <div className="rounded-xl bg-[#070f22] border border-cyan-500/30 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-blue-600 block flex items-center justify-center gap-1">
            <Droplets className="w-3 h-3 text-blue-600" />
            <span>Water</span>
          </span>
          <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
            {signals.water}
          </span>
          <span className="text-[10px] text-cyan-500/80">Supply & Quality</span>
        </div>

        <div className="rounded-xl bg-[#070f22] border border-blue-500/30 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-blue-400 block">Sanitation</span>
          <span className="text-xl font-black font-mono text-blue-300 mt-1 block">
            {signals.sanitation}
          </span>
          <span className="text-[10px] text-blue-500/80">Latrine & Sewer</span>
        </div>

        <div className="rounded-xl bg-[#070f22] border border-red-500/30 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-red-400 block flex items-center justify-center gap-1">
            <Waves className="w-3 h-3 text-red-400" />
            <span>Flooding</span>
          </span>
          <span className="text-xl font-black font-mono text-red-300 mt-1 block">
            {signals.flooding}
          </span>
          <span className="text-[10px] text-red-500/80">Drain & Surge</span>
        </div>

        <div className="rounded-xl bg-[#070f22] border border-emerald-500/30 p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>Verified</span>
          </span>
          <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
            {signals.verified}
          </span>
          <span className="text-[10px] text-emerald-500/80">Inspected on site</span>
        </div>
      </div>

      {/* Recent Grievances List */}
      <div>
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2.5">
          Recent Citizen Reports in {communityName}
        </span>

        {recentComplaints.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No citizen grievances logged for this settlement yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recentComplaints.map((c) => {
              const statusObj = COMPLAINT_STATUSES.find((s) => s.value === c.status);
              const prioObj = COMPLAINT_PRIORITIES.find((p) => p.value === c.priority);

              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-[#070f22] p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-cyan-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="font-mono text-blue-600 font-bold hover:underline"
                      >
                        {c.complaintNumber}
                      </Link>
                      <span className="font-semibold text-slate-700">{c.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                          prioObj?.badgeClass || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.locationName}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        statusObj?.color || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusObj?.label || c.status}
                    </span>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      View Dossier →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ComplaintSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        initialCommunityId={communityId}
        initialCommunityName={communityName}
        onSuccess={() => {
          loadSignals();
        }}
      />
    </div>
  );
}
