"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sliders,
  Database,
  Key,
  ShieldCheck,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
} from "lucide-react";

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleClearSampleData = async () => {
    if (!confirm("Are you sure you want to remove all initial sample baseline records? Any real datasets you imported will be preserved.")) {
      return;
    }

    setClearing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_SAMPLE_DATA" }),
      });
      if (res.ok) {
        const json = await res.json();
        setStatusMsg(json.message);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to purge sample records");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm("This will reset the database to the verified Tamil Nadu, India Demo Dataset (12 Gram Panchayats, Census 2011, JJM, SBM-G, IMD & CWC registries). Proceed?")) {
      return;
    }

    setResetting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_DEMO_DATA" }),
      });
      if (res.ok) {
        const json = await res.json();
        setStatusMsg(json.message);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reset demo data");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-blue-600" />
              <span>PLATFORM SETTINGS & ENVIRONMENT</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Infrastructure topology, database persistence mode, optional AI configuration, and sample data lifecycle
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className="rounded-xl bg-emerald-950/60 p-4 border border-emerald-500/40 text-xs text-emerald-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Database Persistence Status */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Database & Persistence Engine</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              OPERATIONAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-white p-4 border border-slate-200 space-y-1.5">
              <span className="font-semibold text-slate-700 block">Active Local Database:</span>
              <p className="text-slate-500 font-mono text-[11px]">SQLite (Zero-Friction Local Mode: dev.db)</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Full relational integrity with Prisma ORM. No external Docker or cloud credentials required to operate.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-slate-200 space-y-1.5">
              <span className="font-semibold text-slate-700 block">Cloud Supabase / PostgreSQL Support:</span>
              <p className="text-slate-500 font-mono text-[11px]">Ready for Production Deployment</p>
              <p className="text-[11px] text-slate-500 pt-1">
                To connect Supabase in production, change datasource provider to "postgresql" in schema.prisma and supply DATABASE_URL.
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis Integration Status */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">AI-Assisted Intelligence Engine</h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
              HYBRID FALLBACK ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              AQUA-LENS features an autonomous dual-engine architecture:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
              <li>
                <b>OpenAI LLM Engine:</b> Activated when <code className="text-blue-700">OPENAI_API_KEY</code> is configured in <code className="text-blue-700">.env</code> for conversational summaries.
              </li>
              <li>
                <b>Deterministic Explainability Engine:</b> Always active and autonomous. Generates mathematical breakdowns, factor contributions, and prioritized interventions with 0% hallucination risk even without an external API key.
              </li>
            </ul>
          </div>
        </div>

        {/* Sample Data Lifecycle Management */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">India Demo Data & Dataset Lifecycle</h3>
            </div>
            <span className="text-[10px] font-mono text-blue-600 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              TAMIL NADU PILOT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              The application defaults to 12 pilot Gram Panchayats across Ramanathapuram, Cuddalore, Nagapattinam, Mayiladuthurai, Dharmapuri, and Tiruvannamalai districts in Tamil Nadu, India.
              All demo baseline records are flagged as <code className="text-blue-700">isSampleData: true</code> with clear illustrative notices.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 transition-all disabled:opacity-50"
              >
                {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>One-Click Reset to India Demo Dataset</span>
              </button>

              <button
                onClick={handleClearSampleData}
                disabled={clearing}
                className="flex items-center gap-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 px-4 py-2 text-xs font-bold text-red-200 transition-colors disabled:opacity-50"
              >
                {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Purge Sample Records (Retain Imported Data)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
