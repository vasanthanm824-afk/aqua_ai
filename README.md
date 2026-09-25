# AQUA-LENS — Global Water & Sanitation Vulnerability Intelligence System

> **"See Vulnerability. Predict Risk. Prioritize Action."**

AQUA-LENS is a production-oriented, full-stack GIS water and sanitation intelligence web application designed for environmental analysts, humanitarian response teams, water authorities, and municipal policymakers. It integrates demographic records, drinking water accessibility, sanitation coverage, CHIRPS precipitation climatology, Copernicus GloFAS flood hazard grids, poverty indices, and physical infrastructure health into a unified, explainable vulnerability matrix.

---

## 1. System Architecture & Tech Stack

AQUA-LENS is built as **one single integrated Next.js application** (App Router) containing all frontend interfaces, GIS cartography, server APIs, explainable scoring engines, and relational database persistence.

* **Framework:** Next.js (App Router, Turbopack, TypeScript, React)
* **Styling & Theme:** Vanilla CSS / Tailwind CSS — Dark Navy Command Center (`#050b18`, `#0a1329`) with vibrant Cyan (`#00f2fe`), Teal, Amber, and Red indicators.
* **Geospatial GIS Engine:** Interactive Leaflet GIS with CartoDB Dark Matter, Positron, and ESRI World Imagery satellite basemaps.
* **Database & ORM:** Prisma ORM with dual-engine flexibility:
  * **Local Development (Default):** Zero-friction SQLite (`file:./dev.db`) requiring no external docker or cloud setup.
  * **Production Deployment:** Managed PostgreSQL via Supabase (`postgresql://...`).
* **Analytical Scoring:** Deterministic, transparent, multi-criteria weighted scoring engine with dynamic factor normalization and missing-data thresholding.
* **AI Analysis:** Hybrid intelligence architecture — integrates OpenAI API when configured, with an autonomous rule-based evidence synthesis engine when unconfigured.
* **Testing:** Automated unit and integration test suite (`tests/core-engine.test.ts`).

---

## 2. Main Application Modules

1. **Command Center (`/`):** Operational dashboard with 10 real-time indicators, regional water/sanitation bar charts, vulnerability category distribution, and risk factor contribution bars.
2. **Global Vulnerability Map (`/map`):** Interactive GIS map with coordinate tracking HUD, basemap toggles (Dark Matter / Satellite / Positron), thematic layers (Vulnerability, Water, Sanitation, Flood Hazard, Infrastructure), vector markers, and community slide-out profile panels.
3. **Community Intelligence (`/communities`):** Searchable, filterable settlement directory with dynamic vulnerability badges and registration modal.
4. **Community Profile (`/communities/[id]`):** Deep-dive profile detailing Sections A through H:
   * Basic Geography & Demographics
   * Water Access & Unserved Populations
   * Sanitation & Hygiene Infrastructure
   * Socioeconomic Deprivation Indices
   * Climate Hazard & Annual Precipitation
   * Infrastructure Condition & Active Asset Audits
   * Explainable Score Breakdown ("How was this calculated?")
   * AI-Assisted Intelligence Synthesis & Action Plan
5. **Data Integration Center (`/import`):** Complete CSV & GeoJSON import pipeline with column mapping, real-time schema validation, duplicate detection, and provenance tracking. Includes external Data Source Registry (WHO/UNICEF JMP, World Bank, CHIRPS, GloFAS).
6. **Risk Assessment Engine (`/risk-assessment`):** Policy configuration interface with interactive dimension weight sliders (Water, Sanitation, Socioeconomic, Climate, Infrastructure) and live recalculation test workbench.
7. **Climate & Flood Monitor (`/climate-flood`):** Climatological rainfall comparison charts, flood hazard overlap registry, and automated early-warning exposure rules.
8. **Intervention Action Planner (`/interventions`):** Multi-stage Kanban board and data table tracking intervention lifecycles (`IDENTIFIED` → `AWAITING_VERIFICATION` → `PLANNED` → `APPROVED` → `IN_PROGRESS` → `COMPLETED` → `VERIFIED` → `CLOSED`).
9. **Resource Allocation Simulator (`/simulator`):** Interactive capital expenditure planning simulator with live budget utilization HUD, unit cost configurations, and projected population reach.
10. **Field Verification (`/field-verification`):** Mobile/tablet-optimized interface for field officers to record on-ground water/sanitation observations, GPS coordinates, and inspection findings.
11. **Reports & Exports (`/reports`):** Standardized, auditable report generator with live data tables, printable PDF layouts, and CSV export streams.
12. **Alerts & Monitoring (`/alerts`):** Centralized notification center with severity filtering, acknowledgment, and resolution workflows.
13. **Administration (`/admin`):** Role-based access control (RBAC) permission matrix and security audit log.
14. **Platform Settings (`/settings`):** System topology status, database modes, and sample baseline data purge controls.

---

## 3. Quick Start & Local Setup

### Prerequisites
* Node.js v18 or higher (v24 recommended)
* npm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database & Generate Prisma Client
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Seed Baseline Pilot Basin Records
```bash
npm run db:seed
```

### Step 4: Run Automated Tests
```bash
npm test
```
All 11 automated unit and integration tests will execute and pass against the core scoring, normalization, RBAC, and recommendation engines.

### Step 5: Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. Pre-Configured Operator Accounts

The database seed initializes 4 demo user profiles with distinct role permissions. You can switch between them using the role switcher in the sidebar:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@aqualens.org` | `AquaAdmin2026!` | Full administrative control, user governance, scoring policy configuration, data import, intervention management. |
| **Analyst** | `sarah.chen@aqualens.org` | `Analyst2026!` | Dataset import, community assessment, scenario simulations, report generation. |
| **Field Officer** | `kwame.mensah@aqualens.org` | `FieldOfficer2026!` | On-ground field verifications, GPS sensor audits, intervention progress updates. |
| **Viewer** | `viewer@aqualens.org` | `Viewer2026!` | Read-only access to GIS maps, analytics dashboards, and official reports. |

---

## 5. Environment Variables & Cloud Deployment

Refer to `.env.example` for the complete list of environment variables:

```env
# Local Development (Zero-Config SQLite)
DATABASE_URL="file:./dev.db"

# Production PostgreSQL / Supabase
# DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth Secrets
JWT_SECRET="aqua-lens-super-secure-intelligence-system-key-2026"

# Optional OpenAI Integration (App works 100% autonomously without it)
OPENAI_API_KEY=""
```

### Deploying to Vercel with Supabase:
1. Create a PostgreSQL project on [Supabase](https://supabase.com).
2. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push database schema to Supabase: `npx prisma db push && npm run db:seed`
4. Deploy the repository directly to [Vercel](https://vercel.com) and configure `DATABASE_URL` and `JWT_SECRET` in Vercel project settings.

---

## 6. Verification and Quality Assurance

* **Production Build:** Passes cleanly (`npm run build`) across all 33 static and dynamic routes.
* **Unit & Integration Tests:** 11/11 tests passing (`npm test`).
* **Data Provenance:** Every imported record retains file name, collection timestamp, user identity, and source licensing.
* **Sample Data Isolation:** Sample baseline records (`isSampleData: true`) can be safely purged from the Settings page without deleting user-imported records.
#   a q u a _ a i  
 