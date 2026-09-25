import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { calculateVulnerability, DEFAULT_SCORING_WEIGHTS, ScoringWeights } from "@/lib/scoring";

export function ScoreBreakdownCard({
  community,
  weights = DEFAULT_SCORING_WEIGHTS,
}: {
  community: {
    name: string;
    population?: number;
    waterAccessPct: number;
    sanitationAccessPct: number;
    povertyRate: number;
    floodHazardLevel: string;
    rainfallAnnualMm: number;
    infrastructureScore: number;
    compositeVulnerabilityScore: number;
    dataCompletenessPct: number;
  };
  weights?: ScoringWeights;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const assessment = calculateVulnerability(
    {
      population: community.population || 4500,
      waterAccessPct: community.waterAccessPct,
      sanitationAccessPct: community.sanitationAccessPct,
      povertyRate: community.povertyRate,
      floodHazardLevel: community.floodHazardLevel,
      rainfallAnnualMm: community.rainfallAnnualMm,
      infrastructureScore: community.infrastructureScore,
    },
    weights
  );

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#f8fafc]/90 p-4 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
          <div>
            <h4 className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              How was this score calculated?
            </h4>
            <p className="text-xs text-slate-500">
              India 6-Factor Multi-Criteria Weighted Normalization Model
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-600 font-bold bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800">
            Score: {assessment.compositeScore}/100
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4 text-xs animate-in fade-in duration-200">
          {/* Neutral Phrasing Notice */}
          <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/60 text-[11px] text-blue-300 leading-relaxed">
            <span className="font-semibold text-blue-200">Scientific Calibration Notice: </span>
            This index represents a <em>modelled vulnerability signal</em> for prioritising public water and sanitation infrastructure. It does not detect bacterial/chemical water contamination or declare an area hazardous.
          </div>

          {/* Formula summary */}
          <div className="bg-[#f4f7fb] p-3 rounded-lg border border-slate-200">
            <span className="text-blue-600 font-mono font-semibold block mb-1">
              Deterministic Mathematical Formula:
            </span>
            <code className="text-slate-600 font-mono block leading-relaxed">
              Vulnerability Index = ∑ (Normalized Factor Score × Normalized Weight)
            </code>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {assessment.formulaExplanation}
            </p>
          </div>

          {/* Completeness indicator */}
          <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-200">
            <div className="flex items-center gap-2">
              {assessment.isReliable ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-slate-600 font-medium">Data Completeness:</span>
            </div>
            <span
              className={`font-mono font-bold ${
                assessment.isReliable ? "text-emerald-700" : "text-amber-400"
              }`}
            >
              {assessment.completenessPct}% (Threshold: {weights.minCompletenessThreshold}%)
            </span>
          </div>

          {/* Factor contribution table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                  <th className="py-1.5 px-2">Vulnerability Dimension</th>
                  <th className="py-1.5 px-2">Raw Value</th>
                  <th className="py-1.5 px-2">Normalized (0-100)</th>
                  <th className="py-1.5 px-2">Weight</th>
                  <th className="py-1.5 px-2 text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {assessment.contributions.map((c) => (
                  <tr key={c.factorKey} className="hover:bg-slate-100/30">
                    <td className="py-2 px-2 font-medium text-slate-700">
                      <div>{c.factorName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {c.factorKey === "population" && "Census of India 2011 (Baseline)"}
                        {c.factorKey === "water" && "JJM / WQMIS (FHTC Tap Access)"}
                        {c.factorKey === "sanitation" && "Swachh Bharat Mission (Grameen)"}
                        {c.factorKey === "climate" && "IMD Normal & CWC Flood Hazard"}
                        {c.factorKey === "socioeconomic" && "NFHS-5 (2019-21) / NITI Aayog"}
                        {c.factorKey === "infrastructure" && "TWAD Board / Local PWS Assets"}
                      </div>
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-500">
                      {c.rawValue !== null ? `${c.rawValue} ${c.unit}` : "N/A"}
                    </td>
                    <td className="py-2 px-2 font-mono text-blue-700">
                      {c.normalizedScore}/100
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-500">
                      {(c.weight * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-right text-emerald-700">
                      +{c.weightedContribution.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
