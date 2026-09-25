"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  MapPin,
  Camera,
  ShieldCheck,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { COMPLAINT_CATEGORIES } from "@/lib/complaints";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newComplaint: any) => void;
  initialCommunityId?: string | null;
  initialCommunityName?: string | null;
}

export function ComplaintSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
  initialCommunityId,
  initialCommunityName,
}: Props) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("WATER_SUPPLY");
  const [locationName, setLocationName] = useState("");
  const [communityId, setCommunityId] = useState(initialCommunityId || "");
  const [latitude, setLatitude] = useState<number | string>("");
  const [longitude, setLongitude] = useState<number | string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [gettingGPS, setGettingGPS] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/communities?limit=100")
        .then((r) => r.json())
        .then((d) => {
          if (d.data) {
            setCommunities(d.data);
            if (initialCommunityId) {
              const matched = d.data.find((c: any) => c.id === initialCommunityId);
              if (matched) {
                setCommunityId(matched.id);
                setLatitude(matched.latitude);
                setLongitude(matched.longitude);
                if (!locationName) setLocationName(`${matched.name}, Ward 1`);
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, initialCommunityId]);

  if (!isOpen) return null;

  const handleCommunityChange = (cId: string) => {
    setCommunityId(cId);
    const comm = communities.find((c) => c.id === cId);
    if (comm) {
      setLatitude(comm.latitude);
      setLongitude(comm.longitude);
      if (!locationName) {
        setLocationName(`${comm.name}, Main Habitation`);
      }
    }
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setGettingGPS(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingGPS(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setErrorMsg("Unable to retrieve device GPS. Please select a community or enter coordinates manually.");
        setGettingGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Photo file size exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !locationName.trim()) {
      setErrorMsg("Please fill in title, description, and location.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        title,
        description,
        category,
        locationName,
        communityId: communityId || null,
        latitude: latitude ? parseFloat(String(latitude)) : null,
        longitude: longitude ? parseFloat(String(longitude)) : null,
        isAnonymous,
        reporterName: isAnonymous ? null : reporterName,
        reporterContact: isAnonymous ? null : reporterContact,
        evidence: photoPreview
          ? [
              {
                fileUrl: photoPreview,
                caption: photoCaption || "Uploaded citizen grievance photo evidence",
                fileType: "image",
              },
            ]
          : [],
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register complaint.");
      }

      setSuccessData(data.data);
      if (onSuccess) onSuccess(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/40 bg-white p-6 shadow-2xl text-xs text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <AlertTriangle className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide">
                REGISTER CITIZEN GRIEVANCE
              </h2>
              <p className="text-[11px] text-slate-500">
                Lodge water, sanitation, drainage, or flooding issues for institutional tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="space-y-5 text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Grievance Registered Successfully</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your complaint has been logged and assigned official tracking code:
              </p>
              <div className="inline-block mt-3 px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500 font-mono text-base font-black text-blue-700">
                {successData.complaintNumber}
              </div>
            </div>

            <div className="rounded-xl bg-[#f8fafc] border border-slate-200 p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900">{successData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Assessment:</span>
                <span className="font-bold text-amber-400 font-mono">{successData.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Linked Settlement:</span>
                <span className="text-blue-700">{successData.community?.name || "Auto-detected Nearest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-mono text-blue-600">{successData.status}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 transition-all"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-red-950/60 p-3 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category & Settlement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-white">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Linked Community / Gram Panchayat
                </label>
                <select
                  value={communityId}
                  onChange={(e) => handleCommunityChange(e.target.value)}
                  className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="" className="bg-white">
                    -- Auto-detect via GPS or Select --
                  </option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white">
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Grievance Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RO Kiosk Non-functional & Saline Groundwater Intrusion"
                className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the failure, duration of outage, number of affected households, or health concerns..."
                className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 resize-none"
                required
              />
            </div>

            {/* Location & GPS */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-semibold">
                  Specific Location / Habitation / Ward *
                </label>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={gettingGPS}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {gettingGPS ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  <span>Capture GPS Location</span>
                </button>
              </div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Near Bus Stand Water Standpost, Ward 3"
                className="w-full rounded-xl bg-[#f8fafc] border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 mb-2"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Latitude (GPS):</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 9.2785"
                    className="w-full rounded-lg bg-[#f8fafc] border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Longitude (GPS):</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 79.1248"
                    className="w-full rounded-lg bg-[#f8fafc] border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Photo / Evidence Upload */}
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3 space-y-2">
              <label className="block text-slate-600 font-semibold">
                Photo Evidence (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-700 px-3 py-2 cursor-pointer border border-slate-200 transition-colors">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Select Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Photo attached</span>
                  </span>
                )}
              </div>

              {photoPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-lg border border-cyan-500/40 shadow"
                  />
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Add brief caption (e.g. Broken pipe valve)"
                    className="flex-1 rounded-lg bg-[#070f22] border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </div>

            {/* Reporter Privacy / Anonymity */}
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-teal-700" />
                  <span className="font-semibold text-slate-700">Submit Anonymously</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {!isAnonymous ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Your Name:</span>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="e.g. S. Ramanathan"
                      className="w-full rounded-lg bg-[#070f22] border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Phone / Contact:</span>
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="e.g. +91 98400 12345"
                      className="w-full rounded-lg bg-[#070f22] border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Your identity and contact details will not be stored or visible to administrators.
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-white hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Register Complaint</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
