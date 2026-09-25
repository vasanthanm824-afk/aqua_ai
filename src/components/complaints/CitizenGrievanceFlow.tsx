"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Globe2,
  Mic,
  MicOff,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  FileText,
  Volume2,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  INDIAN_LANGUAGES,
  COMPLAINT_TRANSLATIONS,
  getComplaintTranslation,
  LanguageOption,
} from "@/lib/i18n-complaints";
import { determineComplaintDepartment } from "@/lib/complaint-routing";

interface CitizenGrievanceFlowProps {
  onComplete?: (complaintData: any) => void;
  onCancel?: () => void;
  preselectedCommunityId?: string;
  initialDistrict?: string;
}

export function CitizenGrievanceFlow({
  onComplete,
  onCancel,
  preselectedCommunityId,
  initialDistrict = "Ramanathapuram",
}: CitizenGrievanceFlowProps) {
  // Step State: 1 = Language, 2 = Description, 3 = Live Camera, 4 = GPS Location, 5 = Review & Routing, 6 = Registered
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [language, setLanguage] = useState<string>("en");
  const t = getComplaintTranslation(language);

  // Form State
  const [category, setCategory] = useState<string>("WATER_SUPPLY");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [affectedService, setAffectedService] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterContact, setReporterContact] = useState<string>("");

  // Voice Recording State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [speechInterim, setSpeechInterim] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  // Live Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); // persists across renders
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);
  const [livePhotoDataUrl, setLivePhotoDataUrl] = useState<string | null>(null);
  const [photoTimestamp, setPhotoTimestamp] = useState<string | null>(null);
  const [ipLocationLoading, setIpLocationLoading] = useState<boolean>(false);

  // GPS Location State (Requirement 7 & 8)
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearestCommunity, setNearestCommunity] = useState<any>(null);

  // Routing and Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredComplaint, setRegisteredComplaint] = useState<any>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<boolean>(false);

  // Attach camera stream to video element once it's mounted in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch((e) =>
        console.warn("Video play() error:", e)
      );
    }
  }, [cameraActive]);

  // Check speech recognition capability on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  // Update speech recognition language when citizen changes language
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const selectedLangObj = INDIAN_LANGUAGES.find((l) => l.code === language);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLangObj ? selectedLangObj.speechCode : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechInterim("");
      };

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setDescription((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          setTranscribedText((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
        }
        setSpeechInterim(interim);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterim("");
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to initialize speech recognition:", e);
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [language]);

  // Voice toggle
  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Start speech recognition failed:", err);
      }
    }
  };

  // Start Live Camera stream (WebRTC only — no device file picker)
  // Stream is stored in a ref; the video element is mounted AFTER setCameraActive(true),
  // so the useEffect above handles attaching srcObject once the DOM node exists.
  const startCamera = async () => {
    setCameraPermissionDenied(false);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionDenied(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream; // store before state update
      setCameraActive(true);           // triggers re-render → video mounts → useEffect attaches stream
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraPermissionDenied(true);
      setCameraActive(false);
    }
  };

  // Stop Live Camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture Live Snapshot from Video, then auto-resolve address via IP geolocation
  const capturePhotoFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Timestamp watermark
    const now = new Date();
    const timestampStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(10, canvas.height - 35, 320, 26);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`LIVE CAPTURE: ${timestampStr}`, 18, canvas.height - 18);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setLivePhotoDataUrl(dataUrl);
    setPhotoTimestamp(now.toISOString());
    stopCamera();

    // Auto-resolve approximate address from IP geolocation
    setIpLocationLoading(true);
    try {
      const geoRes = await fetch("https://ipapi.co/json/");
      if (geoRes.ok) {
        const geo = await geoRes.json();
        // Build address string from IP geolocation response
        const parts = [
          geo.city,
          geo.region,
          geo.country_name,
        ].filter(Boolean);
        if (parts.length > 0 && !locationName) {
          setLocationName(parts.join(", "));
        }
      }
    } catch (e) {
      console.warn("IP geolocation failed:", e);
    } finally {
      setIpLocationLoading(false);
    }
  };

  // Acquire current GPS location (Requirement 7)
  const acquireGpsLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your device or browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const nowIso = new Date().toISOString();

        setGpsCoords({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp: nowIso,
        });

        // Try to reverse-resolve nearest community
        try {
          const res = await fetch(`/api/communities?limit=100`);
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              // Find closest community using Haversine
              let closest = data.data[0];
              let minDist = 999999;
              data.data.forEach((comm: any) => {
                const dLat = ((comm.latitude - latitude) * Math.PI) / 180;
                const dLon = ((comm.longitude - longitude) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((latitude * Math.PI) / 180) *
                    Math.cos((comm.latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distKm = 6371 * c;
                if (distKm < minDist) {
                  minDist = distKm;
                  closest = comm;
                }
              });

              setNearestCommunity(closest);
              if (!locationName) {
                setLocationName(`${closest.name}, ${closest.district}`);
              }
            }
          }
        } catch (e) {
          console.warn("Nearest community fetch failed:", e);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setGpsError(
          err.code === 1
            ? "Location permission was denied. Please allow location access to verify jurisdiction."
            : "Failed to obtain GPS position. Please try again."
        );
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Determine Jurisdiction & Department Routing (Requirement 10 & 11)
  const routing = determineComplaintDepartment({
    category,
    district: nearestCommunity?.district || initialDistrict,
    block: nearestCommunity?.block || "Taluk Jurisdiction",
    state: nearestCommunity?.state || "Tamil Nadu",
    communityName: nearestCommunity?.name || locationName,
  });

  // Submit Official Grievance (Requirement 12 & 13)
  const handleSubmitGrievance = async () => {
    if (!description.trim() || !category) {
      setSubmitError("Please fill out the detailed grievance description.");
      setCurrentStep(2);
      return;
    }

    if (!livePhotoDataUrl) {
      setSubmitError("Mandatory live photo evidence is required before submission.");
      setCurrentStep(3);
      return;
    }

    if (!gpsCoords) {
      setSubmitError("Please confirm your current device GPS location.");
      setCurrentStep(4);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        locationName: locationName.trim() || `${nearestCommunity?.name || "Local Community"}, ${initialDistrict}`,
        latitude: gpsCoords.latitude,
        longitude: gpsCoords.longitude,
        locationAccuracy: gpsCoords.accuracy,
        locationCapturedAt: gpsCoords.timestamp,
        evidenceCapturedAt: photoTimestamp,
        language,
        communityId: nearestCommunity?.id || preselectedCommunityId || null,
        reporterName: isAnonymous ? "Citizen (Anonymous)" : reporterName || "Citizen Reporter",
        reporterContact: isAnonymous ? null : reporterContact || null,
        isAnonymous,
        evidence: [
          {
            fileUrl: livePhotoDataUrl,
            caption: `Live camera evidence captured at ${new Date().toLocaleTimeString("en-IN")}`,
            fileType: "image",
            captureType: "LIVE_CAMERA",
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
            locationAccuracy: gpsCoords.accuracy,
          },
        ],
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Failed to register grievance.");
      }

      const json = await res.json();
      setRegisteredComplaint(json.data);
      setCurrentStep(6); // Step 6: Registered

      if (onComplete) {
        onComplete(json.data);
      }
    } catch (err: any) {
      console.error("Grievance submission error:", err);
      setSubmitError(err.message || "Failed to submit grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrackingId(true);
    setTimeout(() => setCopiedTrackingId(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0a1426] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-800">
      {/* Top Header with Language Indicator */}
      <div className="bg-gradient-to-r from-[#0c1c38] via-[#0e244d] to-[#0c1c38] border-b border-cyan-500/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase">
              {t.title}
            </h2>
          </div>
          <p className="text-[11px] text-cyan-300/80 mt-0.5">{t.subtitle}</p>
        </div>

        {/* Global Quick Language Pill */}
        <div className="flex items-center gap-2 bg-[#060e1e] border border-cyan-500/30 rounded-lg px-2.5 py-1">
          <Globe2 className="w-3.5 h-3.5 text-blue-600" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs font-semibold text-cyan-200 focus:outline-none cursor-pointer"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#0a1426] text-slate-900">
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6-Step Visual Stepper Progress Bar */}
      <div className="bg-[#07101f] border-b border-slate-200 px-4 py-3 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] text-xs">
          {[
            { step: 1, label: t.steps.language },
            { step: 2, label: t.steps.description },
            { step: 3, label: t.steps.evidence },
            { step: 4, label: t.steps.location },
            { step: 5, label: t.steps.review },
            { step: 6, label: t.steps.completed },
          ].map((s) => (
            <div
              key={s.step}
              className={`flex items-center gap-1.5 transition-colors ${
                currentStep === s.step
                  ? "text-blue-600 font-bold"
                  : currentStep > s.step
                  ? "text-emerald-700 font-medium"
                  : "text-slate-500"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                  currentStep === s.step
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                    : currentStep > s.step
                    ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/40"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {currentStep > s.step ? "✓" : s.step}
              </div>
              <span className="whitespace-nowrap">{s.label}</span>
              {s.step < 6 && <ChevronRight className="w-3.5 h-3.5 text-slate-700 ml-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="text-red-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step Content Area */}
      <div className="p-6">
        {/* ================= STEP 1: CHOOSE LANGUAGE ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <span>{t.language.selectTitle}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t.language.selectPrompt}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INDIAN_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white"
                        : "bg-white border-slate-200 hover:border-slate-200 text-slate-600 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold">{lang.name}</span>
                    <span className="text-sm font-black text-blue-700 font-sans mt-0.5">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Code: {lang.speechCode}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all"
              >
                <span>{t.language.continueBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DESCRIBE THE GRIEVANCE ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.complaint.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-cyan-400 focus:outline-none"
              >
                {Object.entries(t.complaint.categories).map(([val, label]) => (
                  <option key={val} value={val} className="bg-[#0a1426]">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice-to-Complaint Hero Action (Requirement 3) */}
            <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-b from-[#0c2044] to-[#091530] p-4 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>{t.voice.voiceBtn}</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Speak your complaint in{" "}
                    <b>{INDIAN_LANGUAGES.find((l) => l.code === language)?.name}</b>. Transcribed text
                    can be edited freely.
                  </p>
                </div>

                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
                      isListening
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>{t.voice.stopBtn}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>{t.voice.voiceBtn}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Listening Status Animation */}
              {isListening && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>{t.voice.listening}</span>
                  {speechInterim && (
                    <span className="text-slate-600 italic ml-2">"{speechInterim}"</span>
                  )}
                </div>
              )}

              {!voiceSupported && (
                <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
                  {t.voice.voiceFallbackNotice}
                </p>
              )}
            </div>

            {/* Title Input — Brief Grievance Summary (Optional) */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t.complaint.titleLabel}
                </label>
                <span className="text-[10px] font-normal text-slate-500 bg-slate-100/60 border border-slate-200 px-1.5 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.complaint.titlePlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Description Textarea — Detailed Description (Required) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t.complaint.descLabel}
                </label>
                {description && (
                  <button
                    type="button"
                    onClick={() => setDescription("")}
                    className="text-[10px] text-slate-500 hover:text-red-400"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.complaint.descPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Affected Service / Asset */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t.complaint.serviceAffected}
              </label>
              <input
                type="text"
                value={affectedService}
                onChange={(e) => setAffectedService(e.target.value)}
                placeholder={t.complaint.servicePlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.review.backBtn}</span>
              </button>

              <button
                type="button"
                disabled={!description.trim()}
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
              >
                <span>Continue to Live Photo Evidence →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CAPTURE LIVE EVIDENCE ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/40 uppercase">
                  {t.evidence.badgeRequired}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{t.evidence.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.evidence.subtitle}</p>
            </div>

            {/* Live Camera Viewfinder or Captured Preview */}
            <div className="relative rounded-2xl border-2 border-dashed border-cyan-500/40 bg-[#050d1a] overflow-hidden min-h-[260px] flex flex-col items-center justify-center p-4">
              {livePhotoDataUrl ? (
                <div className="w-full space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/50 shadow-2xl">
                    <img
                      src={livePhotoDataUrl}
                      alt="Live Ground Truth Evidence"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-emerald-700 border border-emerald-500/30">
                      ✓ LIVE CAMERA EVIDENCE VERIFIED
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">
                        {t.evidence.timestamp}: {new Date().toLocaleTimeString("en-IN")}
                      </span>
                      {ipLocationLoading && (
                        <span className="text-[10px] text-blue-600 font-mono animate-pulse">
                          ⌕ Resolving location from network...
                        </span>
                      )}
                      {locationName && !ipLocationLoading && (
                        <span className="text-[10px] text-emerald-700 font-mono">
                          📍 {locationName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLivePhotoDataUrl(null);
                        startCamera();
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold underline"
                    >
                      {t.evidence.retakeBtn}
                    </button>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="w-full space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                    <div className="absolute top-2 left-2 bg-red-600/80 px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center gap-1.5 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span>LIVE VIEWFINDER</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhotoFromVideo}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>CAPTURE PHOTO NOW</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-blue-600 border border-cyan-500/30">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.evidence.cameraPrompt}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {t.evidence.mandatoryAlert}
                    </p>
                  </div>

                  {cameraPermissionDenied && (
                    <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200 max-w-sm text-left">
                      <b className="block mb-1">{t.evidence.permissionDenied}</b>
                      <span>{t.evidence.permissionInstructions}</span>
                      <p className="mt-2 text-red-300/80">
                        Tip: Open your browser site settings and allow camera access, then reload this page.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t.evidence.takeLivePhoto}</span>
                  </button>

                  <p className="text-[10px] text-slate-500 max-w-xs">
                    Only live in-app camera capture is accepted. File uploads from device gallery are not permitted.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.review.backBtn}</span>
              </button>

              <button
                type="button"
                disabled={!livePhotoDataUrl}
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
              >
                <span>Continue to GPS Location →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: CONFIRM GPS LOCATION ================= */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{t.location.title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.location.subtitle}</p>
            </div>

            {/* GPS Detection Box */}
            <div className="rounded-2xl border border-cyan-500/30 bg-white p-5 space-y-4">
              {gpsCoords ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>GPS SATELLITE FIX ACQUIRED</span>
                    </span>
                    <button
                      type="button"
                      onClick={acquireGpsLocation}
                      disabled={gpsLoading}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {t.location.recaptureBtn}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#07101f] p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t.location.latLng}</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {gpsCoords.latitude.toFixed(6)}° N, {gpsCoords.longitude.toFixed(6)}° E
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t.location.accuracy}</span>
                      <span
                        className={`font-mono font-bold ${
                          gpsCoords.accuracy > 100 ? "text-amber-400" : "text-emerald-700"
                        }`}
                      >
                        ± {gpsCoords.accuracy} meters
                      </span>
                    </div>
                  </div>

                  {gpsCoords.accuracy > 100 && (
                    <p className="text-[11px] text-amber-700 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg">
                      ⚠️ {t.location.accuracyLowWarning}
                    </p>
                  )}

                  {nearestCommunity && (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                      <span className="text-[10px] font-mono text-blue-700 uppercase block">
                        {t.location.communityDetected}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{nearestCommunity.name}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {nearestCommunity.block ? `${nearestCommunity.block}, ` : ""}
                        {nearestCommunity.district}, {nearestCommunity.state || "Tamil Nadu"} (Census ID: {nearestCommunity.code})
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Locality / Specific Landmark (Optional clarification)
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Near East Jetty Standpost / Beach Road Culvert"
                      className="w-full rounded-xl border border-slate-200 bg-[#07101f] px-3.5 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    ℹ️ {t.location.accuracyNotice}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-blue-600 border border-cyan-500/30">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Enable GPS Geolocation</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Aqua-Lens routes your grievance to the local panchayat and district water body
                      using verified device hardware coordinates.
                    </p>
                  </div>

                  {gpsError && (
                    <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">
                      {gpsError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={acquireGpsLocation}
                    disabled={gpsLoading}
                    className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.location.detecting}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        <span>{t.location.detectBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.review.backBtn}</span>
              </button>

              <button
                type="button"
                disabled={!gpsCoords}
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
              >
                <span>Continue to Routing & Review →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: REVIEW & DEPARTMENT ROUTING ================= */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.review.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.review.subtitle}</p>
            </div>

            {/* Automatic Department Routing Card (Requirement 10 & 11) */}
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-[#0c2044] to-[#071326] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{t.routing.title}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500/40">
                  {t.routing.statusReady}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">{t.routing.category}:</span>
                  <span className="font-bold text-slate-900">
                    {t.complaint.categories[category] || category}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">{t.routing.locality}:</span>
                  <span className="font-bold text-blue-700">
                    {nearestCommunity?.name || locationName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">{t.routing.jurisdiction}:</span>
                  <span className="text-slate-700">{routing.jurisdiction}</span>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-200">
                  <span className="text-slate-500 text-[11px] mb-0.5">{t.routing.department}:</span>
                  <span className="font-extrabold text-blue-600">{routing.department}</span>
                </div>
                <div className="flex justify-between py-1 text-[11px] text-slate-500">
                  <span>Nodal Resolution Officer:</span>
                  <span className="text-slate-600">{routing.nodalOfficer}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                ℹ️ {t.routing.transparencyNote}
              </p>
            </div>

            {/* Grievance Summary Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                {livePhotoDataUrl && (
                  <img
                    src={livePhotoDataUrl}
                    alt="Live Evidence"
                    className="w-20 h-20 rounded-lg object-cover border border-cyan-500/40 shrink-0"
                  />
                )}
                <div className="space-y-1 overflow-hidden">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{title}</h4>
                  <p className="text-slate-600 text-xs line-clamp-3">{description}</p>
                  {affectedService && (
                    <span className="text-[10px] text-blue-600 block">
                      Asset: {affectedService}
                    </span>
                  )}
                </div>
              </div>

              {gpsCoords && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    GPS: {gpsCoords.latitude.toFixed(5)}° N, {gpsCoords.longitude.toFixed(5)}° E (±{gpsCoords.accuracy}m)
                  </span>
                </div>
              )}
            </div>

            {/* Privacy & Contact Settings (Requirement 19) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-200 bg-[#07101f] text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {t.review.anonymousToggle}
                  </span>
                  <span className="text-[11px] text-slate-500 block">{t.review.anonymousDesc}</span>
                </div>
              </label>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Citizen Name"
                      className="w-full rounded-lg border border-slate-200 bg-[#07101f] px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      {t.review.contactPhone}
                    </label>
                    <input
                      type="tel"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-slate-200 bg-[#07101f] px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.review.backBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitGrievance}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-7 py-3 text-xs font-black text-white shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.review.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.review.submitBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: COMPLAINT REGISTERED (SUCCESS) ================= */}
        {currentStep === 6 && registeredComplaint && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-200 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {t.success.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your grievance has been officially cataloged and forwarded to the local authority.
              </p>
            </div>

            {/* Unique Tracking ID Hero Box (Requirement 13) */}
            <div className="rounded-2xl border-2 border-cyan-500/50 bg-[#071326] p-5 shadow-2xl space-y-3 max-w-md mx-auto">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest block">
                {t.success.trackingIdLabel}
              </span>
              <div className="text-2xl font-black font-mono text-blue-600 tracking-wider">
                {registeredComplaint.trackingId || registeredComplaint.complaintNumber}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      registeredComplaint.trackingId || registeredComplaint.complaintNumber
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors"
                >
                  {copiedTrackingId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-700">{t.success.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.success.copyBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Registration Metadata Details */}
            <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">{t.success.statusLabel}</span>
                <span className="font-bold text-amber-400">
                  {registeredComplaint.status} / ROUTED
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{t.success.submittedAt}</span>
                <span className="text-slate-600 font-mono">
                  {new Date(registeredComplaint.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t.success.deptLabel}</span>
                <span className="text-blue-700 font-semibold text-[11px] block">
                  {registeredComplaint.routedDepartment || routing.department}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/complaints/track?id=${
                  registeredComplaint.trackingId || registeredComplaint.complaintNumber
                }`}
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all"
              >
                <span>{t.success.trackBtn}</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setRegisteredComplaint(null);
                  setTitle("");
                  setDescription("");
                  setLivePhotoDataUrl(null);
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-100/80 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-600 transition-colors"
              >
                {t.success.newComplaintBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
