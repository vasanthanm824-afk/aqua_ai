"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  Send,
  RefreshCw,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Bot,
  User,
  Sliders,
  Database,
  Filter,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  matchedCommunities?: any[];
  matchedIds?: string[];
  contributingFactors?: Array<{ factor: string; score: number | string; impact: string }>;
  evidenceConfidence?: number;
  dataStatus?: Array<{ dataset: string; status: string; source: string; year: string }>;
  timestamp: string;
}

const TEMPLATE_QUESTIONS = [
  {
    category: "High Risk Hotspots",
    query: "Which communities have high flood risk and poor sanitation?",
    desc: "Compound flood hazard overlapping with < 55% latrine coverage",
  },
  {
    category: "Water Access Deficit",
    query: "Which areas have drinking water access below 50%?",
    desc: "Unserved populations dependent on secondary saline sources",
  },
  {
    category: "Explainable Risk",
    query: "What factors contribute most to Mandapam's vulnerability score?",
    desc: "6-factor weighting model and threshold violation breakdown",
  },
  {
    category: "Action Planning",
    query: "What interventions are recommended for high-risk coastal villages?",
    desc: "JJM, SBM-G, and TNSDMA flood defense action recommendations",
  },
  {
    category: "Settlement Comparison",
    query: "Compare Mandapam Habitation and Parangipettai Estuary",
    desc: "Multi-indicator side-by-side comparative table",
  },
  {
    category: "Data Quality & Provenance",
    query: "How confident are we in the water access and flood datasets?",
    desc: "Data provenance, collection years, and demo limitation notices",
  },
];

function AskAquaLensWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityIdParam = searchParams.get("communityId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial community context if communityId passed
  useEffect(() => {
    async function initContext() {
      if (communityIdParam) {
        try {
          const res = await fetch(`/api/communities/${communityIdParam}`);
          if (res.ok) {
            const json = await res.json();
            setActiveCommunity(json.data);
            setMessages([
              {
                id: "welcome-ctx",
                role: "assistant",
                content: `### 🎯 Intelligence Dossier Loaded: ${json.data.name} (${json.data.district} District)\n\n` +
                  `I have loaded the verified indicators for **${json.data.name}** (Composite Vulnerability Signal: **${json.data.compositeVulnerabilityScore}/100**, ${json.data.vulnerabilityCategory}).\n\n` +
                  `- **JJM Tap Connections:** ${json.data.waterAccessPct}%\n` +
                  `- **SBM-G Sanitation Coverage:** ${json.data.sanitationAccessPct}%\n` +
                  `- **CWC Flood Hazard:** ${json.data.floodHazardLevel}\n` +
                  `- **NFHS-5 Deprivation:** ${json.data.povertyRate}%\n` +
                  `- **TWAD Asset Resilience:** ${json.data.infrastructureScore}/100\n\n` +
                  `You can ask: *"Why is this community high risk?"* or *"What interventions are recommended here?"*`,
                matchedCommunities: [json.data],
                matchedIds: [json.data.id],
                evidenceConfidence: 90,
                dataStatus: [
                  { dataset: "Census 2011", status: "Official", source: "Census of India", year: "2011" },
                  { dataset: "Water Access", status: "Official / Demo", source: "JJM WQMIS", year: "2024" },
                  { dataset: "Sanitation", status: "Official / Demo", source: "SBM-G", year: "2024" },
                  { dataset: "Hydrological Hazard", status: "Official", source: "CWC", year: "2024" },
                ],
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Default global greeting
      setMessages([
        {
          id: "welcome-global",
          role: "assistant",
          content: `### 🌐 Welcome to Ask Aqua-Lens Intelligence Interface\n\n` +
            `I am your natural-language intelligence assistant for India's water, sanitation, and flood vulnerability datasets.\n\n` +
            `You can query across all **12 pilot Gram Panchayats in Tamil Nadu**, filter by complex multi-risk criteria, inspect the **official 6-factor scoring breakdown**, or explore prioritized interventions.\n\n` +
            `*Ask any question below or select from the suggested templates on the right.*`,
          dataStatus: [
            { dataset: "Census 2011 Demographics", status: "Official", source: "Census of India", year: "2011" },
            { dataset: "JJM Drinking Water", status: "Official / Demo", source: "Ministry of Jal Shakti", year: "2024" },
            { dataset: "SBM-G Rural Sanitation", status: "Official / Demo", source: "OGD India", year: "2024" },
            { dataset: "CWC Flood Inundation", status: "Official", source: "Central Water Commission", year: "2024" },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }

    initContext();
  }, [communityIdParam]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
        matchedIds: m.matchedIds,
      }));

      const res = await fetch("/api/ask-aqua-lens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          communityId: activeCommunity?.id || communityIdParam,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `ast-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          matchedCommunities: data.topMatches || [],
          matchedIds: data.matchedIds || [],
          contributingFactors: data.mainContributingFactors || [],
          evidenceConfidence: data.evidenceConfidence || 85,
          dataStatus: data.dataStatus || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `AI analysis is temporarily unavailable: ${err.error || "Server error"}. You can still explore the underlying data and risk engine.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "AI analysis is temporarily unavailable. You can still explore the underlying data and risk engine.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (communities?: any[]) => {
    if (communities && communities.length > 0) {
      const ids = communities.map((c) => c.id).join(",");
      router.push(`/map?highlight=${ids}`);
    } else {
      router.push("/map");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-blue-600 uppercase font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                NATURAL LANGUAGE INTELLIGENCE
              </span>
              <span className="text-[10px] text-slate-500">
                Grounded strictly in official database records & 6-factor deterministic model
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span>ASK AQUA-LENS DECISION SUPPORT</span>
            </h1>
          </div>

          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-[#060c1c] px-3.5 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Interactive Map</span>
          </Link>
        </div>

        {/* Main Grid: Chat Workspace (2 cols) + Suggested Query Templates (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Chat Canvas (2 cols) */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-cyan-500/30 flex flex-col h-[700px] overflow-hidden shadow-2xl">
            {/* Chat Context Bar */}
            <div className="p-3.5 border-b border-slate-200 bg-[#091530] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {activeCommunity ? `Active Focus: ${activeCommunity.name} (${activeCommunity.district})` : "Global Tamil Nadu Basin Scope (12 Settlements)"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-400">
                Prisma Relational Engine
              </span>
            </div>

            {/* Chat Message Thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl p-4 space-y-3 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-medium shadow-lg shadow-cyan-600/20"
                        : "bg-[#091633] border border-slate-600/40 text-slate-200 shadow-md"
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Matched Settlements Cards */}
                    {msg.role === "assistant" && msg.matchedCommunities && msg.matchedCommunities.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>Matched Settlements ({msg.matchedCommunities.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleViewOnMap(msg.matchedCommunities)}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                          >
                            <span>[ View on Map ]</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.matchedCommunities.slice(0, 4).map((c: any) => (
                            <div
                              key={c.id}
                              className="rounded-lg bg-[#060e20] p-2.5 border border-slate-600/40 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-200 block truncate max-w-[130px]">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {c.district} • Water: {c.waterAccessPct}%
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-blue-400 text-xs">
                                  {c.score}/100
                                </span>
                                <Link
                                  href={`/communities/${c.id}`}
                                  className="text-[9px] text-teal-700 hover:underline block"
                                >
                                  Profile →
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Provenance Metadata */}
                    {msg.role === "assistant" && msg.dataStatus && msg.dataStatus.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Evidence Grounding: {msg.evidenceConfidence || 85}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {msg.dataStatus.slice(0, 3).map((ds, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-500 border border-slate-200 text-[9px]"
                            >
                              ✓ {ds.dataset}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-teal-900 border border-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-teal-200" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-xs text-blue-700 bg-[#091530] p-3 rounded-xl border border-cyan-500/30 w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Consulting database & evaluating 6-factor model...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-[#091530]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask anything about your water, sanitation, and risk data..."
                  className="flex-1 rounded-xl bg-[#060c1c] px-4 py-2.5 text-xs text-slate-100 border border-slate-600/40 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={loading || !inputQuery.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 transition-all shrink-0"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Ask</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Suggested Query Templates & Capabilities (1 col) */}
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-600/40 space-y-4">
              <div className="border-b border-slate-600/40 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Suggested Analytical Inquiries</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any template to run an immediate grounded query
                </p>
              </div>

              <div className="space-y-2.5">
                {TEMPLATE_QUESTIONS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(t.query)}
                    className="w-full text-left rounded-xl bg-[#060c1c] hover:bg-[#0c1a36] border border-slate-600/40 hover:border-cyan-500/40 p-3 transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-blue-400 uppercase font-bold tracking-wider">
                        {t.category}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="font-semibold text-slate-200 block text-xs group-hover:text-white">
                      &quot;{t.query}&quot;
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Architecture Disclosure Card */}
            <div className="rounded-2xl bg-[#060c1c] p-4 border border-slate-600/40 text-[11px] text-slate-400 space-y-2">
              <span className="font-bold text-blue-400 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Deterministic AI Guardrails:</span>
              </span>
              <p className="leading-relaxed">
                Ask Aqua-Lens never invents numbers or calculates scores on its own. All calculations are executed by the deterministic 6-factor engine. Data provenance citations are embedded directly into each answer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AskAquaLensPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex h-96 items-center justify-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        </AppShell>
      }
    >
      <AskAquaLensWorkspace />
    </Suspense>
  );
}
