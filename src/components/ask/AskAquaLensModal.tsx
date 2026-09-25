"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  RefreshCw,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Bot,
  User,
  X,
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

interface AskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommunityId?: string | null;
  initialCommunityName?: string | null;
}

const DEFAULT_SUGGESTIONS = [
  "Which communities have high flood risk and poor sanitation?",
  "Show high-risk communities with water access below 50%",
  "Why is this community classified as high risk?",
  "What factors contribute most to the vulnerability score?",
  "What interventions are recommended for this community?",
  "Compare the highest risk communities in Ramanathapuram",
];

export function AskAquaLensModal({
  isOpen,
  onClose,
  initialCommunityId,
  initialCommunityName,
}: AskModalProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = initialCommunityName
        ? `Hello! I have loaded the live intelligence dossier for **${initialCommunityName}**. You can ask why this settlement is vulnerable, inspect its risk drivers, or check recommended JJM/SBM interventions.`
        : `Welcome to **Ask Aqua-Lens** — your natural language geospatial intelligence assistant. Ask questions across our 12 Tamil Nadu pilot settlements, water connection rates, flood risks, and intervention priorities.`;

      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          dataStatus: [
            { dataset: "Census 2011", status: "Official", source: "Census of India", year: "2011" },
            { dataset: "Water Connections", status: "Official / Demo", source: "JJM WQMIS", year: "2024" },
            { dataset: "Sanitation", status: "Official / Demo", source: "SBM-G OGD", year: "2024" },
            { dataset: "Hydrological Hazard", status: "Official", source: "CWC Flood Atlas", year: "2024" },
          ],
        },
      ]);
    }
  }, [isOpen, initialCommunityName]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

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
      // Build session history for follow-ups
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
          communityId: initialCommunityId,
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
      onClose();
      router.push(`/map?highlight=${ids}`);
    } else {
      onClose();
      router.push("/map");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[90vh] max-h-[850px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 tracking-wide">
                  ASK AQUA-LENS
                </h3>
                <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                  Evidence-First Intelligence
                </span>
                {initialCommunityName && (
                  <span className="font-mono text-[9px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Context: {initialCommunityName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Ask anything about your water, sanitation, and vulnerability data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" style={{ background: "#f8fafc" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-3 leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md font-medium"
                    : "bg-white border border-slate-200 text-slate-700 shadow-sm"
                }`}
              >
                {/* Message Text */}
                <div className="text-xs leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Evidence Card & Action Panel (for assistant responses) */}
                {msg.role === "assistant" && msg.matchedCommunities && msg.matchedCommunities.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>MATCHED SETTLEMENTS ({msg.matchedCommunities.length})</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleViewOnMap(msg.matchedCommunities)}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        <span>[ View {msg.matchedCommunities.length} on Map ]</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.matchedCommunities.slice(0, 4).map((c: any) => (
                        <div
                          key={c.id}
                          className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-700 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {c.district} • Water: {c.waterAccessPct}%
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-blue-600 text-xs">
                              {c.score}/100
                            </span>
                            <Link
                              href={`/communities/${c.id}`}
                              onClick={onClose}
                              className="text-[9px] text-teal-700 hover:underline block"
                            >
                              View Profile →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Metadata & Provenance Status Badges */}
                {msg.role === "assistant" && msg.dataStatus && msg.dataStatus.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Evidence Confidence: {msg.evidenceConfidence || 85}%</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {msg.dataStatus.map((ds, idx) => (
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
                <div className="h-7 w-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-blue-700 bg-[#091530] p-3.5 rounded-xl border border-cyan-500/30 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing Aqua-Lens data & consulting risk engine...</span>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 overflow-x-auto shrink-0 flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
            Suggestions:
          </span>
          {DEFAULT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(s)}
              className="text-[10px] whitespace-nowrap rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-2.5 py-1 text-slate-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
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
              className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:border-blue-400 focus:bg-white placeholder:text-slate-400 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-40 transition-all shrink-0"
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
    </div>
  );
}
