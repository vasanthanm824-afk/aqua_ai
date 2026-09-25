import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AQUA-LENS — India Water & Sanitation Vulnerability Intelligence System",
  description:
    "India-focused GIS-based Water & Sanitation Vulnerability Intelligence System integrating Census 2011, Jal Jeevan Mission (JJM/WQMIS), Swachh Bharat Mission (SBM-G), IMD rainfall climatology, and Central Water Commission (CWC) flood hazard exposure.",
  keywords: [
    "India WASH Intelligence",
    "Jal Jeevan Mission",
    "Swachh Bharat Mission",
    "Census 2011 India",
    "IMD Rainfall Climatology",
    "Central Water Commission CWC",
    "Tamil Nadu Water Intelligence",
    "GIS Vulnerability Mapping",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#f4f7fb] text-slate-800 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
