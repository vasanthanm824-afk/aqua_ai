"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ChevronLeft,
  MapPin,
  Users,
  Droplets,
  ShieldAlert,
  CloudRain,
  Building,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Wrench,
  Calendar,
  ExternalLink,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import { VulnerabilityBadge } from "@/components/shared/VulnerabilityBadge";
import { ScoreBreakdownCard } from "@/components/shared/ScoreBreakdownCard";
import { RiskToActionSection } from "@/components/communities/RiskToActionSection";
import { CommunityComplaintSignals } from "@/components/communities/CommunityComplaintSignals";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [community, setCommunity] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<any>(null);

  const fetchCommunity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${id}`);
      if (res.ok) {
        const json = await res.json();
        setCommunity(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSynthesis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiReport(json.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCommunity();
      fetchAiSynthesis();
    }
  }, [id]);

  if (loading || !community) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm font-mono text-slate-500">Loading Community Intelligence Profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const unservedWaterPop = Math.round(community.population * (1 - community.waterAccessPct / 100));
  const unservedSanPop = Math.round(community.population * (1 - community.sanitationAccessPct / 100));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/communities"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Community Intelligence Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/ask?communityId=${community.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-teal-600/30 border border-cyan-500/50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:from-cyan-600/50 hover:to-teal-600/50 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Aqua-Lens about {community.name}</span>
            </Link>

            <Link
              href={`/map`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:text-white"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Locate on GIS Map</span>
            </Link>
          </div>
        </div>

        {/* Section A: Header & Basic Geography */}
        <div className="glass-panel-elevated rounded-2xl p-6 border border-cyan-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-wide">
                  {community.name}
                </h1>
                <span className="font-mono text-xs text-blue-600 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
                  LGD Code: {community.code}
                </span>
                {community.isSampleData && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                    Illustrative Demo Baseline
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <span>Block: {community.block || "Taluk"}</span>
                <span>•</span>
                <span>District: {community.district}</span>
                <span>•</span>
                <span>State: {community.state || "Tamil Nadu"}</span>
                <span>•</span>
                <span>Country: India</span>
                <span>•</span>
                <span className="font-mono text-blue-600">
                  [{community.latitude.toFixed(4)}°N, {community.longitude.toFixed(4)}°E]
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Modelled Vulnerability Signal
                </span>
                <div className="text-3xl font-black font-mono text-blue-700 drop-shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                  {community.compositeVulnerabilityScore}/100
                </div>
              </div>
              <VulnerabilityBadge
                category={community.vulnerabilityCategory}
                score={community.compositeVulnerabilityScore}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Grid: 4 Core Pillar Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Section B: Water Access (JJM) */}
          <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>JJM Tap Water (FHTC)</span>
              </span>
              <span className="text-lg font-black font-mono text-blue-600">
                {community.waterAccessPct}%
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Unserved Population:</span>
                <span className="font-mono font-bold text-red-400">{unservedWaterPop.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Water Source:</span>
                <span className="truncate max-w-[130px]">{community.waterSourceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Database:</span>
                <span className="text-[10px] text-blue-600">JJM / WQMIS (2024)</span>
              </div>
            </div>
          </div>

          {/* Section C: Sanitation (SBM-G) */}
          <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                <span>SBM-G Sanitation (IHHL)</span>
              </span>
              <span className="text-lg font-black font-mono text-blue-400">
                {community.sanitationAccessPct}%
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Unserved Population:</span>
                <span className="font-mono font-bold text-amber-400">{unservedSanPop.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ODF Status:</span>
                <span className="truncate max-w-[130px]">{community.sanitationServiceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Database:</span>
                <span className="text-[10px] text-blue-400">SBM-Grameen Catalog</span>
              </div>
            </div>
          </div>

          {/* Section D: Socioeconomic Vulnerability (NFHS-5) */}
          <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>NFHS-5 Deprivation</span>
              </span>
              <span className="text-lg font-black font-mono text-amber-400">
                {community.povertyRate}%
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Population:</span>
                <span className="font-mono">{community.population.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Baseline Census:</span>
                <span className="font-mono">Census of India 2011</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="text-emerald-700 font-semibold">NFHS-5 (2019-21) / NITI</span>
              </div>
            </div>
          </div>

          {/* Section E: Climate & Flood Hazard (IMD & CWC) */}
          <div className="glass-card rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-700" />
                <span>IMD & CWC Hazard</span>
              </span>
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded ${
                  community.floodHazardLevel === "Severe" || community.floodHazardLevel === "Catastrophic"
                    ? "bg-red-950/80 text-red-400 border border-red-800"
                    : "bg-amber-950/80 text-amber-400 border border-amber-800"
                }`}
              >
                {community.floodHazardLevel}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Normal Rainfall:</span>
                <span className="font-mono">{community.rainfallAnnualMm} mm (IMD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Historical Inundations:</span>
                <span className="font-mono font-bold text-red-400">
                  {community.historicalFloodEvents} recorded
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agency:</span>
                <span className="text-amber-400">CWC Flood Forecasting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section G: Explainable Vulnerability Engine Breakdown Card */}
        <ScoreBreakdownCard community={community} />

        {/* Feature 1: Risk → Action Recommendation Engine */}
        <RiskToActionSection community={community} />

        {/* Feature: Community Complaint Signals */}
        <CommunityComplaintSignals
          communityId={community.id}
          communityName={community.name}
        />

        {/* Section: AI-Assisted Intelligence Analysis Report */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-wide">
                AI INTELLIGENCE SYNTHESIS & EVIDENCE CITATIONS
              </h3>
            </div>
            <span className="text-[11px] font-mono text-blue-600 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              Evidence-Grounded Engine
            </span>
          </div>

          {loadingAi ? (
            <div className="flex items-center gap-3 py-6 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Synthesizing multi-indicator evidence for {community.name}...</span>
            </div>
          ) : aiReport ? (
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p className="bg-[#070e20] p-4 rounded-xl border border-slate-200 text-slate-700">
                {aiReport.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-blue-700 flex items-center gap-1.5">
                    <span>Key Vulnerability Drivers:</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-500">
                    {aiReport.keyVulnerabilities?.map((v: string, i: number) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-teal-700 flex items-center gap-1.5">
                    <span>Contributing Factors & Limitations:</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-500">
                    {aiReport.contributingFactors?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Source citations */}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  Verified Data Source Citations:
                </span>
                <div className="flex flex-wrap gap-2">
                  {aiReport.sourceCitations?.map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] rounded bg-slate-50 px-2 py-0.5 text-slate-500 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Analysis unavailable.</p>
          )}
        </div>

        {/* Section F: Infrastructure Condition & Assets */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Infrastructure Condition & Assets ({community.infrastructureAssets?.length || 0})</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Resilience Score: {community.infrastructureScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {community.infrastructureAssets?.map((asset: any) => (
              <div
                key={asset.id}
                className="rounded-xl bg-white p-3 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-700 block">{asset.name}</span>
                  <span className="text-[10px] text-slate-500">
                    Type: {asset.assetType} • Condition: {asset.condition}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    asset.status === "FUNCTIONAL"
                      ? "bg-emerald-950/80 text-emerald-700 border border-emerald-800"
                      : "bg-red-950/80 text-red-400 border border-red-800"
                  }`}
                >
                  {asset.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section H: Action Plan & Active Interventions */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Intervention Action Plan & Operational Records</span>
              </h3>
              <p className="text-xs text-slate-500">
                Prioritized interventions assigned to field partners and contractors
              </p>
            </div>
            <Link
              href="/interventions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open Kanban Board →
            </Link>
          </div>

          {community.interventions?.length > 0 ? (
            <div className="space-y-2.5">
              {community.interventions.map((int: any) => (
                <div
                  key={int.id}
                  className="rounded-xl bg-white p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{int.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          int.priority === "CRITICAL"
                            ? "bg-red-950/80 text-red-400 border border-red-800"
                            : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                        }`}
                      >
                        {int.priority}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{int.recommendedAction}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                      <span>Agency: {int.assignedOrg || "TWAD Board / JJM Directorate"}</span>
                      <span>•</span>
                      <span>Budget: ₹{(int.estimatedBudget / 100000).toFixed(2)} Lakhs</span>
                    </div>
                  </div>

                  <span className="self-start sm:self-center font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                    {int.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active interventions created yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
