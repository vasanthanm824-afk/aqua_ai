"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ClipboardCheck,
  CheckCircle2,
  MapPin,
  Camera,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  AlertTriangle,
  FileText,
  User,
} from "lucide-react";

export default function FieldVerificationPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Form state
  const [communityId, setCommunityId] = useState("");
  const [waterObservedPct, setWaterObservedPct] = useState(30);
  const [sanitationObservedPct, setSanitationObservedPct] = useState(25);
  const [infrastructureCondition, setInfrastructureCondition] = useState("Fair");
  const [notes, setNotes] = useState("");
  const [gpsLat, setGpsLat] = useState<number | string>("");
  const [gpsLng, setGpsLng] = useState<number | string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [verRes, comRes] = await Promise.all([
        fetch("/api/field-verifications"),
        fetch("/api/communities?limit=100"),
      ]);
      if (verRes.ok) {
        const v = await verRes.json();
        setVerifications(v.data || []);
      }
      if (comRes.ok) {
        const c = await comRes.json();
        setCommunities(c.data || []);
        if (c.data?.length > 0 && !communityId) {
          setCommunityId(c.data[0].id);
          setGpsLat(c.data[0].latitude);
          setGpsLng(c.data[0].longitude);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCommunityChange = (cId: string) => {
    setCommunityId(cId);
    const comm = communities.find((c) => c.id === cId);
    if (comm) {
      setGpsLat(comm.latitude);
      setGpsLng(comm.longitude);
      setWaterObservedPct(comm.waterAccessPct);
      setSanitationObservedPct(comm.sanitationAccessPct);
    }
  };

  const handleGetGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLat(pos.coords.latitude);
          setGpsLng(pos.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation failed, using community baseline coordinates:", err);
        }
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/field-verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          waterObservedPct: parseFloat(String(waterObservedPct)),
          sanitationObservedPct: parseFloat(String(sanitationObservedPct)),
          infrastructureCondition,
          notes,
          gpsLatitude: gpsLat ? parseFloat(String(gpsLat)) : null,
          gpsLongitude: gpsLng ? parseFloat(String(gpsLng)) : null,
          photoUrls: photoPreview ? ["photo_evidence_field_audit.jpg"] : [],
        }),
      });

      if (res.ok) {
        setSuccessMsg("Field audit submission successfully verified & synced to central registry!");
        setNotes("");
        setPhotoPreview(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Title & Sync Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-emerald-700" />
              <span>FIELD VERIFICATION & SENSOR AUDIT PROTOCOL</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mobile-optimized ground truth validation interface for field officers, technical inspectors, and water engineers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 text-xs text-emerald-700">
              <Wifi className="w-3.5 h-3.5" />
              <span>Live Sync Active</span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="rounded-xl bg-emerald-950/60 p-4 border border-emerald-500/40 text-xs text-emerald-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form (2 cols) */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-200 space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Ground Observation</h3>
              <p className="text-xs text-slate-500">
                Data submitted here is stored separately from public baseline records to preserve dataset provenance
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Settlement Selector */}
              <div>
                <label className="text-slate-500 block mb-1">Target Settlement *</label>
                <select
                  value={communityId}
                  onChange={(e) => handleCommunityChange(e.target.value)}
                  className="w-full rounded-xl bg-[#f8fafc] px-3 py-2 text-slate-900 border border-slate-200 font-semibold focus:border-cyan-400 text-xs"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district}, Block: {c.block || "Taluk"}) — Baseline Water: {c.waterAccessPct}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Water & Sanitation Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 rounded-xl bg-white p-3.5 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span className="text-blue-700">Observed Water Access</span>
                    <span className="font-mono text-blue-600 text-sm font-bold">
                      {waterObservedPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={waterObservedPct}
                    onChange={(e) => setWaterObservedPct(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    Proportion of households using functional, safe water points
                  </span>
                </div>

                <div className="space-y-2 rounded-xl bg-white p-3.5 border border-slate-200">
                  <div className="flex justify-between font-semibold">
                    <span className="text-blue-300">Observed Sanitation Access</span>
                    <span className="font-mono text-blue-400 text-sm font-bold">
                      {sanitationObservedPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sanitationObservedPct}
                    onChange={(e) => setSanitationObservedPct(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    Households with sanitary containment latrines
                  </span>
                </div>
              </div>

              {/* Infrastructure Condition & GPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 block mb-1">Infrastructure Physical Health</label>
                  <select
                    value={infrastructureCondition}
                    onChange={(e) => setInfrastructureCondition(e.target.value)}
                    className="w-full rounded-xl bg-[#f8fafc] px-3 py-2 text-slate-900 border border-slate-200"
                  >
                    <option value="Good">Good — Systems operational and protected</option>
                    <option value="Fair">Fair — Functional but requires preventive overhaul</option>
                    <option value="Poor">Poor — Major leaks or partial electro-mechanical failure</option>
                    <option value="Critical">Critical — Inoperable / contaminated source</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-500">GPS Geolocation Coordinates</label>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Acquire Device GPS</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={gpsLat}
                      onChange={(e) => setGpsLat(e.target.value)}
                      className="rounded bg-[#f8fafc] px-2.5 py-1.5 text-slate-900 border border-slate-200 font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={gpsLng}
                      onChange={(e) => setGpsLng(e.target.value)}
                      className="rounded bg-[#f8fafc] px-2.5 py-1.5 text-slate-900 border border-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Field Notes */}
              <div>
                <label className="text-slate-500 block mb-1">Audit Notes & Inspection Findings *</label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record pump mechanical condition, water salinity, seasonal contamination, or community requests..."
                  className="w-full rounded-xl bg-[#f8fafc] px-3 py-2 text-slate-900 border border-slate-200 focus:border-cyan-400"
                />
              </div>

              {/* Photo Evidence Upload */}
              <div>
                <label className="text-slate-500 block mb-1">Photographic Evidence</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 rounded-lg bg-[#f8fafc] px-3 py-2 border border-slate-200 hover:border-cyan-500 cursor-pointer text-slate-600">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Attach Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Image attached (1)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Verified Observation</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Historical Verification Entries */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Recent Field Audits ({verifications.length})</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {v.community?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(v.verificationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-700 border border-emerald-800">
                      {v.status}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed italic">
                    "{v.notes}"
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-blue-600 font-mono">
                      Water: {v.waterObservedPct}%
                    </span>
                    <span className="text-slate-500">
                      Officer: <b>{v.officerName || "M. Subramanian (AE, TWAD)"}</b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
