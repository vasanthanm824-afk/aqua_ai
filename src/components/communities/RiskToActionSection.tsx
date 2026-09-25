"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Calculator,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ActionRecommendation, RiskDriver } from "@/lib/recommendations";

interface RiskToActionProps {
  community: {
    id: string;
    name: string;
    district: string;
    state?: string;
    compositeVulnerabilityScore: number;
    vulnerabilityCategory: string;
    population: number;
    waterAccessPct: number;
    sanitationAccessPct: number;
    floodHazardLevel: string;
    infrastructureScore: number;
    povertyRate: number;
  };
}

export function RiskToActionSection({ community }: RiskToActionProps) {
  const router = useRouter();
  const [riskDrivers, setRiskDrivers] = useState<RiskDriver[]>([]);
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<ActionRecommendation | null>(null);
  const [creatingActionId, setCreatingActionId] = useState<string | null>(null);
  const [createdActionIds, setCreatedActionIds] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch(`/api/communities/${community.id}/recommendations`);
        if (res.ok) {
          const json = await res.json();
          setRiskDrivers(json.riskDrivers || []);
          setRecommendations(json.recommendations || []);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    if (community?.id) {
      fetchRecommendations();
    }
  }, [community.id]);

  const handleCreateAction = async (rec: ActionRecommendation) => {
    setCreatingActionId(rec.id);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/communities/${community.id}/recommendations/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rec.interventionName,
          reason: rec.reason,
          priority: rec.priority,
          estimatedCost: rec.estimatedCost,
          suggestedAuthority: rec.suggestedAuthority,
          category: rec.category,
        }),
      });

      if (res.ok) {
        setCreatedActionIds((prev) => [...prev, rec.id]);
        setActionSuccessMsg(`Action created in Intervention Planner: "${rec.interventionName}"`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create intervention action");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingActionId(null);
    }
  };

  const handleAddToScenario = (rec: ActionRecommendation) => {
    // Navigate to simulator with pre-selected community & intervention
    router.push(`/simulator?communityId=${community.id}&intervention=${rec.interventionCode}`);
  };

  const scoreColor =
    community.compositeVulnerabilityScore >= 70
      ? "text-red-400 border-red-500/40 bg-red-950/40"
      : community.compositeVulnerabilityScore >= 50
      ? "text-orange-400 border-orange-500/40 bg-orange-950/40"
      : "text-blue-600 border-cyan-500/40 bg-cyan-950/40";

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-blue-600 uppercase font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              OPERATIONAL WORKFLOW ENGINE
            </span>
            <span className="text-[10px] text-slate-500">
              Data → Score → Drivers → Interventions → Scenario
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1.5">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Risk → Action Recommendation Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based translation of detected vulnerability drivers into budgeted, evidence-grounded public works
          </p>
        </div>

        <Link
          href={`/ask?communityId=${community.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-[#0c1b38] hover:bg-[#11244d] border border-cyan-500/40 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Ask Aqua-Lens about this</span>
        </Link>
      </div>

      {actionSuccessMsg && (
        <div className="rounded-xl bg-emerald-950/60 p-3.5 border border-emerald-500/40 text-xs text-emerald-700 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <Link
            href="/interventions"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline shrink-0"
          >
            View in Kanban Planner →
          </Link>
        </div>
      )}

      {/* Top Banner: Current Risk & Top Risk Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CURRENT RISK Box */}
        <div className={`rounded-xl p-4 border flex flex-col justify-between ${scoreColor}`}>
          <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
            CURRENT RISK SIGNAL
          </span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono">
              {community.compositeVulnerabilityScore}
            </span>
            <span className="text-sm font-mono opacity-70">/ 100</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="uppercase tracking-wider">
              {community.vulnerabilityCategory}
            </span>
            <span className="text-[10px] opacity-75 font-mono">6-Factor Model</span>
          </div>
        </div>

        {/* TOP RISK DRIVERS Box (Span 2) */}
        <div className="md:col-span-2 rounded-xl bg-white p-4 border border-slate-200 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>DETECTED RISK DRIVERS ({riskDrivers.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Threshold Evaluation Layer
            </span>
          </div>

          {loading ? (
            <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Evaluating threshold violations...</span>
            </div>
          ) : riskDrivers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {riskDrivers.slice(0, 4).map((driver, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-white p-2.5 border border-slate-200/80 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-slate-700 block truncate">
                      • {driver.indicatorLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      Current: <b className="text-blue-700">{driver.value} {driver.unit}</b>
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      driver.severity === "critical"
                        ? "bg-red-950/80 text-red-400 border border-red-800"
                        : driver.severity === "high"
                        ? "bg-orange-950/80 text-orange-400 border border-orange-800"
                        : "bg-amber-950/80 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {driver.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-2">
              No critical threshold violations detected for this settlement.
            </p>
          )}
        </div>
      </div>

      {/* POSSIBLE INTERVENTIONS List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
            <span>POSSIBLE INTERVENTIONS</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {recommendations.length} Actionable Options
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Click &quot;Add to Scenario&quot; to test combined impacts without changing official scores
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Generating explainable recommendations...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isCreated = createdActionIds.includes(rec.id);
              const isCreating = creatingActionId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="rounded-xl bg-[#08142b] border border-slate-200 p-4 space-y-3 flex flex-col justify-between hover:border-cyan-500/40 transition-colors shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              rec.priority === "CRITICAL"
                                ? "bg-red-950/80 text-red-400 border border-red-800"
                                : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                            }`}
                          >
                            [ {rec.priority} Priority ]
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Target: {rec.affectedIndicator}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {rec.interventionName}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 shrink-0 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                        {rec.estimatedCostFormatted}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      <b className="text-slate-600">Reason:</b> {rec.reason}
                    </p>

                    <div className="rounded-lg bg-[#060e20] p-2.5 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                        <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>Estimated Impact:</span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed italic">
                        {rec.estimatedImpact}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Buttons */}
                  <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRec(rec)}
                      className="text-xs font-semibold text-slate-600 hover:text-white flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Details</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToScenario(rec)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0f2142] hover:bg-[#162f5f] border border-cyan-500/40 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors"
                      >
                        <Calculator className="w-3.5 h-3.5 text-blue-600" />
                        <span>Add to Scenario</span>
                      </button>

                      <button
                        type="button"
                        disabled={isCreated || isCreating}
                        onClick={() => handleCreateAction(rec)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-md ${
                          isCreated
                            ? "bg-emerald-950 text-emerald-700 border border-emerald-700"
                            : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/20"
                        }`}
                      >
                        {isCreating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isCreated ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5" />
                        )}
                        <span>{isCreated ? "Action Created" : "Create Action"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No specific interventions currently triggered under active threshold rules.
          </p>
        )}
      </div>

      {/* Modal: View Details */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-[#091530] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                  INTERVENTION RULE SPECIFICATION
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRec.interventionName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="text-slate-500 hover:text-white text-base font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-600">
              <div className="rounded-xl bg-[#060c1c] p-3.5 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-700 block">Rule Trigger Rationale:</span>
                <p className="text-slate-600 leading-relaxed">{selectedRec.reason}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-slate-500 block">Target Indicator:</span>
                    <span className="font-semibold text-slate-900">{selectedRec.affectedIndicator}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Policy Threshold:</span>
                    <span className="font-mono text-amber-400 font-semibold">{String(selectedRec.threshold)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Estimated Capital Outlay:</span>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    {selectedRec.estimatedCostFormatted}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">State & Central Scheme Benchmark</span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Estimated Beneficiaries:</span>
                  <span className="text-base font-mono font-bold text-blue-700">
                    ~{(selectedRec.targetHouseholds * 4.5).toLocaleString()} persons
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{selectedRec.targetHouseholds} households</span>
                </div>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-1.5">
                <span className="font-bold text-amber-700 block flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configured Assumptions & Methodology:</span>
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {selectedRec.assumptions}
                </p>
                <div className="pt-2 text-[10px] text-slate-500">
                  <b>Confidence Level:</b> {selectedRec.confidence} • <b>Executing Body:</b> {selectedRec.suggestedAuthority}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 italic">
                Scenario estimate — does not mutate official database records
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRec(null)}
                  className="px-3 py-1.5 rounded text-slate-500 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToScenario(selectedRec);
                    setSelectedRec(null);
                  }}
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 font-bold text-white hover:from-cyan-500 hover:to-teal-500"
                >
                  Add to Scenario Simulator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
