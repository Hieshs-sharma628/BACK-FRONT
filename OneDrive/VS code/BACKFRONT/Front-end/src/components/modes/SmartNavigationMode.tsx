import React, { useState } from 'react';
import { RouteOption, Coordinates } from '../../types';
import { PRESET_LOCATIONS } from '../../data/mockData';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  Car,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Radio,
  Eye,
} from 'lucide-react';

interface SmartNavigationModeProps {
  origin: Coordinates;
  setOrigin: (c: Coordinates) => void;
  destination: Coordinates;
  setDestination: (c: Coordinates) => void;
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onStartJourney: () => void;
  onPickOnMap: (type: 'origin' | 'destination') => void;
}

export const SmartNavigationMode: React.FC<SmartNavigationModeProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  routes,
  selectedRouteId,
  onSelectRoute,
  onStartJourney,
  onPickOnMap,
}) => {
  const { t, language } = useLanguage();
  const [showPresets, setShowPresets] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'origin' | 'destination'>('destination');

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleUseGps = (type: 'origin' | 'destination') => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            lat: parseFloat(pos.coords.latitude.toFixed(5)),
            lng: parseFloat(pos.coords.longitude.toFixed(5)),
            name: 'GPS Pinpoint Location',
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
          };
          if (type === 'origin') setOrigin(coords);
          else setDestination(coords);
        },
        () => {
          // fallback to Connaught Place default
          const fallback = PRESET_LOCATIONS[0];
          if (type === 'origin') setOrigin(fallback);
          else setDestination(fallback);
        }
      );
    }
  };

  const getRouteName = (route: RouteOption) => {
    if (language === 'hi') return route.nameHi;
    if (language === 'pa') return route.namePa;
    return route.name;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Origin / Destination Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Origin Input */}
        <div className="relative flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 mr-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {t.currentLocation}
            </label>
            <input
              type="text"
              readOnly
              value={origin.name || origin.address}
              onClick={() => {
                setSearchTarget('origin');
                setShowPresets(true);
              }}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 truncate focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => handleUseGps('origin')}
            title={t.myLocation}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Radio className="w-4 h-4" />
          </button>
        </div>

        {/* Separator / Connector */}
        <div className="flex items-center pl-4 -my-1">
          <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Destination Input */}
        <div className="relative flex items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mr-2.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {t.destination}
            </label>
            <input
              type="text"
              readOnly
              value={destination.name || destination.address}
              onClick={() => {
                setSearchTarget('destination');
                setShowPresets(true);
              }}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 truncate focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => onPickOnMap('destination')}
            title={t.selectOnMap}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md"
          >
            {t.selectOnMap}
          </button>
        </div>

        {/* Quick Presets Toggle Modal */}
        {showPresets && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.popularPresets} (Selecting {searchTarget === 'origin' ? t.currentLocation : t.destination})
              </span>
              <button
                onClick={() => setShowPresets(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {t.close}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {PRESET_LOCATIONS.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (searchTarget === 'origin') setOrigin(loc);
                    else setDestination(loc);
                    setShowPresets(false);
                  }}
                  className="text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-start gap-2 border border-slate-100 dark:border-slate-800"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{loc.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{loc.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Route Comparison Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.compareRoutes} ({routes.length})
        </h3>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Sample data
        </span>
      </div>

      {/* Route Cards */}
      <div className="space-y-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isSafest = route.type === 'safest';

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`rounded-2xl p-4 transition-all cursor-pointer relative border ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-600/10'
                  : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isSafest
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : route.type === 'fastest'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSafest ? t.recommended : route.type === 'fastest' ? t.fastestRoute : t.balancedRoute}
                  </span>
                </div>

                {/* Safety Score Meter */}
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      route.safetyScore === undefined
                        ? 'text-slate-400'
                        : route.safetyScore >= 90
                        ? 'text-emerald-600'
                        : route.safetyScore >= 80
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {route.safetyScore === undefined
                      ? 'Unavailable'
                      : `${route.safetyScore}/100`}
                  </span>
                </div>
              </div>

              {/* Title & ETA */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {getRouteName(route)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {route.summary}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {route.durationMinutes} min
                  </span>
                  <span className="block text-[11px] text-slate-400">{route.distanceKm} km</span>
                </div>
              </div>

              {/* Security & Environmental Factors Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-slate-400">{t.lighting}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {route.lightingPercent === undefined ? 'Unavailable' : `${route.lightingPercent}%`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">{t.policeCheckpoints}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {route.policeCheckpoints === undefined
                      ? 'Unavailable'
                      : `${route.policeCheckpoints} Booths`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">{t.cctvCoverage}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {route.cctvCoveragePercent === undefined
                      ? 'Unavailable'
                      : `${route.cctvCoveragePercent}%`}
                  </span>
                </div>
              </div>

              {/* High Risk Zones Warning if any */}
              {route.highRiskZonesPassed !== undefined &&
                route.highRiskZonesPassed > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Passes through {route.highRiskZonesPassed} caution/hazard zone</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Turn-by-Turn Safety Guidance Drawer Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          <span className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            {t.turnByTurnGuidance} ({activeRoute.steps.length} Steps)
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-90' : ''}`} />
        </button>

        {showSteps && (
          <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {activeRoute.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{step.instruction}</p>
                  <p className="text-[11px] text-slate-400">{step.distance} • {step.duration}</p>
                  {step.safetyNote && (
                    <p
                      className={`text-[11px] mt-0.5 flex items-center gap-1 ${
                        step.isCaution
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {step.isCaution ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {step.safetyNote}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button: Start Safe Journey */}
      <button
        onClick={onStartJourney}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
      >
        <ShieldCheck className="w-5 h-5" />
        <span>{t.startNavigation}</span>
      </button>
    </div>
  );
};
