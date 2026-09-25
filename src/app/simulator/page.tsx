"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calculator,
  DollarSign,
  Users,
  PieChart,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Building,
  Droplets,
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  generateActionRecommendations,
  calculateScenarioEstimate,
  ActionRecommendation,
} from "@/lib/recommendations";

interface UnitCosts {
  solarBorehole: number;
  pipedNetwork: number;
  vipLatrineCluster: number;
  floodDefensePlatform: number;
  pumpRehabilitation: number;
}

const DEFAULT_UNIT_COSTS: UnitCosts = {
  solarBorehole: 1850000,        // Solar RO Plant & Deep Well (₹18.5 L)
  pipedNetwork: 3200000,         // JJM Piped Domestic FHTC Network (₹32.0 L)
  vipLatrineCluster: 450000,     // SBM Community Sanitary Complex (CSC) (₹4.5 L)
  floodDefensePlatform: 1200000, // TNSDMA Raised Flood Platform & Sump (₹12.0 L)
  pumpRehabilitation: 180000,    // OHT Motor & Chlorination Overhaul (₹1.8 L)
};

export default function ResourceAllocationSimulatorPage() {
  const [totalBudget, setTotalBudget] = useState<number>(50000000); // ₹5 Crores
  const [unitCosts, setUnitCosts] = useState<UnitCosts>(DEFAULT_UNIT_COSTS);
  const [communities, setCommunities] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<string, {
    solarBorehole: number;
    pipedNetwork: number;
    vipLatrineCluster: number;
    floodDefensePlatform: number;
    pumpRehabilitation: number;
  }>>({});
  const [scenarioName, setScenarioName] = useState("FY2026-27 Tamil Nadu District WASH Plan (JJM & SBM-G)");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Community-specific What-If Scenario state
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [selectedInterventionCodes, setSelectedInterventionCodes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/communities?limit=25")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setCommunities(data.data);
          // Initialize zero allocations
          const initial: Record<string, any> = {};
          data.data.forEach((c: any) => {
            initial[c.id] = {
              solarBorehole: 0,
              pipedNetwork: 0,
              vipLatrineCluster: 0,
              floodDefensePlatform: 0,
              pumpRehabilitation: 0,
            };
          });
          // Preset initial simulation for top 2 most vulnerable
          if (data.data.length >= 2) {
            initial[data.data[0].id].solarBorehole = 3;
            initial[data.data[0].id].floodDefensePlatform = 2;
            initial[data.data[1].id].solarBorehole = 2;
            initial[data.data[1].id].vipLatrineCluster = 4;
          }
          setAllocations(initial);

          // Check URL query parameters for communityId and intervention
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const qCommId = params.get("communityId");
            const qIntervention = params.get("intervention");
            if (qCommId && data.data.some((c: any) => c.id === qCommId)) {
              setSelectedCommunityId(qCommId);
              if (qIntervention) {
                setSelectedInterventionCodes([qIntervention]);
              }
            } else if (data.data.length > 0) {
              setSelectedCommunityId(data.data[0].id);
            }
          }
        }
      })
      .catch(console.error);
  }, []);

  const updateUnits = (communityId: string, intervention: keyof UnitCosts, delta: number) => {
    setAllocations((prev) => {
      const current = prev[communityId] || {
        solarBorehole: 0,
        pipedNetwork: 0,
        vipLatrineCluster: 0,
        floodDefensePlatform: 0,
        pumpRehabilitation: 0,
      };
      const newVal = Math.max(0, (current[intervention] || 0) + delta);
      return {
        ...prev,
        [communityId]: {
          ...current,
          [intervention]: newVal,
        },
      };
    });
  };

  // Calculate live totals
  let allocatedBudget = 0;
  let estimatedReach = 0;

  communities.forEach((c) => {
    const alloc = allocations[c.id];
    if (alloc) {
      const commCost =
        alloc.solarBorehole * unitCosts.solarBorehole +
        alloc.pipedNetwork * unitCosts.pipedNetwork +
        alloc.vipLatrineCluster * unitCosts.vipLatrineCluster +
        alloc.floodDefensePlatform * unitCosts.floodDefensePlatform +
        alloc.pumpRehabilitation * unitCosts.pumpRehabilitation;

      allocatedBudget += commCost;

      if (commCost > 0) {
        // Estimated reach capped by community population
        const popServed = Math.min(
          c.population,
          alloc.solarBorehole * 6000 +
            alloc.pipedNetwork * 10000 +
            alloc.vipLatrineCluster * 1500 +
            alloc.floodDefensePlatform * 4000 +
            alloc.pumpRehabilitation * 800
        );
        estimatedReach += popServed;
      }
    }
  });

  const remainingBudget = totalBudget - allocatedBudget;
  const budgetUtilization = Math.min(100, Math.round((allocatedBudget / Math.max(1, totalBudget)) * 100));

  const handleSaveScenario = async () => {
    setSaving(true);
    setSaveSuccess(null);
    try {
      const flatAllocations: any[] = [];
      Object.entries(allocations).forEach(([commId, allocs]) => {
        Object.entries(allocs).forEach(([type, count]) => {
          if (count > 0) {
            flatAllocations.push({
              communityId: commId,
              interventionType: type,
              unitCost: unitCosts[type as keyof UnitCosts],
              targetUnits: count,
              allocatedAmount: count * unitCosts[type as keyof UnitCosts],
              estimatedPopulationServed: count * 2500,
            });
          }
        });
      });

      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenarioName,
          totalBudget,
          allocations: flatAllocations,
          assumptions: unitCosts,
        }),
      });

      if (res.ok) {
        setSaveSuccess("Planning scenario saved to database successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Save failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              <span>RESOURCE ALLOCATION SIMULATOR</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate investment scenarios, optimize unit allocations, and evaluate potential population coverage against budget limits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const resetAlloc: Record<string, any> = {};
                communities.forEach((c) => {
                  resetAlloc[c.id] = {
                    solarBorehole: 0,
                    pipedNetwork: 0,
                    vipLatrineCluster: 0,
                    floodDefensePlatform: 0,
                    pumpRehabilitation: 0,
                  };
                });
                setAllocations(resetAlloc);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-xs text-slate-600 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Allocations</span>
            </button>

            <button
              onClick={handleSaveScenario}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Scenario"}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="rounded-xl bg-emerald-950/60 p-3.5 border border-emerald-500/40 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Live Budget Utilization HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Planning Budget</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl font-black font-mono text-blue-600">₹</span>
              <input
                type="number"
                step="5000000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                className="w-36 bg-[#f8fafc] font-mono text-base font-bold text-slate-900 border border-slate-200 rounded px-2 py-0.5"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">₹{(totalBudget / 10000000).toFixed(2)} Crores</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-cyan-500/30">
            <span className="text-[11px] text-slate-500 block">Committed Allocation</span>
            <div className="text-xl font-black font-mono text-blue-700 mt-1">
              ₹{(allocatedBudget / 100000).toFixed(2)} Lakhs
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    remainingBudget < 0 ? "bg-red-500" : "bg-cyan-400"
                  }`}
                  style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-600">
                {budgetUtilization}%
              </span>
            </div>
          </div>

          <div
            className={`glass-card rounded-xl p-4 border ${
              remainingBudget < 0 ? "border-red-500/60 bg-red-950/20" : "border-slate-200"
            }`}
          >
            <span className="text-[11px] text-slate-500 block">Remaining Budget</span>
            <div
              className={`text-xl font-black font-mono mt-1 ${
                remainingBudget < 0 ? "text-red-400" : "text-emerald-700"
              }`}
            >
              ₹{(remainingBudget / 100000).toFixed(2)} Lakhs
            </div>
            <span className="text-[10px] text-slate-500">
              {remainingBudget < 0 ? "Budget ceiling exceeded!" : "Available fiscal capital"}
            </span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-teal-500/30">
            <span className="text-[11px] text-slate-500 block">Projected Population Served</span>
            <div className="text-xl font-black font-mono text-teal-700 mt-1">
              {estimatedReach.toLocaleString()}
            </div>
            <span className="text-[10px] text-teal-700">Census 2011 beneficiary reach</span>
          </div>
        </div>

        {/* Configurable Unit Cost Assumptions */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Unit Cost Benchmarks (Government of India / State Schedule of Rates)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="rounded-xl bg-[#091530] p-2.5 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Solar RO Plant (TWAD)</span>
              <span className="font-mono font-bold text-blue-700">₹{(unitCosts.solarBorehole / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="rounded-xl bg-[#091530] p-2.5 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">JJM Piped FHTC Network</span>
              <span className="font-mono font-bold text-blue-700">₹{(unitCosts.pipedNetwork / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="rounded-xl bg-[#091530] p-2.5 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">SBM Community Toilet (CSC)</span>
              <span className="font-mono font-bold text-blue-700">₹{(unitCosts.vipLatrineCluster / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="rounded-xl bg-[#091530] p-2.5 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Flood Bund & Sump (TNSDMA)</span>
              <span className="font-mono font-bold text-blue-700">₹{(unitCosts.floodDefensePlatform / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="rounded-xl bg-[#091530] p-2.5 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">OHT Motor & Chlorination</span>
              <span className="font-mono font-bold text-blue-700">₹{(unitCosts.pumpRehabilitation / 100000).toFixed(1)} Lakhs</span>
            </div>
          </div>
        </div>

        {/* Feature 1.6: Community What-If / Risk-to-Action Response Simulation */}
        {(() => {
          const activeCommunity = communities.find((c) => c.id === selectedCommunityId) || communities[0];
          if (!activeCommunity) return null;

          const communityRecs = generateActionRecommendations(activeCommunity);
          const activeRecs = communityRecs.filter((r) =>
            selectedInterventionCodes.includes(r.interventionCode)
          );
          const scenarioCalc = calculateScenarioEstimate(
            activeCommunity.compositeVulnerabilityScore,
            activeRecs
          );

          const toggleIntervention = (code: string) => {
            setSelectedInterventionCodes((prev) =>
              prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
            );
          };

          return (
            <div className="glass-panel-elevated rounded-2xl p-6 border border-cyan-500/30 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-blue-600 uppercase font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      WHAT-IF RESPONSE SIMULATOR
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Model intervention packages without mutating real database scores
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span>Scenario: {activeCommunity.name} Intervention Impact Model</span>
                  </h3>
                </div>

                {/* Community Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Select Settlement:</span>
                  <select
                    value={activeCommunity.id}
                    onChange={(e) => {
                      setSelectedCommunityId(e.target.value);
                      setSelectedInterventionCodes([]);
                    }}
                    className="bg-[#f8fafc] text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-xs focus:border-cyan-400"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district}) — Score: {c.compositeVulnerabilityScore}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scenario Calculation Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white p-4 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-semibold">Current Vulnerability</span>
                  <div className="text-3xl font-black font-mono text-slate-900 mt-1">
                    {activeCommunity.compositeVulnerabilityScore}
                    <span className="text-xs text-slate-500 ml-1">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Official 6-Factor Model ({activeCommunity.vulnerabilityCategory})
                  </span>
                </div>

                <div className="rounded-xl bg-cyan-950/40 p-4 border border-cyan-500/40">
                  <span className="text-[11px] text-blue-700 block font-semibold">Scenario Vulnerability</span>
                  <div className="text-3xl font-black font-mono text-blue-700 mt-1">
                    Estimated {scenarioCalc.scenarioScore}
                    <span className="text-xs text-cyan-400/70 ml-1">/ 100</span>
                  </div>
                  <span className="text-[10px] text-blue-600 block mt-1">
                    Modelled post-intervention index
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-950/40 p-4 border border-emerald-500/40">
                  <span className="text-[11px] text-emerald-700 block font-semibold">Estimated Change</span>
                  <div className="text-3xl font-black font-mono text-emerald-700 mt-1 flex items-baseline gap-1">
                    <span>-{scenarioCalc.pointsReduced}</span>
                    <span className="text-sm font-semibold">points</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block mt-1">
                    Scenario risk mitigation index
                  </span>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-semibold">Estimated Scenario Budget</span>
                  <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                    {scenarioCalc.totalEstimatedCostFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Capital works allocation
                  </span>
                </div>
              </div>

              {/* Interventions Checkbox Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Select Interventions to Test in this Scenario:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communityRecs.map((rec) => {
                    const isChecked = selectedInterventionCodes.includes(rec.interventionCode);
                    return (
                      <label
                        key={rec.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-900/20"
                            : "bg-white border-slate-200 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIntervention(rec.interventionCode)}
                          className="mt-1 h-4 w-4 rounded accent-cyan-400 cursor-pointer"
                        />
                        <div className="space-y-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 block">
                              {rec.interventionName}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                              {rec.estimatedCostFormatted}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {rec.reason}
                          </p>
                          <span className="text-[10px] text-blue-700 font-mono block">
                            Estimated reduction: -{rec.scenarioDeltaPoints} points
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Disclaimer Banner */}
              <div className="rounded-xl bg-[#060e20] p-3.5 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-500">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <b className="text-blue-700">Scenario Estimate Disclaimer:</b> All score reductions and budget projections are scenario estimates based on configured intervention assumptions, not guaranteed real-world predictions. The simulator does <b>NOT</b> modify the official community vulnerability score in the database.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Interactive Allocation Matrix Table */}
        <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Village & GP Intervention Allocations</h3>
              <p className="text-xs text-slate-500">
                Adjust unit counts per settlement to model capital expenditure impact against Tamil Nadu district needs
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                  <th className="py-3 px-4">Village / GP & District</th>
                  <th className="py-3 px-2 text-center">Score</th>
                  <th className="py-3 px-2 text-center">Solar RO (₹18.5L)</th>
                  <th className="py-3 px-2 text-center">JJM Piped (₹32L)</th>
                  <th className="py-3 px-2 text-center">CSC Toilet (₹4.5L)</th>
                  <th className="py-3 px-2 text-center">Flood Bund (₹12L)</th>
                  <th className="py-3 px-2 text-center">OHT Overhaul (₹1.8L)</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {communities.map((c) => {
                  const alloc = allocations[c.id] || {
                    solarBorehole: 0,
                    pipedNetwork: 0,
                    vipLatrineCluster: 0,
                    floodDefensePlatform: 0,
                    pumpRehabilitation: 0,
                  };
                  const subtotal =
                    alloc.solarBorehole * unitCosts.solarBorehole +
                    alloc.pipedNetwork * unitCosts.pipedNetwork +
                    alloc.vipLatrineCluster * unitCosts.vipLatrineCluster +
                    alloc.floodDefensePlatform * unitCosts.floodDefensePlatform +
                    alloc.pumpRehabilitation * unitCosts.pumpRehabilitation;

                  return (
                    <tr key={c.id} className="hover:bg-slate-100/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{c.name}</div>
                        <span className="text-[10px] text-slate-500">Pop: {c.population.toLocaleString()}</span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            c.compositeVulnerabilityScore >= 60
                              ? "bg-red-950/80 text-red-400 border border-red-800"
                              : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                          }`}
                        >
                          {c.compositeVulnerabilityScore}
                        </span>
                      </td>

                      {/* Solar Borehole */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1 py-0.5">
                          <button
                            onClick={() => updateUnits(c.id, "solarBorehole", -1)}
                            className="px-1.5 text-slate-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-blue-700 w-5 text-center">
                            {alloc.solarBorehole}
                          </span>
                          <button
                            onClick={() => updateUnits(c.id, "solarBorehole", 1)}
                            className="px-1.5 text-blue-600 hover:text-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Piped Network */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1 py-0.5">
                          <button
                            onClick={() => updateUnits(c.id, "pipedNetwork", -1)}
                            className="px-1.5 text-slate-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-blue-700 w-5 text-center">
                            {alloc.pipedNetwork}
                          </span>
                          <button
                            onClick={() => updateUnits(c.id, "pipedNetwork", 1)}
                            className="px-1.5 text-blue-600 hover:text-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* VIP Latrines */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1 py-0.5">
                          <button
                            onClick={() => updateUnits(c.id, "vipLatrineCluster", -1)}
                            className="px-1.5 text-slate-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-blue-700 w-5 text-center">
                            {alloc.vipLatrineCluster}
                          </span>
                          <button
                            onClick={() => updateUnits(c.id, "vipLatrineCluster", 1)}
                            className="px-1.5 text-blue-600 hover:text-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Flood Defense */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1 py-0.5">
                          <button
                            onClick={() => updateUnits(c.id, "floodDefensePlatform", -1)}
                            className="px-1.5 text-slate-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-blue-700 w-5 text-center">
                            {alloc.floodDefensePlatform}
                          </span>
                          <button
                            onClick={() => updateUnits(c.id, "floodDefensePlatform", 1)}
                            className="px-1.5 text-blue-600 hover:text-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Pump Rehab */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-1 py-0.5">
                          <button
                            onClick={() => updateUnits(c.id, "pumpRehabilitation", -1)}
                            className="px-1.5 text-slate-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-blue-700 w-5 text-center">
                            {alloc.pumpRehabilitation}
                          </span>
                          <button
                            onClick={() => updateUnits(c.id, "pumpRehabilitation", 1)}
                            className="px-1.5 text-blue-600 hover:text-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{(subtotal / 100000).toFixed(2)} L
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
