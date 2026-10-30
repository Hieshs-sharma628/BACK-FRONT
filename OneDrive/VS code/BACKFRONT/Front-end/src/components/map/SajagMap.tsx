import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RouteOption, SafeLocation, RiskZone, Coordinates } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShieldCheck, AlertTriangle, Cross, Fuel, MapPin, Eye, Layers } from 'lucide-react';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

interface SajagMapProps {
  origin: Coordinates;
  destination: Coordinates;
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  safeLocations: SafeLocation[];
  riskZones: RiskZone[];
  isPickingLocation?: 'origin' | 'destination' | null;
  onLocationPicked?: (type: 'origin' | 'destination', coords: Coordinates) => void;
  userSimulatedPosition?: [number, number] | null;
  activeMode: string;
}

export const SajagMap: React.FC<SajagMapProps> = ({
  origin,
  destination,
  routes,
  selectedRouteId,
  onSelectRoute,
  safeLocations,
  riskZones,
  isPickingLocation,
  onLocationPicked,
  userSimulatedPosition,
  activeMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [showSafeHavens, setShowSafeHavens] = useState(true);
  const [mapTileStyle, setMapTileStyle] = useState<'standard' | 'contrast'>('standard');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = [28.565, 77.155]; // NCR Corridor center
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false, // We render custom ergonomic zoom controls
      attributionControl: true,
    });

    L.control.attribution({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Handle map click for picking locations
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      if (isPickingLocation && onLocationPicked) {
        onLocationPicked(isPickingLocation, {
          lat,
          lng,
          name: `${isPickingLocation === 'origin' ? 'Custom Start' : 'Custom Destination'} (${lat}, ${lng})`,
          address: `Pinned Location [${lat}, ${lng}]`,
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layers when theme or mapTileStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const isDark = theme === 'dark' || mapTileStyle === 'contrast';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDark
      ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [theme, mapTileStyle]);

  // Re-render markers, polylines, zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Risk Zones (Clean semi-transparent vector circles with zero black artifacts)
    if (showRiskOverlay) {
      riskZones.forEach((zone) => {
        const color =
          zone.severity === 'high' || zone.severity === 'critical'
            ? '#DC2626'
            : zone.severity === 'moderate'
            ? '#D97706'
            : '#2563EB';

        const zoneShape = zone.coordinates
          ? L.polygon(zone.coordinates, {
              color: color,
              weight: 2,
              opacity: 0.85,
              dashArray: zone.severity === 'high' || zone.severity === 'critical'
                ? '4, 6'
                : undefined,
              fillColor: color,
              fillOpacity: 0.18,
            })
          : zone.radiusMeters
          ? L.circle(zone.center, {
              color: color,
              weight: 2,
              opacity: 0.85,
              dashArray: zone.severity === 'high' || zone.severity === 'critical'
                ? '4, 6'
                : undefined,
              fillColor: color,
              fillOpacity: 0.18,
              radius: zone.radiusMeters,
            })
          : L.circleMarker(zone.center, {
              color: color,
              weight: 2,
              opacity: 0.85,
              fillColor: color,
              fillOpacity: 0.5,
              radius: 8,
            });

        const zoneTitle = language === 'hi' ? zone.titleHi : language === 'pa' ? zone.titlePa : zone.title;
        const zoneDesc = language === 'hi' ? zone.descriptionHi : language === 'pa' ? zone.descriptionPa : zone.description;

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; min-width: 200px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: ${color};"></span>
              <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px;">${escapeHtml(zone.category.replace('_', ' '))} • ${escapeHtml(zone.severity)}</span>
            </div>
            <h4 style="font-weight: 600; font-size: 13px; color: #0F172A; margin: 0 0 4px 0;">${escapeHtml(zoneTitle)}</h4>
            <p style="font-size: 12px; color: #475569; margin: 0 0 6px 0; line-height: 1.4;">${escapeHtml(zoneDesc)}</p>
            <div style="font-size: 11px; color: #64748B;">Reported: ${escapeHtml(zone.reportedTime)} • Status: ${escapeHtml(zone.activeStatus)}</div>
          </div>
        `;

        zoneShape.bindPopup(popupContent);
        layerGroup.addLayer(zoneShape);
      });
    }

    // 2. Render Route Polylines
    const allRoutePoints: [number, number][] = [];

    // Render unselected routes first (underneath)
    routes.forEach((route) => {
      if (route.id === selectedRouteId) return;

      const polyline = L.polyline(route.path, {
        color: theme === 'dark' ? '#64748B' : '#94A3B8',
        weight: 4,
        opacity: 0.65,
        dashArray: '6, 8',
      });

      polyline.on('click', () => onSelectRoute(route.id));
      polyline.bindTooltip(
        `<span style="font-weight: 600; font-size: 11px;">${escapeHtml(route.name)} (${route.durationMinutes}m)</span>`,
        { sticky: true }
      );
      layerGroup.addLayer(polyline);
      allRoutePoints.push(...route.path);
    });

    // Render selected route on top with vibrant Royal Blue & glowing underlay
    const activeRoute = routes.find((r) => r.id === selectedRouteId);
    if (activeRoute) {
      // Ambient glow underlay
      const glowLine = L.polyline(activeRoute.path, {
        color: '#2563EB',
        weight: 10,
        opacity: 0.22,
      });
      layerGroup.addLayer(glowLine);

      // Primary crisp route line
      const activeLine = L.polyline(activeRoute.path, {
        color: '#2563EB',
        weight: 5.5,
        opacity: 0.98,
      });

      activeLine.bindTooltip(
        `<div style="font-weight: 700; font-size: 12px; color: #1D4ED8;">${escapeHtml(activeRoute.name)}</div>`,
        { sticky: true }
      );
      layerGroup.addLayer(activeLine);
      allRoutePoints.push(...activeRoute.path);
    }

    // 3. Render Safe Locations (Shield / Police / Hospital pins)
    if (showSafeHavens) {
      safeLocations.forEach((loc) => {
        let badgeColor = '#059669'; // Emerald for verified safe
        let iconHtml = '🛡️';

        if (loc.category === 'police') {
          badgeColor = '#004AC6';
          iconHtml = '👮';
        } else if (loc.category === 'hospital') {
          badgeColor = '#DC2626';
          iconHtml = '🏥';
        } else if (loc.category === 'fuel_station') {
          badgeColor = '#D97706';
          iconHtml = '⛽';
        } else if (loc.category === 'women_desk') {
          badgeColor = '#7C3AED';
          iconHtml = '🌸';
        }

        const safeMarkerHtml = `
          <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #FFFFFF; border: 2px solid ${badgeColor}; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15); font-size: 15px; cursor: pointer;">
            ${iconHtml}
          </div>
        `;

        const customIcon = L.divIcon({
          html: safeMarkerHtml,
          className: 'custom-safe-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
        const locName = language === 'hi' ? loc.nameHi : language === 'pa' ? loc.namePa : loc.name;

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">
                ${loc.verified ? 'VERIFIED' : 'VERIFICATION UNAVAILABLE'}
              </span>
              <span style="font-size: 11px; color: #64748B;">${loc.open24x7 === true ? '24/7 OPEN' : 'HOURS NOT LISTED'}</span>
            </div>
            <h4 style="font-weight: 600; font-size: 13px; color: #0F172A; margin: 0 0 4px 0;">${escapeHtml(locName)}</h4>
            <p style="font-size: 12px; color: #475569; margin: 0 0 8px 0;">${escapeHtml(loc.address)}</p>
            ${loc.phone
              ? `<a href="tel:${encodeURIComponent(loc.phone)}" style="display: block; text-align: center; background: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px;">📞 ${escapeHtml(loc.phone)}</a>`
              : '<span style="font-size: 11px; color: #64748B;">Phone not listed</span>'}
          </div>
        `;

        marker.bindPopup(popupContent);
        layerGroup.addLayer(marker);
      });
    }

    // 4. Origin Marker (Start)
    const originIconHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); color: #FFFFFF; font-weight: 800; font-size: 12px;">
        A
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; border: 2px solid rgba(37, 99, 235, 0.4); animation: pulse-ring 2s infinite;"></div>
      </div>
    `;
    const originIcon = L.divIcon({
      html: originIconHtml,
      className: 'origin-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon });
    originMarker.bindTooltip(
      `<span style="font-weight: 700; font-size: 12px; color: #2563EB;">START: ${escapeHtml(origin.name || 'Origin')}</span>`,
      { permanent: false, direction: 'top' }
    );
    layerGroup.addLayer(originMarker);

    // 5. Destination Marker (Finish)
    const destIconHtml = `
      <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #059669; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.4); color: #FFFFFF; font-weight: 800; font-size: 13px;">
        B
      </div>
    `;
    const destIcon = L.divIcon({
      html: destIconHtml,
      className: 'dest-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon });
    destMarker.bindTooltip(
      `<span style="font-weight: 700; font-size: 12px; color: #059669;">DESTINATION: ${escapeHtml(destination.name || 'End Point')}</span>`,
      { permanent: false, direction: 'top' }
    );
    layerGroup.addLayer(destMarker);

    // 6. User Simulated Position (Vehicle / Pedestrian in transit)
    if (userSimulatedPosition) {
      const carIconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #0F172A; border: 2.5px solid #38BDF8; border-radius: 9999px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.7); color: #38BDF8; font-size: 16px;">
          🚗
          <div style="position: absolute; inset: -6px; border-radius: 9999px; border: 1.5px dashed #38BDF8; animation: spin 8s linear infinite;"></div>
        </div>
      `;
      const carIcon = L.divIcon({
        html: carIconHtml,
        className: 'simulated-car-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const carMarker = L.marker(userSimulatedPosition, { icon: carIcon });
      carMarker.bindTooltip(
        '<span style="font-weight: 700; font-size: 11px; color: #0284C7;">YOU (In Safe Transit)</span>',
        { permanent: true, direction: 'right' }
      );
      layerGroup.addLayer(carMarker);
    }

    const contextualPoints: [number, number][] =
      activeMode === 'risk-awareness'
        ? riskZones.flatMap((zone) => zone.coordinates ?? [zone.center])
        : activeMode === 'emergency'
        ? safeLocations.map(
            (location): [number, number] => [location.lat, location.lng]
          )
        : [];

    if (contextualPoints.length > 0) {
      map.fitBounds(L.latLngBounds(contextualPoints), {
        padding: [50, 50],
        maxZoom: 14,
      });
    } else if (allRoutePoints.length > 0) {
      const bounds = L.latLngBounds(allRoutePoints);
      bounds.extend([origin.lat, origin.lng]);
      bounds.extend([destination.lat, destination.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [
    routes,
    selectedRouteId,
    safeLocations,
    riskZones,
    origin,
    destination,
    theme,
    showRiskOverlay,
    showSafeHavens,
    userSimulatedPosition,
    language,
  ]);

  // Recalculate size when container resizes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeMode]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const activeRoute = routes.find((r) => r.id === selectedRouteId);
    if (activeRoute) {
      const bounds = L.latLngBounds(activeRoute.path);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      mapInstanceRef.current.setView([origin.lat, origin.lng], 13);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-100 dark:bg-slate-900 overflow-hidden select-none">
      {/* Pick on Map Banner when active */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg font-medium text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <MapPin className="w-4 h-4" />
          <span>Click anywhere on the map to set {isPickingLocation === 'origin' ? 'Current Location' : 'Destination'}</span>
        </div>
      )}

      {/* Main Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Control Overlay (Top-Right): Layer Toggles */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-1.5 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-xs">
          <button
            onClick={() => setShowRiskOverlay(!showRiskOverlay)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
              showRiskOverlay
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Hazard & Risk Overlay"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Risks & Hazards</span>
          </button>

          <button
            onClick={() => setShowSafeHavens(!showSafeHavens)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
              showSafeHavens
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Safe Havens & Police Stations"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Safe Havens</span>
          </button>

          <button
            onClick={() => setMapTileStyle((prev) => (prev === 'standard' ? 'contrast' : 'standard'))}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Switch Map Tiles (Standard / Contrast Night)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mapTileStyle === 'contrast' ? 'Night View' : 'Standard View'}</span>
          </button>
        </div>
      </div>

      {/* Ergonomic Zoom & Recenter Controls (Bottom-Right) */}
      <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="h-[1px] bg-slate-200 dark:bg-slate-800" />
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          title="Fit full route to view"
          aria-label="Fit Route"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      {/* Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] shadow-sm hidden md:flex items-center gap-4 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-1 bg-blue-600 rounded-full" />
          <span className="font-medium">Safest Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-1 bg-slate-400 rounded-full" />
          <span>Alternate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Safe Haven</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Risk Zone</span>
        </div>
      </div>
    </div>
  );
};
