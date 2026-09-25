"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Layers,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Papa from "papaparse";

export default function DataIntegrationCenterPage() {
  const [activeTab, setActiveTab] = useState<"import" | "sources" | "history">("import");
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [category, setCategory] = useState("WATER_ACCESS");

  // Import Workflow Steps
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: "",
    district: "",
    region: "",
    latitude: "",
    longitude: "",
    population: "",
    waterAccessPct: "",
    sanitationAccessPct: "",
    povertyRate: "",
    floodHazardLevel: "",
    infrastructureScore: "",
  });
  const [validationResults, setValidationResults] = useState<{
    validRecords: any[];
    errors: string[];
  }>({ validRecords: [], errors: [] });
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<any>(null);

  // Load registered data sources & import history
  const loadData = async () => {
    try {
      const [sourcesRes, historyRes] = await Promise.all([
        fetch("/api/data-sources"),
        fetch("/api/import"),
      ]);
      if (sourcesRes.ok) {
        const s = await sourcesRes.json();
        setDataSources(s.data || []);
      }
      if (historyRes.ok) {
        const h = await historyRes.json();
        setImportHistory(h.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Preload a ready-to-test CSV template (India - Tamil Nadu)
  const loadSampleCSV = () => {
    const sampleCSV = `gram_panchayat,district,block,latitude,longitude,census_2011_population,jjm_tap_water_coverage_pct,sbm_sanitation_coverage_pct,nfhs_deprivation_pct,cwc_flood_hazard_level,twad_infrastructure_score
Mandapam North Habitation,Ramanathapuram,Mandapam,9.2810,79.1290,18500,32.5,48.0,54.2,Severe,38.0
Kilakarai Coastal Habitation,Ramanathapuram,Kilakarai,9.2312,78.7842,28400,29.0,42.0,61.5,High,34.0
Parangipettai Estuary Village,Cuddalore,Parangipettai,11.4982,79.7645,32500,41.0,50.0,51.5,Severe,40.0
Vedaranyam Salt Pan Panchayat,Nagapattinam,Vedaranyam,10.3721,79.8512,34200,26.0,41.0,64.0,Severe,28.0`;

    parseCSVContent(sampleCSV, "tamil_nadu_wash_census_jjm_sample.csv");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const parseCSVContent = (text: string, name: string) => {
    setFileName(name);
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = results.meta.fields || [];
          setRawHeaders(headers);
          setRawRows(results.data);

          // Auto-guess mapping
          const initialMap: Record<string, string> = { ...columnMapping };
          headers.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes("name") || lower.includes("community")) initialMap.name = h;
            if (lower.includes("district")) initialMap.district = h;
            if (lower.includes("region")) initialMap.region = h;
            if (lower.includes("lat")) initialMap.latitude = h;
            if (lower.includes("lon") || lower.includes("lng")) initialMap.longitude = h;
            if (lower.includes("pop")) initialMap.population = h;
            if (lower.includes("water")) initialMap.waterAccessPct = h;
            if (lower.includes("san")) initialMap.sanitationAccessPct = h;
            if (lower.includes("pov")) initialMap.povertyRate = h;
            if (lower.includes("flood")) initialMap.floodHazardLevel = h;
            if (lower.includes("infra")) initialMap.infrastructureScore = h;
          });
          setColumnMapping(initialMap);
          setStep(2); // Proceed to column mapping
        }
      },
    });
  };

  // Validate mapped rows
  const handleValidateMapping = () => {
    const valid: any[] = [];
    const errs: string[] = [];

    rawRows.forEach((row, idx) => {
      const name = row[columnMapping.name];
      const lat = parseFloat(row[columnMapping.latitude]);
      const lng = parseFloat(row[columnMapping.longitude]);
      const pop = parseInt(row[columnMapping.population] || "5000", 10);

      if (!name) {
        errs.push(`Row ${idx + 1}: Missing settlement name`);
        return;
      }
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        errs.push(`Row ${idx + 1} (${name}): Invalid GPS coordinates [${row[columnMapping.latitude]}, ${row[columnMapping.longitude]}]`);
        return;
      }

      valid.push({
        name,
        district: row[columnMapping.district] || "General District",
        region: row[columnMapping.region] || "Standard Basin",
        latitude: lat,
        longitude: lng,
        population: isNaN(pop) ? 5000 : pop,
        waterAccessPct: parseFloat(row[columnMapping.waterAccessPct]) || 40,
        sanitationAccessPct: parseFloat(row[columnMapping.sanitationAccessPct]) || 30,
        povertyRate: parseFloat(row[columnMapping.povertyRate]) || 50,
        floodHazardLevel: row[columnMapping.floodHazardLevel] || "Moderate",
        infrastructureScore: parseFloat(row[columnMapping.infrastructureScore]) || 45,
      });
    });

    setValidationResults({ validRecords: valid, errors: errs });
    setStep(3); // Proceed to preview & validation review
  };

  // Submit valid records to database
  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          fileName,
          fileFormat: "CSV",
          records: validationResults.validRecords,
          overwriteExisting: true,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setImportSuccess(json);
        setStep(4);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Import failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600" />
              <span>DATA INTEGRATION & PROVENANCE CENTER</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingest, map, validate, and persist geospatial datasets with auditable provenance and source attribution
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center rounded-lg bg-[#f8fafc] p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("import")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "import"
                  ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              CSV / GeoJSON Import
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "sources"
                  ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Data Source Registry ({dataSources.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === "history"
                  ? "bg-cyan-500/30 text-blue-700 border border-cyan-500/40"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Import Audit Log
            </button>
          </div>
        </div>

        {/* Tab 1: CSV / GeoJSON Import Workflow */}
        {activeTab === "import" && (
          <div className="space-y-6">
            {/* Step Wizard Indicator */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  step === 1
                    ? "bg-cyan-950/80 border-cyan-500 text-blue-700 shadow-lg"
                    : step > 1
                    ? "bg-[#0b1736] border-emerald-500/50 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                1. Select & Upload File
              </div>
              <div
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  step === 2
                    ? "bg-cyan-950/80 border-cyan-500 text-blue-700 shadow-lg"
                    : step > 2
                    ? "bg-[#0b1736] border-emerald-500/50 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                2. Column Mapping
              </div>
              <div
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  step === 3
                    ? "bg-cyan-950/80 border-cyan-500 text-blue-700 shadow-lg"
                    : step > 3
                    ? "bg-[#0b1736] border-emerald-500/50 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                3. Validation & Preview
              </div>
              <div
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  step === 4
                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-700 shadow-lg"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                4. Persistence Complete
              </div>
            </div>

            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="glass-panel rounded-2xl p-8 border border-slate-200 space-y-6 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-blue-600">
                      <Upload className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Upload Environmental or Water Dataset</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports comma-separated CSV files or GeoJSON feature collections with coordinates.
                    </p>
                  </div>

                  {/* Category Selector */}
                  <div className="text-left text-xs space-y-1">
                    <label className="text-slate-500">Dataset Domain Category:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg bg-[#f8fafc] px-3 py-2 text-slate-900 border border-slate-200"
                    >
                      <option value="WATER_ACCESS">Water Supply & Access Coverage</option>
                      <option value="SANITATION">Sanitation & Hygiene Infrastructure</option>
                      <option value="CLIMATE_FLOOD">Hydrological & Flood Hazard Data</option>
                      <option value="SOCIOECONOMIC">Poverty & Socioeconomic Indicators</option>
                      <option value="INFRASTRUCTURE">Physical Water & Sanitation Assets</option>
                    </select>
                  </div>

                  {/* Upload input */}
                  <div className="pt-2">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl cursor-pointer bg-[#081329]/60 hover:bg-[#0c1b38] transition-colors">
                      <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-700">
                        Choose a CSV file or drag here
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">.csv, .geojson up to 50MB</span>
                      <input
                        type="file"
                        accept=".csv,.geojson"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Sample Dataset 1-Click Loader */}
                  <div className="pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={loadSampleCSV}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      Or load ready-to-test Tamil Nadu JJM/SBM sample dataset (4 Gram Panchayats)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 2 && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Map Uploaded Columns to Schema</h3>
                    <p className="text-xs text-slate-500">
                      File: <b className="text-blue-600">{fileName}</b> ({rawRows.length} rows detected)
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {Object.entries({
                    name: "Community / Settlement Name *",
                    district: "District *",
                    region: "Region *",
                    latitude: "Latitude (decimal °N) *",
                    longitude: "Longitude (decimal °E) *",
                    population: "Population *",
                    waterAccessPct: "Water Access Coverage (%)",
                    sanitationAccessPct: "Sanitation Coverage (%)",
                    povertyRate: "Poverty Rate (%)",
                    floodHazardLevel: "Flood Hazard Category",
                    infrastructureScore: "Infrastructure Resilience Score (0-100)",
                  }).map(([fieldKey, fieldLabel]) => (
                    <div
                      key={fieldKey}
                      className="rounded-xl bg-[#091530] p-3 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-slate-700 block">{fieldLabel}</span>
                        <span className="text-[10px] text-slate-500 font-mono">schema: {fieldKey}</span>
                      </div>
                      <select
                        value={columnMapping[fieldKey] || ""}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [fieldKey]: e.target.value })
                        }
                        className="rounded-lg bg-[#f8fafc] px-2.5 py-1.5 text-xs text-blue-700 border border-slate-200 focus:border-cyan-400"
                      >
                        <option value="">-- Ignore / Unmapped --</option>
                        {rawHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded text-xs text-slate-500 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleValidateMapping}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-xs font-bold text-white hover:from-cyan-500 hover:to-teal-500 shadow-lg shadow-cyan-600/20"
                  >
                    <span>Validate & Preview Records</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Validation Review & Preview */}
            {step === 3 && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Validation Report & Preview</h3>
                    <p className="text-xs text-slate-500">
                      Validated: <b className="text-emerald-700">{validationResults.validRecords.length} records</b> ready to import
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Adjust Mapping
                  </button>
                </div>

                {/* Errors display if any */}
                {validationResults.errors.length > 0 && (
                  <div className="rounded-xl bg-red-950/40 p-4 border border-red-500/40 space-y-1 text-xs text-red-300">
                    <span className="font-bold flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationResults.errors.length} validation warnings / skips:</span>
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-400/90 max-h-24 overflow-y-auto">
                      {validationResults.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transformed data preview table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                        <th className="py-2.5 px-3">Community</th>
                        <th className="py-2.5 px-3">District</th>
                        <th className="py-2.5 px-3 text-right">Coordinates</th>
                        <th className="py-2.5 px-3 text-right">Population</th>
                        <th className="py-2.5 px-3 text-right">Water %</th>
                        <th className="py-2.5 px-3 text-right">Sanitation %</th>
                        <th className="py-2.5 px-3 text-center">Flood Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {validationResults.validRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-100/30">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{r.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.district}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                            {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {r.population.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600">
                            {r.waterAccessPct}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                            {r.sanitationAccessPct}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {r.floodHazardLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confirm import button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded text-xs text-slate-500 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || validationResults.validRecords.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {importing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Confirm Import & Persist to Database</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success Message */}
            {step === 4 && (
              <div className="glass-panel rounded-2xl p-8 border border-emerald-500/30 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Dataset Successfully Ingested!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Successfully stored <b>{importSuccess?.validRecords} verified records</b> in the database with complete provenance metadata.
                  Automated vulnerability scoring and analytics have been refreshed.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      setFileName("");
                      setValidationResults({ validRecords: [], errors: [] });
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-700 text-xs font-semibold text-slate-700"
                  >
                    Import Another Dataset
                  </button>
                  <Link
                    href="/communities"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg"
                  >
                    View in Community Intelligence →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Data Source Registry */}
        {activeTab === "sources" && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">External Data Source Registry</h3>
                <p className="text-xs text-slate-500">
                  Approved international monitoring platforms and open data providers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataSources.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-[#091530] p-4 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                      <p className="text-[11px] text-blue-600 font-semibold">{s.organization}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-700 border border-emerald-800">
                      {s.status}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">{s.description}</p>

                  <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <div>
                      <span>Coverage: </span>
                      <b className="text-slate-600">{s.geographicCoverage}</b>
                    </div>
                    <div>
                      <span>Frequency: </span>
                      <b className="text-slate-600">{s.updateFrequency}</b>
                    </div>
                    <div>
                      <span>License: </span>
                      <b className="text-slate-600">{s.license}</b>
                    </div>
                    {s.sourceUrl && (
                      <div>
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Portal Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Import Audit Log */}
        {activeTab === "history" && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Import Audit & Provenance History</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-slate-500 font-mono border-b border-slate-200">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Valid Records</th>
                    <th className="py-2.5 px-3 text-right">Invalid Skips</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {importHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-100/30">
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{h.fileName}</td>
                      <td className="py-2.5 px-3 text-blue-600">{h.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {h.validRecords}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-red-400">
                        {h.invalidRecords}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-700 border border-emerald-800">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
