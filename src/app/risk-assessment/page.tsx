"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  HelpCircle,
} from "lucide-react";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS, ScoringWeights } from "@/lib/scoring";
import { VulnerabilityBadge } from "@/components/shared/VulnerabilityBadge";

export default function RiskAssessmentPage() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS);
  const [activeConfigName, setActiveConfigName] = useState("India 6-Factor Policy v1");
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load active config and communities
    Promise.all([
      fetch("/api/config/scoring").then((r) => r.json()),
      fetch("/api/communities?limit=50").then((r) => r.json()),
    ])
      .then(([configData, commData]) => {
        if (configData.config) {
          setWeights({
            populationWeight: configData.config.populationWeight ?? 0.10,
            waterWeight: configData.config.waterWeight,
            sanitationWeight: configData.config.sanitationWeight,
            socioeconomicWeight: configData.config.socioeconomicWeight,
            climateWeight: configData.config.climateWeight,
            infrastructureWeight: configData.config.infrastructureWeight,
            minCompletenessThreshold: configData.config.minCompletenessThreshold,
          });
          setActiveConfigName(configData.config.name);
        }
        if (commData.data && commData.data.length > 0) {
          setCommunities(commData.data);
          setSelectedCommunityId(commData.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const totalWeight = Number(
    (
      (weights.populationWeight ?? 0.10) +
      weights.waterWeight +
      weights.sanitationWeight +
      weights.socioeconomicWeight +
      weights.climateWeight +
      weights.infrastructureWeight
    ).toFixed(2)
  );

  const isBalanced = Math.abs(totalWeight - 1.0) <= 0.01;

  // Selected community test simulation
  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId);
  const testAssessment = selectedCommunity
    ? calculateVulnerability(
        {
          population: selectedCommunity.population,
          waterAccessPct: selectedCommunity.waterAccessPct,
          sanitationAccessPct: selectedCommunity.sanitationAccessPct,
          povertyRate: selectedCommunity.povertyRate,
          floodHazardLevel: selectedCommunity.floodHazardLevel,
          rainfallAnnualMm: selectedCommunity.rainfallAnnualMm,
          infrastructureScore: selectedCommunity.infrastructureScore,
        },
        weights
      )
    : null;

  const handleSavePolicy = async () => {
    if (!isBalanced) {
      alert("Weights must sum exactly to 100% (1.00)");
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/config/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${activeConfigName} (India Custom)`,
          ...weights,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setActiveConfigName(json.config.name);
        setSaveMessage("Policy configuration version updated successfully!");
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

  const resetDefaults = () => {
    setWeights(DEFAULT_SCORING_WEIGHTS);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              <span>EXPLAINABLE VULNERABILITY ENGINE</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent multi-criteria scoring policy configuration, dynamic weights, and real-time simulator
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const comm = communities.find((c) => c.id === selectedCommunityId);
                window.dispatchEvent(
                  new CustomEvent("open-ask-aqualens", {
                    detail: comm ? { id: comm.id, name: comm.name } : null,
                  })
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all"
              title="Ask AI about vulnerability weights and risk indicators"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Aqua-Lens</span>
            </button>
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-xs text-slate-600 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standards</span>
            </button>
            <button
              onClick={handleSavePolicy}
              disabled={saving || !isBalanced}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Policy Version"}</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="rounded-xl bg-emerald-950/60 p-3.5 border border-emerald-500/40 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Weight Sliders */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configurable Dimension Weights</h3>
                <p className="text-xs text-slate-500">Sum must equal 100% (1.00)</p>
              </div>
              <span
                className={`font-mono font-bold text-xs px-2.5 py-1 rounded border ${
                  isBalanced
                    ? "bg-emerald-950/80 text-emerald-700 border-emerald-800"
                    : "bg-red-950/80 text-red-400 border-red-800"
                }`}
              >
                Sum: {(totalWeight * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Population Vulnerability Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-purple-700">1. Population Vulnerability (Census 2011)</span>
                  <span className="font-mono text-purple-400">
                    {((weights.populationWeight ?? 0.10) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.05"
                  value={weights.populationWeight ?? 0.10}
                  onChange={(e) =>
                    setWeights({ ...weights, populationWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  Census of India 2011 village population density & exposure scale.
                </span>
              </div>

              {/* 2. Water Access Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700">2. Water Access Deficit (JJM Tap Gap)</span>
                  <span className="font-mono text-blue-600">
                    {(weights.waterWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.05"
                  value={weights.waterWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, waterWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  Jal Jeevan Mission / WQMIS deficit (100% minus FHTC piped coverage).
                </span>
              </div>

              {/* 3. Sanitation Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-300">3. Sanitation Access Deficit (SBM-G Gap)</span>
                  <span className="font-mono text-blue-400">
                    {(weights.sanitationWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={weights.sanitationWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, sanitationWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  Swachh Bharat Mission (Grameen) household latrine coverage deficit.
                </span>
              </div>

              {/* 4. Climate & Flood Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-sky-700">4. Climate & Flood Exposure (IMD & CWC)</span>
                  <span className="font-mono text-sky-700">
                    {(weights.climateWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={weights.climateWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, climateWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  CWC hydrological inundation bands combined with IMD rainfall normal.
                </span>
              </div>

              {/* 5. Socioeconomic Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-amber-700">5. Socioeconomic Deprivation (NFHS-5)</span>
                  <span className="font-mono text-amber-400">
                    {(weights.socioeconomicWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.05"
                  value={weights.socioeconomicWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, socioeconomicWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  NFHS-5 Multidimensional Deprivation and BPL household proxy.
                </span>
              </div>

              {/* 6. Infrastructure Weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-red-300">6. Infrastructure Fragility (TWAD Board)</span>
                  <span className="font-mono text-red-400">
                    {(weights.infrastructureWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.05"
                  value={weights.infrastructureWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, infrastructureWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-red-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  TWAD Combined Water Supply Schemes (CWSS) distribution fragility.
                </span>
              </div>

              {/* Completeness Threshold */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Minimum Completeness Threshold</span>
                  <span className="font-mono text-emerald-700">
                    {weights.minCompletenessThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={weights.minCompletenessThreshold}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      minCompletenessThreshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 block">
                  Records below this percentage are classified as "UNKNOWN" to prevent false safety.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Recalculation Test Workbench */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Live Recalculation Workbench</h3>
              <p className="text-xs text-slate-500">
                Observe how weight adjustments dynamically shift vulnerability scores
              </p>
            </div>

            {/* Settlement selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-500">Select Test Community:</label>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full rounded-lg bg-[#f8fafc] px-3 py-2 text-slate-900 border border-slate-200 font-semibold focus:border-cyan-400"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}) — Current DB Score: {c.compositeVulnerabilityScore}
                  </option>
                ))}
              </select>
            </div>

            {testAssessment && selectedCommunity && (
              <div className="space-y-4">
                {/* Score Output Comparison */}
                <div className="rounded-xl bg-[#060c1c] p-4 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Recalculated Score</span>
                    <div className="text-3xl font-black font-mono text-blue-700">
                      {testAssessment.compositeScore} / 100
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Previous: {selectedCommunity.compositeVulnerabilityScore}
                    </span>
                  </div>
                  <VulnerabilityBadge
                    category={testAssessment.category}
                    score={testAssessment.compositeScore}
                    size="lg"
                  />
                </div>

                {/* Factor Contribution Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                        <th className="py-2 px-3">Factor</th>
                        <th className="py-2 px-3 text-right">Norm (0-100)</th>
                        <th className="py-2 px-3 text-right">Weight</th>
                        <th className="py-2 px-3 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {testAssessment.contributions.map((c) => (
                        <tr key={c.factorKey} className="hover:bg-slate-100/30">
                          <td className="py-2 px-3 font-semibold text-slate-700">{c.factorName}</td>
                          <td className="py-2 px-3 text-right font-mono text-blue-700">
                            {c.normalizedScore}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">
                            {(c.weight * 100).toFixed(0)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            +{c.weightedContribution.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical formula explanation */}
                <div className="rounded-xl bg-white p-3 text-[11px] text-slate-500 border border-slate-200 leading-relaxed font-mono">
                  {testAssessment.formulaExplanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
