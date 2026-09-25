"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { Layers, Filter, Search, MapPin, Eye, ExternalLink, RefreshCw, Sparkles, X } from "lucide-react";
import { VulnerabilityBadge } from "@/components/shared/VulnerabilityBadge";
import Link from "next/link";

const GISMap = dynamic(
  () => import("@/components/map/GISMap").then((mod) => mod.GISMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs font-mono text-blue-700">Loading Interactive India Map...</span>
          <span className="text-[11px] text-slate-500 font-mono">OpenStreetMap Standard Cartography (No API Key Required)</span>
        </div>
      </div>
    ),
  }
);

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const highlightIds = React.useMemo(() => {
    return highlightParam ? highlightParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [highlightParam]);

  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communities?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setCommunities(data.data);
          if (highlightIds.length > 0) {
            // Select first highlighted community
            setSelectedId(highlightIds[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [highlightParam]);

  const filtered = communities.filter((c) => {
    if (highlightIds.length > 0 && !highlightIds.includes(c.id)) {
      return false;
    }
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.block && c.block.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      (c.region && c.region.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  const selectedCommunity = communities.find((c) => c.id === selectedId);

  const openContextualAsk = () => {
    window.dispatchEvent(
      new CustomEvent("open-ask-aqualens", {
        detail: selectedCommunity
          ? { id: selectedCommunity.id, name: selectedCommunity.name }
          : null,
      })
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>INDIA WATER & SANITATION VULNERABILITY GIS MAP</span>
            <span className="text-xs font-mono font-normal bg-cyan-950/80 text-blue-600 border border-cyan-800 px-2 py-0.5 rounded">
              Tamil Nadu Pilot Matrix
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Interactive geospatial overlay across Indian districts, blocks, and villages with JJM tap water, SBM-G sanitation, and IMD/CWC hazard overlays
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openContextualAsk}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all"
            title="Ask AI questions about the map or selected settlement"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask Aqua-Lens</span>
          </button>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Active Settlements: <b className="text-blue-600 font-mono">{communities.length}</b>
          </span>
        </div>
      </div>

      {/* Highlight Active Alert Banner */}
      {highlightIds.length > 0 && (
        <div className="rounded-xl bg-cyan-950/70 border border-cyan-500/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold">
              Filter Active: Showing {filtered.length} settlements matched by Ask Aqua-Lens query.
            </span>
          </div>
          <button
            onClick={() => router.push("/map")}
            className="flex items-center gap-1 rounded bg-cyan-900/80 hover:bg-cyan-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 border border-cyan-700 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear Filter (Show All)</span>
          </button>
        </div>
      )}

      {/* Map Layout: Left Sidebar Directory + GIS Map */}
      <div className="flex-1 flex gap-3 overflow-hidden rounded-2xl border border-slate-200">
          {/* Quick Settlement Selector Sidebar */}
          <div className="hidden lg:flex w-72 flex-col bg-white/90 border-r border-slate-200 p-3 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find village, block, district..."
                className="w-full rounded-lg bg-[#f8fafc] pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 border border-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filtered.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-950/70 border-cyan-500 text-white shadow-lg"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-200 hover:bg-[#0e1c3d]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{c.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          c.compositeVulnerabilityScore >= 60
                            ? "bg-red-950/80 text-red-400 border border-red-800"
                            : "bg-cyan-950/80 text-blue-600 border border-cyan-800"
                        }`}
                      >
                        {c.compositeVulnerabilityScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                      <span>{c.block ? `${c.block}, ` : ""}{c.district}</span>
                      <span className="text-blue-600">JJM: {c.waterAccessPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Leaflet GIS Map Canvas */}
          <div className="flex-1 relative">
            <GISMap
              initialCommunities={communities}
              selectedCommunityId={selectedId}
              onSelectCommunity={(c) => setSelectedId(c ? c.id : null)}
            />
          </div>
        </div>
      </div>
  );
}

export default function GlobalVulnerabilityMapPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading geospatial layers...</div>}>
        <MapContent />
      </Suspense>
    </AppShell>
  );
}
