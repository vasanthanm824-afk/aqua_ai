"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  ExternalLink,
  Droplets,
  AlertTriangle,
  Building,
  CheckCircle,
  HelpCircle,
  Download,
  Info,
  MessageSquareWarning,
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Compass,
} from "lucide-react";
import { VulnerabilityBadge } from "../shared/VulnerabilityBadge";
import { ScoreBreakdownCard } from "../shared/ScoreBreakdownCard";
import {
  WATER_MONITORING_STATIONS,
  WaterMonitoringStation,
  MonitoringStationStatus,
} from "@/lib/monitoring-stations";

interface CommunityMapRecord {
  id: string;
  name: string;
  code: string;
  state?: string;
  district: string;
  block?: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  waterAccessPct: number;
  sanitationAccessPct: number;
  povertyRate: number;
  rainfallAnnualMm: number;
  floodHazardLevel: string;
  infrastructureScore: number;
  compositeVulnerabilityScore: number;
  vulnerabilityCategory: string;
  dataCompletenessPct: number;
  isSampleData: boolean;
  waterPointsCount: number;
  functioningWaterPointsCount: number;
  sanitationFacilitiesCount: number;
}

// Geographic focus centers across India and Tamil Nadu pilot districts
const GEOGRAPHIC_CENTERS: Record<string, [number, number, number]> = {
  INDIA_ALL: [22.0, 79.5, 5], // National view centered on India (Jammu & Kashmir to Tamil Nadu, Gujarat to Assam)
  TAMIL_NADU: [10.8, 78.7, 7], // Pilot zone view
  Ramanathapuram: [9.3639, 78.8395, 10],
  Cuddalore: [11.748, 79.7714, 10],
  Nagapattinam: [10.7672, 79.8423, 10],
  Mayiladuthurai: [11.1075, 79.6524, 10],
  Dharmapuri: [12.1211, 78.1582, 10],
  Tiruvannamalai: [12.2253, 79.0747, 10],
};

export function GISMap({
  initialCommunities = [],
  selectedCommunityId,
  onSelectCommunity,
}: {
  initialCommunities?: CommunityMapRecord[];
  selectedCommunityId?: string | null;
  onSelectCommunity?: (community: CommunityMapRecord | null) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const communitiesLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const complaintsLayerRef = useRef<any>(null);

  const [communities, setCommunities] = useState<CommunityMapRecord[]>(initialCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityMapRecord | null>(null);
  const [selectedStation, setSelectedStation] = useState<WaterMonitoringStation | null>(null);

  // Free, Public OpenStreetMap Styles (Zero API Key Required)
  const [activeTileStyle, setActiveTileStyle] = useState<"standard" | "topo" | "hot">("standard");
  const [activeThematicLayer, setActiveThematicLayer] = useState<
    "vulnerability" | "water" | "sanitation" | "flood" | "infrastructure"
  >("vulnerability");

  const [selectedRegion, setSelectedRegion] = useState<string>("INDIA_ALL");
  const [filterVulnerability, setFilterVulnerability] = useState<string>("ALL");
  const [filterStationStatus, setFilterStationStatus] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  const [showCommunities, setShowCommunities] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showComplaints, setShowComplaints] = useState(true);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapScale, setMapScale] = useState<number>(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileError, setTileError] = useState(false);

  // Fetch complaints for GIS overlay
  useEffect(() => {
    fetch("/api/complaints?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setComplaints(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch communities if not provided
  useEffect(() => {
    if (initialCommunities.length === 0) {
      fetch("/api/communities?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setCommunities(data.data);
          }
        })
        .catch(console.error);
    } else {
      setCommunities(initialCommunities);
    }
  }, [initialCommunities]);

  // Synchronize selected community prop
  useEffect(() => {
    if (selectedCommunityId && communities.length > 0) {
      const match = communities.find((c) => c.id === selectedCommunityId);
      if (match) {
        setSelectedCommunity(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.latitude, match.longitude], 11, {
            duration: 1.5,
          });
        }
      }
    }
  }, [selectedCommunityId, communities]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!outerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      outerWrapperRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Handle region/district focus change
  const handleRegionChange = (regionKey: string) => {
    setSelectedRegion(regionKey);
    if (mapInstanceRef.current && GEOGRAPHIC_CENTERS[regionKey]) {
      const [lat, lng, zoom] = GEOGRAPHIC_CENTERS[regionKey];
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  };

  // Initialize Leaflet Map with Standard OpenStreetMap (Public, No API Key Required)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // National Center of India [lat 22.0, lng 79.5], Zoom Level 5
      const map = L.map(mapContainerRef.current, {
        center: [22.0, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: false,
      });

      // Standard Zoom Controls (Bottom Right)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Public Standard Tile Layer (Zero API Key, Public Cartography)
      const osmStandard = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        subdomains: ["a", "b", "c"],
        maxZoom: 19,
      }).addTo(map);

      osmStandard.on("tileerror", () => {
        setTileError(true);
      });

      osmStandard.on("tileload", () => {
        setTileError(false);
      });

      mapInstanceRef.current = map;
      (map as any)._currentTileLayer = osmStandard;

      // Mouse coordinate and scale HUD updates
      map.on("mousemove", (e: any) => {
        setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      map.on("zoomend", () => {
        setMapScale(map.getZoom());
      });

      // Layer groups for Communities, Stations, and Complaints
      communitiesLayerRef.current = L.layerGroup().addTo(map);
      stationsLayerRef.current = L.layerGroup().addTo(map);
      complaintsLayerRef.current = L.layerGroup().addTo(map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch public tile styles (All 100% Free OpenStreetMap variants, no API key)
  const switchTileStyle = async (style: "standard" | "topo" | "hot") => {
    if (!mapInstanceRef.current) return;
    const L = (await import("leaflet")).default;
    const map = mapInstanceRef.current;

    if ((map as any)._currentTileLayer) {
      map.removeLayer((map as any)._currentTileLayer);
    }

    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

    if (style === "topo") {
      url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      attribution =
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
    } else if (style === "hot") {
      url = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    newLayer.on("tileerror", () => setTileError(true));
    newLayer.on("tileload", () => setTileError(false));

    (map as any)._currentTileLayer = newLayer;
    setActiveTileStyle(style);
  };

  // Color generator for thematic community layers
  const getCommunityStyling = (c: CommunityMapRecord) => {
    let color = "#0284c7";
    let radius = 9;

    if (activeThematicLayer === "vulnerability") {
      const score = c.compositeVulnerabilityScore;
      if (c.dataCompletenessPct < 50) color = "#64748b";
      else if (score >= 80) color = "#ef4444";
      else if (score >= 60) color = "#f97316";
      else if (score >= 40) color = "#eab308";
      else if (score >= 20) color = "#06b6d4";
      else color = "#10b981";
      radius = Math.max(7, Math.min(16, score / 6));
    } else if (activeThematicLayer === "water") {
      const access = c.waterAccessPct;
      if (access < 35) color = "#ef4444";
      else if (access < 50) color = "#f97316";
      else if (access < 70) color = "#eab308";
      else color = "#10b981";
      radius = 10;
    } else if (activeThematicLayer === "sanitation") {
      const san = c.sanitationAccessPct;
      if (san < 30) color = "#ef4444";
      else if (san < 50) color = "#f97316";
      else if (san < 75) color = "#eab308";
      else color = "#10b981";
      radius = 10;
    } else if (activeThematicLayer === "flood") {
      const flood = c.floodHazardLevel;
      if (flood === "Severe") color = "#ef4444";
      else if (flood === "High") color = "#f97316";
      else if (flood === "Moderate") color = "#eab308";
      else color = "#10b981";
      radius = 11;
    } else if (activeThematicLayer === "infrastructure") {
      const score = c.infrastructureScore;
      if (score < 40) color = "#ef4444";
      else if (score < 60) color = "#eab308";
      else color = "#10b981";
      radius = 10;
    }

    return { color, radius };
  };

  // Render Community, Station, and Complaint Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let isMounted = true;

    async function updateAllLayers() {
      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      // 1. Render Communities Layer
      if (communitiesLayerRef.current) {
        communitiesLayerRef.current.clearLayers();
        if (showCommunities) {
          const filteredCommunities = communities.filter((c) => {
            if (
              selectedRegion !== "INDIA_ALL" &&
              selectedRegion !== "TAMIL_NADU" &&
              c.district !== selectedRegion
            ) {
              return false;
            }
            if (filterVulnerability !== "ALL" && c.vulnerabilityCategory !== filterVulnerability) {
              return false;
            }
            if (searchFilter) {
              const q = searchFilter.toLowerCase();
              const match =
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.district && c.district.toLowerCase().includes(q)) ||
                (c.block && c.block.toLowerCase().includes(q)) ||
                (c.state && c.state.toLowerCase().includes(q)) ||
                (c.code && c.code.toLowerCase().includes(q));
              if (!match) return false;
            }
            return true;
          });

          filteredCommunities.forEach((c) => {
            const { color, radius } = getCommunityStyling(c);

            const marker = L.circleMarker([c.latitude, c.longitude], {
              radius,
              fillColor: color,
              color: "#ffffff",
              weight: 2,
              opacity: 0.95,
              fillOpacity: 0.8,
            });

            const popupHtml = `
              <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px 2px;">
                <div style="font-weight: 800; font-size: 14px; color: #0284c7; margin-bottom: 2px;">
                  ${c.name}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                  ${c.block ? `${c.block}, ` : ""}${c.district}, ${c.state || "Tamil Nadu"} (${c.code})
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 8px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; color: #1e293b;">
                  <div>Pop: <b>${c.population.toLocaleString()}</b> <span style="font-size: 9px; color: #64748b;">(2011)</span></div>
                  <div>JJM Tap: <b style="color: #0284c7;">${c.waterAccessPct}%</b></div>
                  <div>SBM San: <b style="color: #0369a1;">${c.sanitationAccessPct}%</b></div>
                  <div>Flood: <b style="color: #d97706;">${c.floodHazardLevel}</b></div>
                </div>
                <div style="font-size: 11px; font-weight: bold; color: ${color}; padding: 4px 6px; background: #ffffff; border-radius: 4px; border: 1px solid #cbd5e1; text-align: center;">
                  Vulnerability Score: ${c.compositeVulnerabilityScore} / 100
                </div>
                <div style="font-size: 9px; color: #b45309; margin-top: 5px; text-align: center;">
                  DATA STATUS: DEMO (Calibrated against public registries)
                </div>
              </div>
            `;

            marker.bindPopup(popupHtml);
            marker.on("click", () => {
              setSelectedCommunity(c);
              setSelectedStation(null);
              if (onSelectCommunity) onSelectCommunity(c);
            });
            marker.addTo(communitiesLayerRef.current);
          });
        }
      }

      // 2. Render Water Monitoring Stations Layer (Requirement 3)
      if (stationsLayerRef.current) {
        stationsLayerRef.current.clearLayers();
        if (showStations) {
          const filteredStations = WATER_MONITORING_STATIONS.filter((s) => {
            if (
              selectedRegion !== "INDIA_ALL" &&
              selectedRegion !== "TAMIL_NADU" &&
              s.district !== selectedRegion
            ) {
              return false;
            }
            if (filterStationStatus !== "ALL" && s.status !== filterStationStatus) {
              return false;
            }
            if (searchFilter) {
              const q = searchFilter.toLowerCase();
              const match =
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.district && s.district.toLowerCase().includes(q)) ||
                (s.code && s.code.toLowerCase().includes(q)) ||
                (s.type && s.type.toLowerCase().includes(q));
              if (!match) return false;
            }
            return true;
          });

          filteredStations.forEach((s) => {
            const isOnline = s.status === "ONLINE";
            const isWarning = s.status === "WARNING";
            const statusColor = isOnline ? "#10b981" : isWarning ? "#f59e0b" : "#ef4444";
            const statusLabel = isOnline ? "ONLINE" : isWarning ? "WARNING" : "OFFLINE";

            // Custom DivIcon marker for water monitoring station
            const stationIcon = L.divIcon({
              className: "custom-station-pin",
              html: `
                <div style="
                  width: 28px;
                  height: 28px;
                  background: #ffffff;
                  border: 3px solid ${statusColor};
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  position: relative;
                ">
                  <div style="
                    width: 10px;
                    height: 10px;
                    background: ${statusColor};
                    border-radius: 50%;
                  "></div>
                  <span style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 7px;
                    height: 7px;
                    background: ${statusColor};
                    border-radius: 50%;
                    border: 1px solid #ffffff;
                  "></span>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14],
            });

            const marker = L.marker([s.latitude, s.longitude], { icon: stationIcon });

            const r = s.readings;
            const popupHtml = `
              <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 250px; padding: 4px 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${s.code}</span>
                  <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${
                    isOnline ? "#dcfce7" : isWarning ? "#fef3c7" : "#fee2e2"
                  }; color: ${isOnline ? "#15803d" : isWarning ? "#b45309" : "#b91c1c"};">
                    ● ${statusLabel}
                  </span>
                </div>
                <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${s.name}</div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                  ${s.type} • ${s.district}, ${s.state}
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-size: 11px;">
                  <div style="font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 10px; text-transform: uppercase;">
                    Telemetry & Quality Readings:
                  </div>
                  ${
                    isOnline || isWarning
                      ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #1e293b;">
                      <div>pH: <b style="color: ${r.phStatus === 'HIGH' ? '#b45309' : '#0f172a'};">${r.ph ?? "N/A"}</b></div>
                      <div>TDS: <b style="color: ${r.tdsStatus === 'CRITICAL' ? '#b91c1c' : r.tdsStatus === 'ELEVATED' ? '#b45309' : '#0f172a'};">${r.tdsPpm ? `${r.tdsPpm} mg/L` : "N/A"}</b></div>
                      <div>Turbidity: <b>${r.turbidityNtu ? `${r.turbidityNtu} NTU` : "N/A"}</b></div>
                      <div>Free Cl: <b>${r.chlorineResidualMgL ? `${r.chlorineResidualMgL} mg/L` : "N/A"}</b></div>
                      <div>Water Depth: <b>${r.waterLevelDepthM ? `${r.waterLevelDepthM} m` : "N/A"}</b></div>
                      <div>Flow Rate: <b>${r.flowRateM3Hr ? `${r.flowRateM3Hr} m³/h` : "N/A"}</b></div>
                      ${r.fluorideMgL ? `<div style="grid-column: span 2; color: #b45309;">Fluoride: <b>${r.fluorideMgL} mg/L</b> (Limit 1.5)</div>` : ""}
                    </div>
                  `
                      : `
                    <div style="color: #dc2626; font-weight: 600; font-size: 11px;">
                      ⚠️ Sensor Array Disconnected — Telemetry Offline
                    </div>
                  `
                  }
                </div>

                ${
                  r.alertRemarks
                    ? `
                  <div style="font-size: 10px; color: #9a3412; background: #fff7ed; border: 1px solid #ffedd5; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
                    <b>Alert:</b> ${r.alertRemarks}
                  </div>
                `
                    : ""
                }

                <div style="font-size: 9px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 4px; display: flex; justify-content: space-between;">
                  <span>Last: ${r.lastTransmission}</span>
                  <span style="font-weight: 600; color: #d97706;">DEMO TELEMETRY</span>
                </div>
              </div>
            `;

            marker.bindPopup(popupHtml);
            marker.on("click", () => {
              setSelectedStation(s);
            });
            marker.addTo(stationsLayerRef.current);
          });
        }
      }

      // 3. Render Citizen Complaints Layer
      if (complaintsLayerRef.current) {
        complaintsLayerRef.current.clearLayers();
        if (showComplaints && complaints.length > 0) {
          complaints.forEach((cp) => {
            if (!cp.latitude || !cp.longitude) return;

            const isCrit = cp.priority === "CRITICAL";
            const isHigh = cp.priority === "HIGH";
            const cpColor = isCrit ? "#dc2626" : isHigh ? "#d97706" : "#0284c7";

            const cpMarker = L.circleMarker([cp.latitude, cp.longitude], {
              radius: isCrit ? 7 : 5,
              fillColor: cpColor,
              color: "#ffffff",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9,
            });

            const cpPopup = `
              <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-weight: bold; color: #0284c7; font-size: 11px;">${cp.complaintNumber}</span>
                  <span style="font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 4px; background: ${
                    isCrit ? "#fee2e2" : "#fef3c7"
                  }; color: ${isCrit ? "#b91c1c" : "#b45309"};">${cp.priority}</span>
                </div>
                <div style="font-weight: bold; font-size: 12px; color: #0f172a; margin-bottom: 3px;">${cp.title}</div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 3px;">Category: <b>${cp.category.replace(
                  "_",
                  " "
                )}</b></div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Location: ${cp.locationName}</div>
                <a href="/complaints/${cp.id}" style="display: block; text-align: center; background: #0284c7; color: #ffffff; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">View Grievance Dossier →</a>
              </div>
            `;

            cpMarker.bindPopup(cpPopup);
            cpMarker.addTo(complaintsLayerRef.current);
          });
        }
      }
    }

    updateAllLayers();

    return () => {
      isMounted = false;
    };
  }, [
    communities,
    complaints,
    showCommunities,
    showStations,
    showComplaints,
    activeThematicLayer,
    selectedRegion,
    filterVulnerability,
    filterStationStatus,
    searchFilter,
  ]);

  // Export GIS records as GeoJSON
  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        ...communities.map((c) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [c.longitude, c.latitude],
          },
          properties: {
            layer: "community",
            id: c.id,
            name: c.name,
            code: c.code,
            state: c.state || "Tamil Nadu",
            district: c.district,
            block: c.block || "Taluk",
            population: c.population,
            waterAccessPct: c.waterAccessPct,
            sanitationAccessPct: c.sanitationAccessPct,
            vulnerabilityScore: c.compositeVulnerabilityScore,
          },
        })),
        ...WATER_MONITORING_STATIONS.map((s) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [s.longitude, s.latitude],
          },
          properties: {
            layer: "monitoring_station",
            id: s.id,
            name: s.name,
            code: s.code,
            type: s.type,
            status: s.status,
            district: s.district,
            state: s.state,
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aqua_lens_india_gis_${new Date().toISOString().split("T")[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onlineStationsCount = WATER_MONITORING_STATIONS.filter((s) => s.status === "ONLINE").length;
  const warningStationsCount = WATER_MONITORING_STATIONS.filter((s) => s.status === "WARNING").length;
  const offlineStationsCount = WATER_MONITORING_STATIONS.filter((s) => s.status === "OFFLINE").length;

  return (
    <div
      ref={outerWrapperRef}
      className={`relative h-full w-full overflow-hidden rounded-xl border border-slate-200/80 bg-[#f8fafc] ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Network / Tile Error Graceful Fallback Notice */}
      {tileError && (
        <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-300 px-4 py-2 text-xs text-amber-900 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <b>Offline Warning:</b> Standard map tiles could not be loaded from OpenStreetMap. Please check internet connection. Vector markers and telemetry data remain fully active.
            </span>
          </div>
          <button
            onClick={() => switchTileStyle(activeTileStyle)}
            className="rounded bg-amber-200 px-2 py-1 text-[11px] font-bold hover:bg-amber-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white/95 p-2 shadow-lg backdrop-blur-md text-xs">
        {/* Region & District Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Compass className="w-3.5 h-3.5 text-cyan-600 ml-1" />
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="rounded bg-white px-2 py-1 text-xs text-slate-800 border border-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="INDIA_ALL">🇮🇳 All India (National View)</option>
            <option value="TAMIL_NADU">Tamil Nadu (Pilot Zone)</option>
            <option value="Ramanathapuram">Ramanathapuram District</option>
            <option value="Cuddalore">Cuddalore District</option>
            <option value="Nagapattinam">Nagapattinam District</option>
            <option value="Mayiladuthurai">Mayiladuthurai District</option>
            <option value="Dharmapuri">Dharmapuri District</option>
            <option value="Tiruvannamalai">Tiruvannamalai District</option>
          </select>
        </div>

        {/* Public Tile Cartography Style */}
        <div className="hidden md:flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => switchTileStyle("standard")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
              activeTileStyle === "standard"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="OpenStreetMap Standard Cartography (Pale blue water, clean roads & cities)"
          >
            Classic OSM
          </button>
          <button
            onClick={() => switchTileStyle("topo")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
              activeTileStyle === "topo"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="OpenTopoMap Terrain & Elevation Contours"
          >
            Topography
          </button>
          <button
            onClick={() => switchTileStyle("hot")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
              activeTileStyle === "hot"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Humanitarian High-Contrast OSM"
          >
            Humanitarian
          </button>
        </div>

        {/* Thematic Analysis Layer */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <select
            value={activeThematicLayer}
            onChange={(e) => setActiveThematicLayer(e.target.value as any)}
            className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 border border-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="vulnerability">Composite Vulnerability</option>
            <option value="water">JJM Tap Water Deficit</option>
            <option value="sanitation">SBM Sanitation Gap</option>
            <option value="flood">Flood Hazard Risk</option>
            <option value="infrastructure">Infrastructure Fragility</option>
          </select>
        </div>

        {/* Toggle Water Monitoring Stations Layer */}
        <button
          onClick={() => setShowStations(!showStations)}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors border ${
            showStations
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
          title="Toggle Water Monitoring Stations"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Stations ({WATER_MONITORING_STATIONS.length})
          </span>
        </button>

        {/* Toggle Citizen Complaints Layer */}
        <button
          onClick={() => setShowComplaints(!showComplaints)}
          className={`hidden sm:flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors border ${
            showComplaints
              ? "bg-amber-50 text-amber-800 border-amber-300 shadow-sm"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
          title="Toggle Citizen Complaints on Map"
        >
          <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
          <span>Complaints ({complaints.length})</span>
        </button>

        {/* Search Input */}
        <div className="relative hidden xl:block border-l border-slate-200 pl-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search village/station..."
            className="w-36 rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 text-[11px] text-slate-700 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Export GeoJSON */}
        <button
          onClick={exportGeoJSON}
          className="hidden sm:flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 text-[11px] text-slate-700 transition-colors"
          title="Export GeoJSON"
        >
          <Download className="w-3.5 h-3.5 text-cyan-600" />
          <span>GeoJSON</span>
        </button>
      </div>

      {/* Floating Compact Status & Attribution Badge (Top Right) */}
      <div className="absolute top-3 right-3 z-20 hidden lg:flex items-center gap-2 rounded-lg bg-white/90 border border-slate-300 px-3 py-1 text-[11px] text-slate-700 shadow-sm backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="font-semibold text-slate-800">OpenStreetMap India</span>
        <span className="text-slate-500">•</span>
        <span className="font-mono text-[10px] text-slate-500">NO API KEY REQUIRED</span>
      </div>

      {/* Coordinate & Scale HUD (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-slate-300 bg-white/90 px-3 py-1 font-mono text-[11px] text-slate-600 shadow-sm backdrop-blur-md flex items-center gap-3">
        <div>
          <span>Lat: </span>
          <span className="text-cyan-700 font-bold">
            {mouseCoords ? mouseCoords.lat.toFixed(4) : "22.0000"}° N
          </span>
          <span className="ml-2">Lng: </span>
          <span className="text-cyan-700 font-bold">
            {mouseCoords ? mouseCoords.lng.toFixed(4) : "79.5000"}° E
          </span>
        </div>
        <div className="border-l border-slate-300 pl-2">
          <span>Zoom: </span>
          <span className="text-slate-900 font-bold">{mapScale}</span>
        </div>
      </div>

      {/* Combined Dual Legend (Bottom Right, above Zoom buttons) */}
      <div className="absolute bottom-16 right-3 z-20 max-w-xs rounded-xl border border-slate-300 bg-white/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-2.5">
        {/* Monitoring Station Legend */}
        <div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5 border-b border-slate-200 pb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-600" />
            <span>Water Monitoring Stations</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-medium">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-1 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Online ({onlineStationsCount})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-1.5 py-1 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Warning ({warningStationsCount})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-1.5 py-1 text-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Offline ({offlineStationsCount})</span>
            </div>
          </div>
        </div>

        {/* Thematic Vulnerability Legend */}
        {showCommunities && (
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 border-b border-slate-200 pb-1">
              <Info className="w-3.5 h-3.5 text-cyan-600" />
              <span>Vulnerability Severity</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span>Very High (80-100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <span>High (60-79)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Moderate (40-59)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Low / Safe (0-39)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Out Community Profile Drawer */}
      {selectedCommunity && (
        <div className="absolute top-3 right-3 bottom-3 z-30 w-96 rounded-2xl border border-slate-300 bg-white/95 p-5 shadow-2xl backdrop-blur-xl overflow-y-auto space-y-4 animate-in slide-in-from-right duration-200 text-slate-800">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-wide">
                {selectedCommunity.name}
              </h3>
              <p className="text-xs text-slate-500">
                Block: {selectedCommunity.block || "Taluk"}, {selectedCommunity.district},{" "}
                {selectedCommunity.state || "Tamil Nadu"}
              </p>
              <span className="text-[10px] font-mono text-cyan-700">
                Census ID: {selectedCommunity.code}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCommunity(null);
                if (onSelectCommunity) onSelectCommunity(null);
              }}
              className="text-slate-500 hover:text-slate-700 p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] text-slate-500 block">Census Population</span>
              <span className="text-lg font-black font-mono text-slate-900">
                {selectedCommunity.population.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] text-slate-500 block">Vulnerability Score</span>
              <span className="text-lg font-black font-mono text-cyan-700">
                {selectedCommunity.compositeVulnerabilityScore} / 100
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500">JJM FHTC Tap Water:</span>
              <span className="font-bold text-cyan-700">{selectedCommunity.waterAccessPct}%</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500">SBM Sanitation Access:</span>
              <span className="font-bold text-slate-800">{selectedCommunity.sanitationAccessPct}%</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500">Flood Hazard Exposure:</span>
              <span className="font-bold text-amber-700">{selectedCommunity.floodHazardLevel}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500">Annual IMD Climatology:</span>
              <span className="font-mono text-slate-700">{selectedCommunity.rainfallAnnualMm} mm</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/communities/${selectedCommunity.id}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
            >
              <span>Open Settlement Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
