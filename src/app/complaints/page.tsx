"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  UserCheck,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Info,
} from "lucide-react";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  ComplaintHotspot,
} from "@/lib/complaints";
import { CitizenGrievanceFlow } from "@/components/complaints/CitizenGrievanceFlow";

function ComplaintCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    highPriority: 0,
    verified: 0,
  });
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<ComplaintHotspot[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedCommunityId, setSelectedCommunityId] = useState(
    searchParams.get("communityId") || "ALL"
  );
  const [activeTab, setActiveTab] = useState<"table" | "map" | "analytics" | "hotspots">("table");

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [quickUpdateComplaint, setQuickUpdateComplaint] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState("IN_PROGRESS");
  const [statusNote, setStatusNote] = useState("");

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority);
      if (selectedCommunityId !== "ALL") params.append("communityId", selectedCommunityId);

      const [res, commRes] = await Promise.all([
        fetch(`/api/complaints?${params.toString()}`),
        fetch("/api/communities?limit=100"),
      ]);

      if (res.ok) {
        const json = await res.json();
        setComplaints(json.data || []);
        if (json.kpis) setKpis(json.kpis);
        if (json.categoryDistribution) setCategoryDistribution(json.categoryDistribution);
        if (json.statusDistribution) setStatusDistribution(json.statusDistribution);
        if (json.hotspots) setHotspots(json.hotspots);
      }

      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunities(commData.data || []);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [selectedCategory, selectedStatus, selectedPriority, selectedCommunityId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleQuickStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUpdateComplaint) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${quickUpdateComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedNewStatus,
          note: statusNote || undefined,
        }),
      });
      if (res.ok) {
        setQuickUpdateComplaint(null);
        setStatusNote("");
        loadComplaints();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MessageSquareWarning className="w-6 h-6 text-blue-400" />
              <span>COMPLAINT & CITIZEN GRIEVANCE CENTER</span>
            </h1>
            <span className="font-mono text-xs bg-cyan-950/80 text-blue-400 border border-cyan-800 px-2 py-0.5 rounded">
              Civic Intelligence Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track, verify, and resolve on-ground citizen water, sanitation, and flood grievances linked to Aqua-Lens communities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/complaints/track"
            className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-[#091530] hover:bg-[#0d1e40] px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm transition-all"
            title="Track grievance resolution progress by unique tracking ID"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Track Grievance</span>
          </Link>

          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("open-ask-aqualens", {
                  detail: { id: null, name: "Complaint Center Analytics" },
                })
              );
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/80 hover:to-teal-900/80 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all"
            title="Ask AI questions about citizen complaints and hot spots"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ REGISTER GRIEVANCE</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-[#091530] border border-slate-600/40 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Complaints
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {kpis.total}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Logged in system</span>
        </div>

        <div className="rounded-2xl bg-[#091530] border border-amber-500/30 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
            Active / Open
          </span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {kpis.open}
          </div>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Needs action</span>
        </div>

        <div className="rounded-2xl bg-[#091530] border border-blue-500/30 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
            Under Review
          </span>
          <div className="text-2xl font-black font-mono text-blue-300 mt-1">
            {kpis.underReview}
          </div>
          <span className="text-[10px] text-blue-400/80 block mt-0.5">Triage assessment</span>
        </div>

        <div className="rounded-2xl bg-[#091530] border border-cyan-500/30 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
            In Progress
          </span>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
            {kpis.inProgress}
          </div>
          <span className="text-[10px] text-cyan-400/80 block mt-0.5">Work order assigned</span>
        </div>

        <div className="rounded-2xl bg-[#091530] border border-emerald-500/30 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
            Resolved / Closed
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {kpis.resolved + kpis.closed}
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Verified on site</span>
        </div>

        <div className="rounded-2xl bg-[#091530] border border-red-500/30 p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
            Critical / High Priority
          </span>
          <div className="text-2xl font-black font-mono text-red-400 mt-1">
            {kpis.highPriority}
          </div>
          <span className="text-[10px] text-red-400/80 block mt-0.5">Epidemic / safety risk</span>
        </div>
      </div>

      {/* Hotspot / Concentration Banner (if any detected) */}
      {hotspots.length > 0 && (
        <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center">
                <Flame className="w-4 h-4 animate-pulse text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                  Potential Complaint Concentrations Detected ({hotspots.length} Clusters)
                </h3>
                <p className="text-[11px] text-amber-300/80">
                  Multiple unresolved citizen grievances clustered within proximate geographic radii
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("hotspots")}
              className="text-[11px] font-bold text-amber-700 hover:text-white underline"
            >
              Inspect Clusters →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {hotspots.slice(0, 3).map((h) => (
              <div
                key={h.id}
                className="rounded-xl bg-white/80 border border-amber-500/30 p-3 text-xs flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{h.communityName}</span>
                  <span className="text-[10px] text-slate-500">
                    Primary: {h.primaryCategory.replace("_", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 text-[11px]">
                    {h.complaintCount} Grievances
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 italic">
            <Info className="w-3 h-3 text-slate-500 shrink-0" />
            <span>
              Disclaimer: Indicates spatial concentration of reported complaints only; not clinical proof of disease or water contamination.
            </span>
          </div>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="rounded-2xl border border-slate-600/40 bg-[#091530] p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab Selector */}
          <div className="flex items-center rounded-xl bg-[#060c1c] p-1 border border-slate-600/40 text-xs">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "table"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Complaints Directory
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "map"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GIS Spatial View
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "analytics"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Category Analytics
            </button>
            <button
              onClick={() => setActiveTab("hotspots")}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeTab === "hotspots"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Concentration Hotspots
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, locality..."
              className="w-full rounded-xl bg-[#060c1c] pl-8 pr-16 py-1.5 text-xs text-slate-100 placeholder-slate-500 border border-slate-600/40 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 text-[10px] font-semibold px-2 py-1 rounded border border-cyan-700 transition-colors"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg bg-[#060c1c] border border-slate-600/40 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg bg-[#060c1c] border border-slate-600/40 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Priority:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-lg bg-[#060c1c] border border-slate-600/40 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Priorities</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Settlement:</label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full rounded-lg bg-[#060c1c] border border-slate-600/40 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Settlements</option>
              {communities.map((comm) => (
                <option key={comm.id} value={comm.id}>
                  {comm.name} ({comm.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === "table" && (
        <div className="rounded-2xl border border-slate-600/40 bg-[#091530] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-600/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Showing {complaints.length} Grievances
            </span>
            <button
              onClick={loadComplaints}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Loading citizen grievances database...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <MessageSquareWarning className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-600">No complaints match current filters.</p>
              <p className="text-[11px] text-slate-500">
                Try resetting category or settlement filters, or register a new grievance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-600/40 bg-[#070f22] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-3">ID & Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Community / Location</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Verification</th>
                    <th className="p-3">Reported</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30">
                  {complaints.map((c) => {
                    const statusObj = COMPLAINT_STATUSES.find((s) => s.value === c.status);
                    const prioObj = COMPLAINT_PRIORITIES.find((p) => p.value === c.priority);

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-100/40 transition-colors group"
                      >
                        <td className="p-3 font-medium">
                          <Link
                            href={`/complaints/${c.id}`}
                            className="font-mono text-blue-400 hover:underline block text-[11px]"
                          >
                            {c.complaintNumber}
                          </Link>
                          <span className="text-slate-200 block truncate max-w-xs font-semibold">
                            {c.title}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0d1e40] text-slate-300 border border-slate-600/40">
                            {c.category.replace("_", " ")}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="text-slate-100 block font-medium">
                            {c.community?.name || "Unassigned"}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            {c.locationName}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                              prioObj?.badgeClass || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              statusObj?.color || "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {statusObj?.label || c.status}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              c.verificationStatus === "VERIFIED"
                                ? "bg-emerald-950 text-emerald-700 border border-emerald-800"
                                : c.verificationStatus === "PENDING_VERIFICATION"
                                ? "bg-blue-950 text-blue-400 border border-blue-800"
                                : "bg-slate-50 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {c.verificationStatus}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => {
                              setQuickUpdateComplaint(c);
                              setSelectedNewStatus(c.status);
                            }}
                            className="text-[10px] px-2 py-1 rounded bg-[#0d1e40] hover:bg-[#102046] text-slate-300 border border-slate-600/40 transition-colors"
                          >
                            Status
                          </button>
                          <Link
                            href={`/complaints/${c.id}`}
                            className="text-[10px] px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors inline-block"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GIS Spatial View Tab */}
      {activeTab === "map" && (
        <div className="rounded-2xl border border-slate-600/40 bg-[#091530] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Geospatial Complaint Overlay</span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect GPS markers of reported issues across Tamil Nadu pilot matrix
              </p>
            </div>
            <Link
              href="/map"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
            >
              <span>Open in Fullscreen GIS Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {complaints
              .filter((c) => c.latitude && c.longitude)
              .map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-[#060c1c] border border-slate-600/40 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-400 font-bold">{c.complaintNumber}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        c.priority === "CRITICAL"
                          ? "bg-red-950 text-red-400 border-red-800"
                          : c.priority === "HIGH"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-100 line-clamp-1">{c.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>

                  <div className="pt-2 border-t border-slate-600/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      [{c.latitude?.toFixed(4)}°, {c.longitude?.toFixed(4)}°]
                    </span>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      View Dossier →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Category Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-600/40 bg-[#091530] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Category Distribution
            </h3>
            <div className="space-y-3">
              {COMPLAINT_CATEGORIES.map((cat) => {
                const count = complaints.filter((c) => c.category === cat.value).length;
                const pct = complaints.length ? Math.round((count / complaints.length) * 100) : 0;
                return (
                  <div key={cat.value} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat.label}</span>
                      <span className="font-mono text-blue-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-600/40 bg-[#091530] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Status Pipeline Workflow
            </h3>
            <div className="space-y-3">
              {COMPLAINT_STATUSES.map((stat) => {
                const count = complaints.filter((c) => c.status === stat.value).length;
                const pct = complaints.length ? Math.round((count / complaints.length) * 100) : 0;
                return (
                  <div key={stat.value} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{stat.label}</span>
                      <span className="font-mono text-blue-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hotspots Tab */}
      {activeTab === "hotspots" && (
        <div className="rounded-2xl border border-slate-600/40 bg-[#091530] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Spatial Concentration Hotspots ({hotspots.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Geographic clustering algorithm detects 2+ unresolved grievances within 3.5km
              </p>
            </div>
          </div>

          {hotspots.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No complaint concentrations currently detected.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotspots.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-amber-500/40 bg-[#060c1c] p-4 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{h.communityName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Center: [{h.centerLatitude}°, {h.centerLongitude}°]
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800">
                      {h.complaintCount} Complaints
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#091530] p-2.5 border border-slate-600/40 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Dominant Category:</span>
                      <span className="text-blue-400 font-semibold">
                        {h.primaryCategory.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Cluster Radius:</span>
                      <span className="text-slate-300">{h.radiusKm} km</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">{h.disclaimer}</p>

                  <div className="pt-2 border-t border-slate-600/40 flex justify-end gap-2">
                    <Link
                      href={`/map?highlight=${h.communityId || ""}`}
                      className="text-[11px] font-semibold text-blue-400 hover:underline"
                    >
                      View on GIS Map →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Native Aqua-Lens Grievance Registration Flow Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:text-white border border-slate-600 shadow-xl"
              title="Close Grievance Flow"
            >
              ✕
            </button>
            <CitizenGrievanceFlow
              onComplete={() => {
                loadComplaints();
              }}
              onCancel={() => setIsSubmitModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Status Update Modal */}
      {quickUpdateComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#091530] p-6 shadow-2xl text-xs text-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Update Status: {quickUpdateComplaint.complaintNumber}</span>
              <button
                onClick={() => setQuickUpdateComplaint(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </h3>

            <p className="text-slate-300 text-xs">{quickUpdateComplaint.title}</p>

            <form onSubmit={handleQuickStatusSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">New Workflow Status:</label>
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  className="w-full rounded-xl bg-[#060c1c] border border-slate-600/40 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  {COMPLAINT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#060c1c]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Status Note / Reason:</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Field inspection completed, contractor dispatched..."
                  className="w-full rounded-xl bg-[#060c1c] border border-slate-600/40 px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 resize-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickUpdateComplaint(null)}
                  className="rounded-xl border border-slate-600/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:from-cyan-500 hover:to-teal-500"
                >
                  {updatingStatus ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComplaintCenterPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Complaint Center...</div>}>
        <ComplaintCenterContent />
      </Suspense>
    </AppShell>
  );
}
