"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Table,
} from "lucide-react";

export default function ReportsAndExportsPage() {
  const [reportType, setReportType] = useState<string>("vulnerability");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}&format=json`);
      if (res.ok) {
        const json = await res.json();
        setReportData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    window.location.href = `/api/reports?type=${reportType}&format=csv`;
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto print:p-0">
        {/* Header & Controls (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              <span>INTELLIGENCE REPORTS & EXPORTS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate standardized, auditable reports with provenance timestamps and CSV/PDF export options
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-600/40 bg-[#060c1c] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={handleCsvDownload}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-teal-500 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Report Category Switcher (Hidden when printing) */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#060c1c] p-2 border border-slate-600/40 print:hidden text-xs">
          {[
            { id: "vulnerability", label: "Vulnerability Index" },
            { id: "water", label: "Water Access Deficit" },
            { id: "sanitation", label: "Sanitation Coverage" },
            { id: "flood", label: "Flood Hazard Exposure" },
            { id: "interventions", label: "Intervention Pipeline" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                reportType === tab.id
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Preview Document Canvas (Styled for both Screen & Print) */}
        <div className="rounded-2xl border border-slate-200 bg-[#091530] p-8 space-y-6 shadow-2xl print:border-none print:p-0 print:bg-white print:text-black">
          {/* Official Document Letterhead */}
          <div className="flex items-start justify-between border-b border-slate-600/40 print:border-black pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold block print:text-cyan-800">
                AQUA-LENS INTELLIGENCE PLATFORM
              </span>
              <h2 className="text-xl font-black text-white print:text-black mt-1">
                {reportData?.title || "Environmental Intelligence Report"}
              </h2>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                Policy Version: <b>Standard Policy v{reportData?.policyVersion || 1}</b> • Scope:{" "}
                <b>Tamil Nadu Priority Districts (India)</b>
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 print:text-gray-600 font-mono space-y-1">
              <div>Generated: {new Date(reportData?.timestamp || Date.now()).toLocaleString()}</div>
              <div>Records Included: {reportData?.totalRecords || 0}</div>
              <div className="text-emerald-700 font-bold print:text-emerald-700">STATUS: AUDITED (INDIA DEMO)</div>
            </div>
          </div>

          {/* Metadata & Methodology Note */}
          <div className="rounded-xl bg-[#060c1c] print:bg-gray-100 p-4 border border-slate-600/40 print:border-gray-300 text-xs text-slate-300 print:text-gray-800 space-y-1">
            <span className="font-bold text-blue-400 print:text-cyan-900 block">
              Provenance & Methodology Disclosure:
            </span>
            <p className="leading-relaxed text-[11px] text-slate-400 print:text-gray-700">
              Indicators derived from Census of India 2011, Jal Jeevan Mission (JJM/WQMIS), Swachh Bharat Mission-Gramin (SBM-G),
              India Meteorological Department (IMD), Central Water Commission (CWC), and NFHS-5 (MoHFW).
              All calculated scores represent 6-factor normalized weighted aggregations for infrastructure prioritization.
              Zero substitution is prohibited for missing values. Illustrative sample data is clearly tagged as Demo status.
            </p>
          </div>

          {/* Report Data Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Compiling report dataset...</span>
            </div>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse print:text-[10px]">
                <thead>
                  <tr className="bg-[#070f22] print:bg-gray-200 text-slate-300 print:text-black font-mono border-b border-slate-600/40 print:border-gray-400">
                    {Object.keys(reportData.data[0]).map((header) => (
                      <th key={header} className="py-2.5 px-3 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30 print:divide-gray-300">
                  {reportData.data.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-800/30 print:hover:bg-transparent"
                    >
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td
                          key={cIdx}
                          className="py-2.5 px-3 text-slate-300 print:text-black font-mono"
                        >
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No records available for the selected report filter.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
