"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Droplets,
  AlertTriangle,
  Building,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { VulnerabilityBadge } from "@/components/shared/VulnerabilityBadge";

export default function CommunitiesDirectoryPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedVulnerability, setSelectedVulnerability] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // New community form state for India
  const [form, setForm] = useState({
    name: "",
    state: "Tamil Nadu",
    district: "Ramanathapuram",
    block: "Mandapam",
    population: 4500,
    latitude: 9.28,
    longitude: 79.12,
    waterAccessPct: 38,
    sanitationAccessPct: 44,
    povertyRate: 46,
    rainfallAnnualMm: 820,
    floodHazardLevel: "High",
    infrastructureScore: 42,
  });

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedDistrict !== "All") params.set("district", selectedDistrict);
      if (selectedVulnerability !== "All") params.set("vulnerability", selectedVulnerability);

      const res = await fetch(`/api/communities?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCommunities(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, [selectedDistrict, selectedVulnerability]);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAddModal(false);
        loadCommunities();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create village / GP record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>VILLAGE & GRAM PANCHAYAT INTELLIGENCE DIRECTORY</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tamil Nadu pilot database: georeferenced villages and blocks with Census 2011, JJM, SBM-G, and IMD/CWC metrics
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Village / GP</span>
            </button>
            <Link
              href="/import"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Import India Dataset</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadCommunities()}
              placeholder="Search by village name, LGD code, block, or district..."
              className="w-full rounded-lg bg-[#f8fafc] pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 border border-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-lg bg-[#f8fafc] px-2.5 py-1.5 text-xs text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="All">All Districts</option>
              <option value="Ramanathapuram">Ramanathapuram (Demo Focus)</option>
              <option value="Cuddalore">Cuddalore</option>
              <option value="Nagapattinam">Nagapattinam</option>
              <option value="Mayiladuthurai">Mayiladuthurai</option>
              <option value="Dharmapuri">Dharmapuri</option>
              <option value="Tiruvannamalai">Tiruvannamalai</option>
            </select>
          </div>

          {/* Vulnerability Severity Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Severity:</span>
            <select
              value={selectedVulnerability}
              onChange={(e) => setSelectedVulnerability(e.target.value)}
              className="rounded-lg bg-[#f8fafc] px-2.5 py-1.5 text-xs text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="VERY_HIGH">Very High (80-100)</option>
              <option value="HIGH">High (60-79)</option>
              <option value="MODERATE">Moderate (40-59)</option>
              <option value="LOW">Low (20-39)</option>
              <option value="VERY_LOW">Very Low (0-19)</option>
            </select>
          </div>

          <button
            onClick={loadCommunities}
            className="flex items-center gap-1 rounded-lg bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-cyan-900 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Apply</span>
          </button>
        </div>

        {/* Communities Table */}
        <div className="glass-panel rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-500 font-mono">
                  <th className="py-3 px-4">Village / GP & LGD Code</th>
                  <th className="py-3 px-4">Block & District (Tamil Nadu)</th>
                  <th className="py-3 px-4 text-right">Census 2011 Pop</th>
                  <th className="py-3 px-4 text-right">JJM Tap Cover</th>
                  <th className="py-3 px-4 text-right">SBM Sanitation</th>
                  <th className="py-3 px-4 text-center">CWC Flood Hazard</th>
                  <th className="py-3 px-4 text-right">TWAD Infra</th>
                  <th className="py-3 px-4 text-center">Vulnerability Signal</th>
                  <th className="py-3 px-4 text-center">Completeness</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {communities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100/30 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {c.name}
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400/80">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.block || "Taluk"}</div>
                      <span className="text-[11px] text-slate-500">{c.district}, {c.state || "Tamil Nadu"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {c.population.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                      {c.waterAccessPct}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-400">
                      {c.sanitationAccessPct}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          c.floodHazardLevel === "Severe" || c.floodHazardLevel === "Catastrophic"
                            ? "bg-red-950/80 text-red-400 border border-red-800"
                            : c.floodHazardLevel === "High"
                            ? "bg-orange-950/80 text-orange-400 border border-orange-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.floodHazardLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {c.infrastructureScore}/100
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <VulnerabilityBadge
                        category={c.vulnerabilityCategory}
                        score={c.compositeVulnerabilityScore}
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {c.dataCompletenessPct}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/communities/${c.id}`}
                        className="inline-flex items-center gap-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Register New Settlement */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-[#091530] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Register Village / Gram Panchayat Record</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCommunity} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">Village / GP Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Mandapam Coastal Settlement"
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Block / Taluk *</label>
                    <input
                      type="text"
                      required
                      value={form.block}
                      onChange={(e) => setForm({ ...form, block: e.target.value })}
                      placeholder="e.g. Mandapam"
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">District (Tamil Nadu) *</label>
                    <select
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    >
                      <option value="Ramanathapuram">Ramanathapuram</option>
                      <option value="Cuddalore">Cuddalore</option>
                      <option value="Nagapattinam">Nagapattinam</option>
                      <option value="Mayiladuthurai">Mayiladuthurai</option>
                      <option value="Dharmapuri">Dharmapuri</option>
                      <option value="Tiruvannamalai">Tiruvannamalai</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Census 2011 Population *</label>
                    <input
                      type="number"
                      required
                      value={form.population}
                      onChange={(e) => setForm({ ...form, population: parseInt(e.target.value, 10) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Latitude (°N) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Longitude (°E) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">JJM Tap Water (% coverage)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.waterAccessPct}
                      onChange={(e) => setForm({ ...form, waterAccessPct: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">SBM Sanitation (% coverage)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.sanitationAccessPct}
                      onChange={(e) => setForm({ ...form, sanitationAccessPct: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">CWC Flood Hazard Category</label>
                    <select
                      value={form.floodHazardLevel}
                      onChange={(e) => setForm({ ...form, floodHazardLevel: e.target.value })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    >
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                      <option value="Severe">Severe</option>
                      <option value="Catastrophic">Catastrophic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">TWAD Infra Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.infrastructureScore}
                      onChange={(e) => setForm({ ...form, infrastructureScore: parseFloat(e.target.value) })}
                      className="w-full rounded bg-[#f8fafc] px-3 py-1.5 text-slate-900 border border-slate-200 focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 font-bold text-white hover:from-cyan-500 hover:to-teal-500"
                  >
                    Save & Compute Vulnerability Signal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
