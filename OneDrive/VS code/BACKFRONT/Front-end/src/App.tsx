/**
 * SAJAG - Complete Smart Navigation & Safety Platform
 * Design: "Vigilant Clarity" (Google Stitch Approved Specification)
 */

import React, { useEffect, useState } from 'react';
import { NavigationMode, Coordinates, RouteOption, SafeLocation, RiskZone } from './types';
import { PRESET_LOCATIONS, MOCK_ROUTES } from './data/mockData';
import { apiClient, Village } from './services/api/apiClient';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { SajagMap } from './components/map/SajagMap';
import { SmartNavigationMode } from './components/modes/SmartNavigationMode';
import { SafeJourneyMode } from './components/modes/SafeJourneyMode';
import { RiskAwarenessMode } from './components/modes/RiskAwarenessMode';
import { LiveMonitoringMode } from './components/modes/LiveMonitoringMode';
import { EmergencyMode } from './components/modes/EmergencyMode';
import { FloatingActionHud } from './components/layout/FloatingActionHud';
import { ProfileModal } from './components/modals/ProfileModal';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const SOS_VILLAGE_RADIUS_KM = 50;

function distanceBetweenKm(
  first: Coordinates,
  second: { latitude: number; longitude: number }
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.lat);
  const longitudeDelta = radians(second.longitude - first.lng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first.lat)) *
      Math.cos(radians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestVillage(location: Coordinates, villages: Village[]): Village | null {
  const nearest = villages
    .flatMap((village) => {
      if (village.latitude === null || village.longitude === null) return [];
      return [{
        village,
        distance: distanceBetweenKm(location, {
          latitude: village.latitude,
          longitude: village.longitude,
        }),
      }];
    })
    .sort((left, right) => left.distance - right.distance)[0];

  return nearest && nearest.distance <= SOS_VILLAGE_RADIUS_KM
    ? nearest.village
    : null;
}

function SajagMainApp() {
  const { t } = useLanguage();

  // Core Application State
  const [activeMode, setActiveMode] = useState<NavigationMode>('smart-navigation');
  const [origin, setOrigin] = useState<Coordinates>(PRESET_LOCATIONS[0]); // Connaught Place
  const [destination, setDestination] = useState<Coordinates>(PRESET_LOCATIONS[1]); // Cyber Hub
  const [routes, setRoutes] = useState<RouteOption[]>(MOCK_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-safest');
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Map Picking & Live Tracking
  const [isPickingLocation, setIsPickingLocation] = useState<'origin' | 'destination' | null>(null);
  const [userSimulatedPosition, setUserSimulatedPosition] = useState<[number, number] | null>(null);

  // Modals & Notifications
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hudToast, setHudToast] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const selectedVillage = findNearestVillage(origin, villages);

  useEffect(() => {
    let cancelled = false;
    void apiClient.getVillages().then(
      (items) => {
        if (!cancelled) setVillages(items);
      },
      (error: unknown) => {
        if (!cancelled) {
          setVillages([]);
          setToastIsError(true);
          setHudToast(
            `Village catalog unavailable: ${
              error instanceof Error ? error.message : 'The request failed.'
            }`
          );
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([
      apiClient.getFloodZones(origin),
      apiClient.getSafeLocations(origin),
    ]).then(([zonesResult, locationsResult]) => {
      if (cancelled) return;

      const failures: string[] = [];
      if (zonesResult.status === 'fulfilled') {
        setRiskZones(zonesResult.value);
      } else {
        setRiskZones([]);
        failures.push(zonesResult.reason instanceof Error
          ? zonesResult.reason.message
          : 'Flood zones could not be loaded.');
      }

      if (locationsResult.status === 'fulfilled') {
        setSafeLocations(locationsResult.value);
      } else {
        setSafeLocations([]);
        failures.push(locationsResult.reason instanceof Error
          ? locationsResult.reason.message
          : 'Shelters and assistance points could not be loaded.');
      }

      if (failures.length > 0) {
        setToastIsError(true);
        setHudToast(`Backend data unavailable: ${failures.join(' ')}`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [origin]);

  const handleSubmitSOS = async () => {
    if (!navigator.geolocation) {
      throw new Error('Location services are not available in this browser.');
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => reject(new Error(error.message)),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
    const userLocation: Coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    const nearestVillage = findNearestVillage(userLocation, villages);

    if (!nearestVillage) {
      throw new Error(
        `No configured village is within ${SOS_VILLAGE_RADIUS_KM} km of your location.`
      );
    }

    return apiClient.submitSOS({
      village_id: nearestVillage.id,
      emergency_type: 'other',
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      description: 'Emergency SOS submitted from the SAJAG application.',
    });
  };

  const handleLocationPicked = (type: 'origin' | 'destination', coords: Coordinates) => {
    if (type === 'origin') {
      setOrigin(coords);
    } else {
      setDestination(coords);
    }
    setIsPickingLocation(null);
  };

  const handleStartSafeJourney = () => {
    setActiveMode('safe-journey');
    setUserSimulatedPosition(activeRoute.path[0]);
  };

  const handleEndJourney = () => {
    setUserSimulatedPosition(null);
    setActiveMode('smart-navigation');
  };

  const handleQuickReroute = () => {
    // Cycles between available routes
    const currentIndex = routes.findIndex((r) => r.id === selectedRouteId);
    const nextRoute = routes[(currentIndex + 1) % routes.length];
    setSelectedRouteId(nextRoute.id);
    setToastIsError(false);
    setHudToast(`Rerouted to: ${nextRoute.name}`);
    setTimeout(() => setHudToast(null), 3000);
  };

  const handlePingSafeHaven = () => {
    setToastIsError(true);
    setHudToast('Safe-point check-ins are not connected to backend sign-in.');
    setTimeout(() => setHudToast(null), 3500);
  };

  const handleRerouteToSafeHaven = (haven: SafeLocation) => {
    setDestination({
      lat: haven.lat,
      lng: haven.lng,
      name: haven.name,
      address: haven.address,
    });
    setActiveMode('smart-navigation');
    setToastIsError(true);
    setHudToast(`Selected ${haven.name}; route evaluation is not connected.`);
    setTimeout(() => setHudToast(null), 4000);
  };

  const handleFocusRiskZone = (zone: RiskZone) => {
    setToastIsError(false);
    setHudToast(`Inspecting hazard: ${zone.title}`);
    setTimeout(() => setHudToast(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8FF] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <Header
        activeMode={activeMode}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          if (mode !== 'safe-journey') {
            setUserSimulatedPosition(null);
          }
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Split Layout: 12-Column Responsive Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-24 lg:pb-16">
        {/* Left Side Rail: Situational Awareness Feed & Active Mode Panel (4 Cols on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col order-2 lg:order-1 min-w-0">
          {/* Mode Subtitle description */}
          <div className="mb-3 px-1">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
              {t.modes[activeMode]}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.modeSubtitles[activeMode]}
            </p>
          </div>

          {/* Dynamic Operating Mode Container */}
          <div className="flex-1">
            {activeMode === 'smart-navigation' && (
              <SmartNavigationMode
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                onStartJourney={handleStartSafeJourney}
                onPickOnMap={(target) => setIsPickingLocation(target)}
              />
            )}

            {activeMode === 'safe-journey' && (
              <SafeJourneyMode
                route={activeRoute}
                safeLocations={safeLocations}
                onSimulatePositionChange={setUserSimulatedPosition}
                onEndJourney={handleEndJourney}
              />
            )}

            {activeMode === 'risk-awareness' && (
              <RiskAwarenessMode
                riskZones={riskZones}
                onFocusRiskZone={handleFocusRiskZone}
              />
            )}

            {activeMode === 'live-monitoring' && (
              <LiveMonitoringMode villageId={selectedVillage?.id ?? null} />
            )}

            {activeMode === 'emergency' && (
              <EmergencyMode
                safeLocations={safeLocations}
                onRerouteToNearestSafeHaven={handleRerouteToSafeHaven}
                onSubmitSOS={handleSubmitSOS}
              />
            )}
          </div>
        </div>

        {/* Right Side: Primary Leaflet Map Canvas (7-8 Cols on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-2 h-[420px] sm:h-[500px] lg:h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <SajagMap
            origin={origin}
            destination={destination}
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            safeLocations={safeLocations}
            riskZones={riskZones}
            isPickingLocation={isPickingLocation}
            onLocationPicked={handleLocationPicked}
            userSimulatedPosition={userSimulatedPosition}
            activeMode={activeMode}
          />
        </div>
      </main>

      {/* Floating Action HUD (Stitch Design Specification) */}
      {activeMode !== 'emergency' && (
        <FloatingActionHud
          activeRoute={activeRoute}
          onQuickReroute={handleQuickReroute}
          onPingSafeHaven={handlePingSafeHaven}
          onOpenEmergency={() => setActiveMode('emergency')}
        />
      )}

      {/* Ephemeral HUD Toast Feedback */}
      {hudToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in backdrop-blur-md ${
          toastIsError
            ? 'bg-red-900/90 text-white'
            : 'bg-slate-900/90 text-white dark:bg-white dark:text-slate-900'
        }`}>
          {toastIsError
            ? <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />}
          <span>{hudToast}</span>
        </div>
      )}

      {/* User Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SajagMainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
