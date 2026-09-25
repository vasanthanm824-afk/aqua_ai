"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CloudRain,
  AlertTriangle,
  Waves,
  Calendar,
  Building,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Droplets,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function ClimateFloodMonitorPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedHazard, setSelectedHazard] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/communities?limit=100").then((r) => r.json()),
      fetch("/api/alerts?severity=HIGH").then((r) => r.json()),
    ])
      .then(([commData, alertData]) => {
        if (commData.data) setCommunities(commData.data);
        if (alertData.data) setAlerts(alertData.data);
      })
      .catch(console.error);
  }, []);

  const filtered = communities.filter((c) => {
    if (selectedHazard === "ALL") return true;
    return c.floodHazardLevel === selectedHazard;
  });

  const rainfallChartData = communities.map((c) => ({
    name: c.name.split(" ")[0],
    rainfall: c.rainfallAnnualMm,
    floodLevel: c.floodHazardLevel,
  }));

  const severeFloodCount = communities.filter((c) => c.floodHazardLevel === "Severe").length;
  const highFloodCount = communities.filter((c) => c.floodHazardLevel === "High").length;
  const totalPopAtRisk = communities
    .filter((c) => ["Severe", "High"].includes(c.floodHazardLevel))
    .reduce((sum, c) => sum + c.population, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CloudRain className="w-6 h-6 text-sky-700" />
              <span>IMD RAINFALL & CWC HYDROLOGICAL FLOOD MONITOR</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              India Meteorological Department (IMD) annual rainfall normal, Central Water Commission (CWC) flood hazard bands, and modelled exposure
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-ask-aqualens", {
                    detail: null,
                  })
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all"
              title="Ask AI questions about flood hazard and rainfall exposure"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Aqua-Lens</span>
            </button>
            <Link
              href="/map"
              className="flex items-center gap-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 px-3.5 py-1.5 text-xs font-semibold text-sky-700 transition-colors"
            >
              <Waves className="w-4 h-4 text-sky-700" />
              <span>Inspect GIS Flood Hazard Overlays</span>
            </Link>
          </div>
        </div>

        {/* Illustrative Demo Banner */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 border border-amber-500/40 text-[10px] uppercase">
              Modelled / Demo Data
            </span>
            <span>
              Precipitation and inundation metrics are calibrated against IMD normal rainfall (mausam.imd.gov.in) and CWC flood hazard levels (cwc.gov.in). Not a real-time live feed.
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-mono hidden md:inline">State: Tamil Nadu</span>
        </div>

        {/* Hazard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 border border-red-500/30">
            <span className="text-[11px] text-slate-500 block">Severe Inundation Zones</span>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">
              {severeFloodCount} Settlements
            </div>
            <span className="text-[10px] text-red-400/80">CWC Delta & Coastal Surge</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-orange-500/30">
            <span className="text-[11px] text-slate-500 block">High Hazard Settlements</span>
            <div className="text-2xl font-black font-mono text-orange-400 mt-1">
              {highFloodCount} Settlements
            </div>
            <span className="text-[10px] text-orange-400/80">Cyclonic & flash-flood risk</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Census 2011 Exposed Pop</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalPopAtRisk.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">High / Severe hazard zones</span>
          </div>

          <div className="glass-card rounded-xl p-4 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Active Early Warnings</span>
            <div className="text-2xl font-black font-mono text-sky-700 mt-1">
              {alerts.length} Active
            </div>
            <span className="text-[10px] text-sky-400/80">IMD/CWC threshold alerts</span>
          </div>
        </div>

        {/* Annual Rainfall Comparison Chart (Recharts) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Annual Precipitation Normal (IMD Climatology Calibration)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Annual normal rainfall (mm) across Tamil Nadu settlements (IMD products)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainfallChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="rainfall" name="Rainfall (mm/year)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flood Exposure & Hazard Overlap Matrix Table */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Settlement Flood Hazard Registry</h3>
              <p className="text-xs text-slate-500">
                Hydrological risk classification, historical inundations, and asset vulnerability
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 mr-1">Filter:</span>
              {["ALL", "Severe", "High", "Moderate", "Low"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedHazard(lvl)}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                    selectedHazard === lvl
                      ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                      : "bg-white text-slate-500 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                  <th className="py-2.5 px-3">Settlement</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3 text-center">Hazard Level</th>
                  <th className="py-2.5 px-3 text-right">Annual Rainfall</th>
                  <th className="py-2.5 px-3 text-right">Historical Floods</th>
                  <th className="py-2.5 px-3 text-right">Population Exposed</th>
                  <th className="py-2.5 px-3 text-right">Infra Resilience</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100/30">
                    <td className="py-3 px-3 font-semibold text-slate-700">{c.name}</td>
                    <td className="py-3 px-3 text-slate-500">{c.district}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.floodHazardLevel === "Severe"
                            ? "bg-red-950/80 text-red-400 border border-red-800"
                            : c.floodHazardLevel === "High"
                            ? "bg-orange-950/80 text-orange-400 border border-orange-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.floodHazardLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-700">
                      {c.rainfallAnnualMm} mm
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      {c.historicalFloodEvents} events
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {c.population.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {c.infrastructureScore}/100
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/communities/${c.id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
