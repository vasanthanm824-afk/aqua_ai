"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map as MapIcon,
  Users,
  Database,
  ShieldAlert,
  CloudRain,
  Wrench,
  Calculator,
  ClipboardCheck,
  FileText,
  Bell,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  Bot,
  MessageSquareWarning,
} from "lucide-react";
import { Logo } from "../shared/Logo";
import { AskAquaLensModal } from "@/components/ask/AskAquaLensModal";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Command Center",          href: "/",                 icon: LayoutDashboard },
  { name: "Ask Aqua-Lens",           href: "/ask",              icon: Sparkles,              badge: "AI Intel" },
  { name: "India Vulnerability Map", href: "/map",              icon: MapIcon },
  { name: "Village & GP Intelligence",href: "/communities",     icon: Users },
  { name: "Complaint Center",        href: "/complaints",       icon: MessageSquareWarning,  badge: "Citizen" },
  { name: "Data Integration Center", href: "/import",           icon: Database },
  { name: "Risk Assessment Model",   href: "/risk-assessment",  icon: ShieldAlert },
  { name: "IMD Climate & CWC Flood", href: "/climate-flood",    icon: CloudRain },
  { name: "Field Verification",      href: "/field-verification",icon: ClipboardCheck },
  { name: "Intervention Planner",    href: "/interventions",    icon: Wrench },
  { name: "Resource Simulator",      href: "/simulator",        icon: Calculator },
  { name: "Reports & Exports",       href: "/reports",          icon: FileText },
  { name: "Alerts & Monitoring",     href: "/alerts",           icon: Bell },
  { name: "Administration",          href: "/admin",            icon: Layers },
  { name: "Settings & Policies",     href: "/settings",         icon: Sliders },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed,           setCollapsed]           = useState(false);
  const [searchQuery,         setSearchQuery]         = useState("");
  const [isSearching,         setIsSearching]         = useState(false);
  const [searchResults,       setSearchResults]       = useState<any[]>([]);
  const [searchInterpretation,setSearchInterpretation]= useState<string | null>(null);
  const [activeAlertsCount,   setActiveAlertsCount]   = useState(0);
  const [currentUser,         setCurrentUser]         = useState<{
    id: string; name: string; role: string; email: string;
  } | null>(null);
  const [selectedState,    setSelectedState]    = useState("Tamil Nadu");
  const [selectedDistrict, setSelectedDistrict] = useState("Ramanathapuram");
  const [isAskModalOpen,   setIsAskModalOpen]   = useState(false);
  const [askContext,       setAskContext]        = useState<{ id?: string; name?: string } | null>(null);

  useEffect(() => {
    const handler = (e: any) => { setAskContext(e.detail || null); setIsAskModalOpen(true); };
    window.addEventListener("open-ask-aqualens", handler);
    return () => window.removeEventListener("open-ask-aqualens", handler);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [alertsRes, userRes] = await Promise.all([
          fetch("/api/alerts?status=ACTIVE"),
          fetch("/api/auth/me"),
        ]);
        if (alertsRes.ok) {
          const d = await alertsRes.json();
          setActiveAlertsCount(d.data?.length || 0);
        }
        if (userRes.ok) {
          const d = await userRes.json();
          if (d.authenticated && d.user) setCurrentUser(d.user);
        }
      } catch (err) {
        console.error("Shell data fetch error:", err);
      }
    }
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.communities || []);
        setSearchInterpretation(data.interpretation);
      }
    } catch (err) {
      console.error("Search query error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`relative z-30 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-64"}`}
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-light)", boxShadow: "2px 0 8px rgba(0,0,0,.05)" }}
      >
        {/* Logo row */}
        <div className="flex h-16 items-center justify-between px-3 shrink-0" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <Link href="/" className="overflow-hidden flex items-center gap-2.5 min-w-0">
            {collapsed ? (
              <Logo className="w-8 h-8 shrink-0" textClassName="hidden" />
            ) : (
              <Logo />
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ border: "1px solid var(--border-light)", color: "var(--text-muted)", background: "var(--bg-card-alt)" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon    = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                style={isActive ? {
                  background: "var(--blue-primary)",
                  color: "#ffffff",
                  borderRadius: "8px",
                } : {
                  color: "var(--text-muted)",
                  borderRadius: "8px",
                }}
                className={`group flex items-center gap-3 px-3 py-2.5 text-[11.5px] font-medium transition-all ${
                  isActive
                    ? "shadow-sm"
                    : "hover:bg-[#eff6ff] hover:text-[#1565c0]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-[#1565c0]"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate tracking-wide">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={isActive
                      ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                      : { background: "#e3f0ff", color: "#1565c0", border: "1px solid #bfdbfe" }
                    }
                  >
                    {item.badge}
                  </span>
                )}
                {!collapsed && item.name === "Alerts & Monitoring" && activeAlertsCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {activeAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — user info */}
        <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--border-light)" }}>
          {!collapsed ? (
            <div className="rounded-lg p-2.5" style={{ background: "var(--bg-card-alt)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--blue-primary)" }}
                >
                  {currentUser?.name?.charAt(0) || "A"}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-[11px] font-semibold" style={{ color: "var(--text-heading)" }}>
                    {currentUser?.name || "Aqua-Lens User"}
                  </p>
                  <p className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {currentUser?.email || "intelligence@aqualens.gov.in"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--blue-primary)" }}
                title="Aqua-Lens"
              >
                {currentUser?.name?.charAt(0) || "A"}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main workspace ────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top header bar */}
        <header
          className="flex h-16 shrink-0 items-center justify-between px-5 gap-4"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border-light)", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
        >
          {/* Global NL search */}
          <div className="relative w-full max-w-lg">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4" style={{ color: "var(--text-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask AQUA-LENS... (e.g. 'Ramanathapuram', 'Mandapam', 'water deficit', 'flood')"
                className="w-full rounded-lg py-2 pl-9 pr-20 text-xs focus:outline-none transition-colors"
                style={{
                  border: "1.5px solid var(--border-mid)",
                  background: "var(--bg-card-alt)",
                  color: "var(--text-body)",
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white transition-colors"
                style={{ background: "var(--blue-primary)" }}
              >
                {isSearching ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Sparkles className="h-3 w-3" /><span>Query</span></>}
              </button>
            </form>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div
                className="absolute top-11 left-0 z-50 w-full rounded-xl p-3 shadow-2xl animate-in fade-in duration-150"
                style={{ background: "#fff", border: "1px solid var(--border-mid)" }}
              >
                <div className="flex items-center justify-between pb-2 mb-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--blue-primary)" }}>
                    {searchInterpretation || `Found ${searchResults.length} matching settlements:`}
                  </span>
                  <button
                    onClick={() => { setSearchResults([]); setSearchInterpretation(null); }}
                    className="text-[11px]" style={{ color: "var(--text-muted)" }}
                  >
                    Close ✕
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((c) => (
                    <Link
                      key={c.id}
                      href={`/communities/${c.id}`}
                      onClick={() => setSearchResults([])}
                      className="flex items-center justify-between p-2 rounded-lg text-xs transition-colors"
                      style={{ border: "1px solid transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <span className="font-semibold" style={{ color: "var(--text-heading)" }}>{c.name}</span>
                        <span className="text-[11px] ml-2" style={{ color: "var(--text-muted)" }}>
                          (Block: {c.block || "Taluk"}, District: {c.district}, {c.state || "Tamil Nadu"})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono" style={{ color: "var(--blue-primary)" }}>
                          JJM Tap: {c.waterAccessPct}%
                        </span>
                        <span className="text-[11px] font-mono font-bold" style={{ color: "var(--orange)" }}>
                          Score: {c.compositeVulnerabilityScore}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* State selector */}
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
              style={{ border: "1.5px solid var(--border-mid)", background: "var(--bg-card-alt)" }}
            >
              <span style={{ color: "var(--text-muted)" }} className="text-[11px]">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer text-xs"
                style={{ color: "var(--text-heading)" }}
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="All">All Basins</option>
              </select>
            </div>

            {/* District selector */}
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
              style={{ border: "1.5px solid var(--border-mid)", background: "var(--bg-card-alt)" }}
            >
              <span style={{ color: "var(--text-muted)" }} className="text-[11px]">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer text-xs"
                style={{ color: "var(--blue-primary)" }}
              >
                <option value="All">All Districts</option>
                <option value="Ramanathapuram">Ramanathapuram</option>
                <option value="Cuddalore">Cuddalore</option>
                <option value="Nagapattinam">Nagapattinam</option>
                <option value="Mayiladuthurai">Mayiladuthurai</option>
                <option value="Dharmapuri">Dharmapuri</option>
                <option value="Tiruvannamalai">Tiruvannamalai</option>
              </select>
            </div>

            {/* Data status pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-semibold"
              style={{ background: "#fff8e1", border: "1px solid #ffcc02", color: "#e65100" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              DATA STATUS: <span className="font-black ml-0.5">DEMO</span>
            </div>

            {/* Ask Aqua-Lens button */}
            <button
              onClick={() => { setAskContext(null); setIsAskModalOpen(true); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm hover:opacity-90"
              style={{ background: "var(--blue-primary)" }}
              title="Ask Aqua-Lens AI Assistant"
            >
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask Aqua-Lens</span>
            </button>

            {/* Alerts bell */}
            <Link
              href="/alerts"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-blue-50"
              style={{ border: "1.5px solid var(--border-mid)", color: "var(--text-muted)" }}
              title="System Alerts"
            >
              <Bell className="h-4 w-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5" style={{ background: "var(--bg-page)" }}>
          {children}
        </main>
      </div>

      {/* Global Ask Aqua-Lens modal */}
      <AskAquaLensModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        initialCommunityId={askContext?.id}
        initialCommunityName={askContext?.name}
      />
    </div>
  );
}
