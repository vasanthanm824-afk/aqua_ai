"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Shield,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Droplets,
  TrendingUp,
  Users,
  ShieldCheck,
  Leaf,
  Sparkles,
  UserCheck,
  Pencil,
} from "lucide-react";
import { isAdminRole } from "@/lib/permissions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@aqualens.gov.in");
  const [password, setPassword] = useState("AquaAdmin2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<"ADMIN" | "USER">("ADMIN");
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePortalSelect = (portal: "ADMIN" | "USER") => {
    setSelectedPortal(portal);
    if (portal === "ADMIN") {
      setEmail("admin@aqualens.gov.in");
      setPassword("AquaAdmin2026!");
    } else {
      setEmail("citizen@aqualens.gov.in");
      setPassword("Citizen2026!");
    }
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (isAdminRole(data.user.role)) {
          router.push("/");
        } else {
          router.push("/user");
        }
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#bae6fd] text-slate-800 font-sans">
      
      {/* Decorative Floating Water Droplets & Ripples in Background */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-cyan-300/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />

      {/* Decorative Bottom Wave SVG */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none overflow-hidden opacity-60">
        <svg viewBox="0 0 1440 320" className="w-full h-full object-cover">
          <path
            fill="#0284c7"
            fillOpacity="0.15"
            d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,165.3C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <path
            fill="#38bdf8"
            fillOpacity="0.25"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,165.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Main Container Layout */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center space-y-6">

        {/* ── Brand Header ── */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          {/* Logo Badge Icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-sky-400 p-3 shadow-xl shadow-cyan-500/30 text-white">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <path
                  d="M24 8 C24 8 13 22 13 29 C13 35 18 40 24 40 C30 40 35 35 35 29 C35 22 24 8 24 8 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 32 C20 34 28 34 31 32"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="28" cy="22" r="2" fill="#ffffff" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
                  AQUA-LENS
                </span>
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">
                Dual-Portal WASH &amp; Grievance Intelligence System
              </p>
            </div>
          </div>
        </div>

        {/* Center Grid: Left Badges, Main Content, Right Badges */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Left Side Feature Badges */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Monitor</span>
                <span className="text-[11px] text-slate-500">Water Quality</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Smarter</span>
                <span className="text-[11px] text-slate-500">Decisions</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Cleaner</span>
                <span className="text-[11px] text-slate-500">Communities</span>
              </div>
            </div>
          </div>

          {/* Central Auth Container */}
          <div className="lg:col-span-6 w-full space-y-4">

            {/* 1. INSTANT DEMO ACCESS (ONE-CLICK) Card */}
            <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <span className="h-px w-8 bg-slate-300" />
                <span>INSTANT DEMO ACCESS (ONE-CLICK)</span>
                <span className="h-px w-8 bg-slate-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Admin Portal Option */}
                <button
                  type="button"
                  onClick={() => handlePortalSelect("ADMIN")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedPortal === "ADMIN"
                      ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/30 text-blue-950 shadow-md"
                      : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs ${
                        selectedPortal === "ADMIN"
                          ? "bg-blue-600 text-white shadow"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black">Admin Portal</span>
                      <span className="text-[10px] text-slate-500">Command Center</span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      selectedPortal === "ADMIN" ? "text-blue-600 translate-x-0.5" : "text-slate-400"
                    }`}
                  />
                </button>

                {/* Citizen Portal Option */}
                <button
                  type="button"
                  onClick={() => handlePortalSelect("USER")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedPortal === "USER"
                      ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/30 text-emerald-950 shadow-md"
                      : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs ${
                        selectedPortal === "USER"
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-black">Citizen Portal</span>
                      <span className="text-[10px] text-slate-500">Grievance &amp; AI</span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      selectedPortal === "USER" ? "text-emerald-600 translate-x-0.5" : "text-slate-400"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Main Login Form Card */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 p-6 shadow-2xl space-y-5">
              
              {/* Tab Selector: Sign In vs Register */}
              <div className="flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "signin"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "register"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "signin" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-400/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-10 py-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 hover:from-blue-500 hover:to-cyan-400 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 active:scale-[0.99]"
                  >
                    <span>{loading ? "Authenticating Session..." : "→ Sign In to Portal →"}</span>
                  </button>
                </form>
              ) : (
                /* Registration Tab Content */
                <div className="space-y-3 py-2 text-center text-xs text-slate-600">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 space-y-2">
                    <p className="font-bold text-sm">Citizen Grievance Self-Registration</p>
                    <p className="text-[11px] text-slate-600">
                      Citizens can log grievances directly without registration using the Citizen Portal or click quick-fill below to access.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handlePortalSelect("USER");
                      setActiveTab("signin");
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                  >
                    Continue as Citizen User →
                  </button>
                </div>
              )}

              {/* Credentials Quick-Fill Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Credentials Quick-Fill
                </span>

                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      handlePortalSelect("ADMIN");
                      handleLogin(undefined, "admin@aqualens.gov.in", "AquaAdmin2026!");
                    }}
                    className="hover:text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-blue-500" />
                    <span>admin@aqualens.gov.in</span>
                  </button>

                  <span className="text-slate-300">|</span>

                  <button
                    type="button"
                    onClick={() => {
                      handlePortalSelect("USER");
                      handleLogin(undefined, "citizen@aqualens.gov.in", "Citizen2026!");
                    }}
                    className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-emerald-500" />
                    <span>citizen@aqualens.gov.in</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Tagline */}
            <p className="text-center text-[11px] text-slate-500 font-medium">
              Role-protected session management with unified complaint routing.
            </p>
          </div>

          {/* Right Side Feature Badges */}
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Safe Water</span>
                <span className="text-[11px] text-slate-500">Quality Tested</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Sustainable</span>
                <span className="text-[11px] text-slate-500">Tomorrow</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-md text-xs font-semibold text-slate-700">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-slate-900">Community</span>
                <span className="text-[11px] text-slate-500">First Priority</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
