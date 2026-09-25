"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Lock, Mail, Shield, UserCheck, ArrowRight, AlertCircle } from "lucide-react";
import { isAdminRole } from "@/lib/permissions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  const fillQuickAcc = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#050c1a] text-slate-100 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#091530] p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="text-xl font-black text-white tracking-wide uppercase mt-2">
            Aqua-Lens Portal Authentication
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your role-based portal (Admin or Citizen)
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@aqualens.org"
                required
                className="w-full rounded-xl bg-[#060c1c] border border-slate-600/40 pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl bg-[#060c1c] border border-slate-600/40 pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/50 space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
            Quick Test Accounts
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => fillQuickAcc("admin@aqualens.org", "AquaAdmin2026!")}
              className="p-2.5 rounded-xl bg-[#060c1c] border border-cyan-500/30 hover:border-cyan-400 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>ADMIN PORTAL</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">admin@aqualens.org</p>
            </button>

            <button
              onClick={() => fillQuickAcc("citizen@aqualens.org", "Citizen2026!")}
              className="p-2.5 rounded-xl bg-[#060c1c] border border-emerald-500/30 hover:border-emerald-400 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>USER PORTAL</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">citizen@aqualens.org</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
