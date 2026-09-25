"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Droplets,
  ShieldAlert,
  CloudRain,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { VulnerabilityBadge } from "@/components/shared/VulnerabilityBadge";

export default function CommandCenterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const summary = data?.summary || {
    analyzedCommunitiesCount: 12,
    totalPopulation: 588100,
    populationInadequateWater: 341850,
    populationInadequateSanitation: 398600,
    highVulnerabilityCount: 7,
    significantFloodExposureCount: 8,
    incompleteDatasetsCount: 1,
    pendingVerifications: 3,
    activeInterventions: 3,
    activeAlerts: 4,
  };

  const VULN_COLORS: Record<string, string> = {
    VERY_HIGH: "#ef4444",
    HIGH:      "#f97316",
    MODERATE:  "#eab308",
    LOW:       "#3b82f6",
    VERY_LOW:  "#10b981",
    UNKNOWN:   "#94a3b8",
  };

  // Tooltip style for recharts — light theme
  const tooltipStyle = {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#0f172a",
    boxShadow: "0 4px 12px rgba(0,0,0,.1)",
  };

  return (
    <AppShell>
      <div className="space-y-6">

        {/* ── Page title ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>
                COMMAND CENTER INTELLIGENCE
              </h1>
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold"
                style={{ background: "#fff8e1", border: "1px solid #ffcc02", color: "#e65100" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                DATA STATUS: <b className="ml-0.5">DEMO</b>
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              India Water &amp; Sanitation Vulnerability Intelligence System — Tamil Nadu Pilot Districts (JJM &amp; SBM-G Baseline)
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ border: "1.5px solid var(--border-mid)", color: "var(--text-body)", background: "#fff" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} style={{ color: "var(--blue-primary)" }} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* ── 6 KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">

          {/* 1. Villages / GPs */}
          <Link href="/communities" className="card rounded-xl p-3.5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Villages / GPs</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#e3f0ff" }}>
                <Users className="w-3.5 h-3.5" style={{ color: "var(--blue-primary)" }} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono" style={{ color: "var(--text-heading)" }}>
                {summary.analyzedCommunitiesCount}
              </div>
              <span className="text-[10px] font-medium" style={{ color: "var(--blue-primary)" }}>Geocoded settlements</span>
            </div>
          </Link>

          {/* 2. Total Population */}
          <div className="card rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Total Population</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#e8f5e9" }}>
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono" style={{ color: "var(--text-heading)" }}>
                {summary.totalPopulation.toLocaleString()}
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Census 2011 baseline</span>
            </div>
          </div>

          {/* 3. Water Access Risk */}
          <Link href="/communities?maxWaterAccess=50" className="card rounded-xl p-3.5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Water Access Risk</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#e3f0ff" }}>
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-blue-600">
                {summary.populationInadequateWater.toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold text-red-600">
                {Math.round((summary.populationInadequateWater / Math.max(1, summary.totalPopulation)) * 100)}% without piped FHTC
              </span>
            </div>
          </Link>

          {/* 4. Sanitation Risk */}
          <Link href="/communities" className="card rounded-xl p-3.5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Sanitation Risk</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#fff8e1" }}>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-amber-600">
                {summary.populationInadequateSanitation.toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold text-amber-700">
                {Math.round((summary.populationInadequateSanitation / Math.max(1, summary.totalPopulation)) * 100)}% substandard access
              </span>
            </div>
          </Link>

          {/* 5. Flood Exposure */}
          <Link href="/climate-flood" className="card rounded-xl p-3.5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Flood Exposure</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#e0f7fa" }}>
                <CloudRain className="w-3.5 h-3.5 text-cyan-700" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-cyan-700">
                {summary.significantFloodExposureCount}
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>High / Severe flood hazard</span>
            </div>
          </Link>

          {/* 6. High Vulnerability */}
          <Link href="/communities?vulnerability=HIGH" className="card rounded-xl p-3.5 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>High Vulnerability</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#fef2f2" }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black font-mono text-red-600">
                {summary.highVulnerabilityCount}
              </div>
              <span className="text-[10px] font-semibold text-red-600">Score ≥ 60 / 100</span>
            </div>
          </Link>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar chart */}
          <div className="lg:col-span-2 card rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "var(--blue-primary)" }} />
                JJM Tap Water &amp; SBM Sanitation Coverage by District (Tamil Nadu)
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                District comparative average coverage rates (%) &amp; Modelled Vulnerability
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.districtStats || data?.regionalStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="district" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
                  <Bar dataKey="averageWaterAccess"    name="JJM Tap Access (%)"  fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="averageSanitationAccess" name="SBM Sanitation (%)" fill="#60a5fa" radius={[4,4,0,0]} />
                  <Bar dataKey="averageVulnerability"  name="Vulnerability Signal" fill="#f97316" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut chart */}
          <div className="card rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "var(--blue-primary)" }} />
                Vulnerability Category Distribution
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Number of registered settlements by severity band
              </p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.vulnerabilityDistribution || []}
                    dataKey="count"
                    nameKey="category"
                    cx="50%" cy="50%"
                    outerRadius={80} innerRadius={45}
                    paddingAngle={3}
                  >
                    {(data?.vulnerabilityDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={VULN_COLORS[entry.category] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Risk factors + District table ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Risk factor bars */}
          <div className="card rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>
                6-Factor Risk Model Contributions
              </h3>
              <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>
                Normalized impact across Census, JJM, SBM, IMD/CWC, and NFHS-5 dimensions
              </p>
            </div>
            <div className="space-y-3.5">
              {(data?.riskFactorAverages || []).map((rf: any) => (
                <div key={rf.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="truncate pr-2" style={{ color: "var(--text-body)" }}>{rf.name}</span>
                    <span className="font-mono shrink-0" style={{ color: "var(--blue-primary)" }}>
                      {rf.averageScore}/100 ({rf.weight}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${rf.averageScore}%`, backgroundColor: rf.color }}
                    />
                  </div>
                  {rf.source && (
                    <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>Source: {rf.source}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* District table */}
          <div className="lg:col-span-2 card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>
                  Tamil Nadu District Intelligence Registry
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Aggregated statistics across pilot district jurisdictions
                </p>
              </div>
              <Link
                href="/communities"
                className="text-xs font-semibold transition-colors hover:opacity-75"
                style={{ color: "var(--blue-primary)" }}
              >
                View All Villages / GPs →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-light)", color: "var(--text-muted)" }} className="font-mono">
                    <th className="py-2.5 px-3">District (Tamil Nadu)</th>
                    <th className="py-2.5 px-3 text-right">Settlements</th>
                    <th className="py-2.5 px-3 text-right">Census 2011 Pop</th>
                    <th className="py-2.5 px-3 text-right">JJM Tap Cover</th>
                    <th className="py-2.5 px-3 text-right">SBM Sanitation</th>
                    <th className="py-2.5 px-3 text-right">Avg Vulnerability</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.districtStats || data?.regionalStats || []).map((r: any) => (
                    <tr
                      key={r.district || r.region}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="py-3 px-3 font-semibold" style={{ color: "var(--text-heading)" }}>
                        {r.district || r.region}
                      </td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: "var(--text-body)" }}>
                        {r.communitiesCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: "var(--text-body)" }}>
                        {r.population.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold" style={{ color: "var(--blue-primary)" }}>
                        {r.averageWaterAccess}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-500">
                        {r.averageSanitationAccess}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className="font-mono font-bold"
                          style={{
                            color: r.averageVulnerability >= 65
                              ? "#dc2626"
                              : r.averageVulnerability >= 50
                              ? "#d97706"
                              : "#16a34a",
                          }}
                        >
                          {r.averageVulnerability} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
