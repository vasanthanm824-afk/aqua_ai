"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CitizenGrievanceFlow } from "@/components/complaints/CitizenGrievanceFlow";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";

export default function RegisterGrievancePage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/complaints"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Complaint Center</span>
          </Link>

          <Link
            href="/complaints/track"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-xl"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Existing Grievance</span>
          </Link>
        </div>

        {/* Multilingual Voice & Camera Grievance Registration Flow */}
        <CitizenGrievanceFlow />
      </div>
    </AppShell>
  );
}
