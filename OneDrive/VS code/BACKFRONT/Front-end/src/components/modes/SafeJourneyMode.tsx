import React, { useState, useEffect } from 'react';
import { RouteOption, SafeLocation, EmergencyContact } from '../../types';
import { DEFAULT_EMERGENCY_CONTACTS } from '../../data/mockData';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Share2,
  CheckCircle,
  Phone,
  Clock,
  Compass,
  AlertCircle,
  MapPin,
  ExternalLink,
  Users,
  Copy,
  Check,
} from 'lucide-react';

interface SafeJourneyModeProps {
  route: RouteOption;
  safeLocations: SafeLocation[];
  onSimulatePositionChange: (pos: [number, number] | null) => void;
  onEndJourney: () => void;
}

export const SafeJourneyMode: React.FC<SafeJourneyModeProps> = ({
  route,
  safeLocations,
  onSimulatePositionChange,
  onEndJourney,
}) => {
  const { t, language } = useLanguage();

  const [journeyStatus, setJourneyStatus] = useState<'idle' | 'active' | 'paused' | 'completed'>('active');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(48);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_EMERGENCY_CONTACTS);
  const [checkedInMessage, setCheckedInMessage] = useState<string | null>(null);

  // Simulated GPS movement along the path
  useEffect(() => {
    let interval: any = null;
    if (journeyStatus === 'active') {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= route.path.length) {
            setJourneyStatus('completed');
            onSimulatePositionChange(route.path[route.path.length - 1]);
            return prev;
          }
          // Slight speed variation
          setSpeedKmh(Math.floor(42 + Math.random() * 12));
          onSimulatePositionChange(route.path[nextIndex]);
          return nextIndex;
        });
      }, 3500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [journeyStatus, route.path]);

  const handleTogglePlayPause = () => {
    if (journeyStatus === 'active') {
      setJourneyStatus('paused');
    } else {
      setJourneyStatus('active');
      if (currentStepIndex === 0) {
        onSimulatePositionChange(route.path[0]);
      }
    }
  };

  const handleReset = () => {
    setJourneyStatus('idle');
    setCurrentStepIndex(0);
    onSimulatePositionChange(null);
  };

  const handleCopyShareLink = () => {
    const liveLink = `${window.location.origin}/track?tripId=SAJAG-${Date.now().toString(36).toUpperCase()}`;
    navigator.clipboard.writeText(liveLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSafeCheckIn = (locName: string) => {
    setCheckedInMessage(`${t.checkinSuccess} (${locName})`);
    setTimeout(() => setCheckedInMessage(null), 4000);
  };

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / route.path.length) * 100)
  );

  const remainingKm = Math.max(0, (route.distanceKm * (1 - progressPercent / 100))).toFixed(1);
  const remainingMins = Math.max(0, Math.round(route.durationMinutes * (1 - progressPercent / 100)));

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Active Journey HUD Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                journeyStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                journeyStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {journeyStatus === 'active'
                ? t.journeyActive
                : journeyStatus === 'paused'
                ? t.journeyPaused
                : t.journeyIdle}
            </span>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t.shareTripTitle}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Trip Progress</span>
            <span className="text-blue-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.estimatedTime}</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {remainingMins} min
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">{t.distance}</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {remainingKm} km
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Speed</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {journeyStatus === 'active' ? speedKmh : 0} km/h
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleTogglePlayPause}
            className={`flex-1 h-11 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 text-white transition-colors ${
              journeyStatus === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {journeyStatus === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{journeyStatus === 'active' ? t.pauseTrip : t.resumeTrip}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 h-11 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-center"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onEndJourney}
            className="px-4 h-11 rounded-xl font-semibold text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition-colors flex items-center justify-center"
          >
            {t.endTrip}
          </button>
        </div>
      </div>

      {/* Checked-In Feedback Toast */}
      {checkedInMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{checkedInMessage}</span>
        </div>
      )}

      {/* Nearby Assistance Points Along Path */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.checkpointsNearby} ({safeLocations.length})
          </h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            24/7 Monitored
          </span>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {safeLocations.map((loc) => {
            const locName = language === 'hi' ? loc.nameHi : language === 'pa' ? loc.namePa : loc.name;
            return (
              <div
                key={loc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {locName}
                      </h4>
                      {loc.verified && (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{loc.address}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {loc.distanceKm?.toFixed(1) ?? 'Distance unavailable'} km away • {
                        loc.open24x7 === true
                          ? 'Open 24/7'
                          : loc.open24x7 === false
                          ? 'Standard Hours'
                          : 'Hours not listed'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {loc.phone && (
                    <a
                      href={`tel:${loc.phone}`}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center transition-colors"
                      title="Direct Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleSafeCheckIn(locName)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    Ping
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.autoAlertNotice}</p>
      </div>

      {/* Live Journey Sharing Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                {t.shareTripTitle}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {t.close}
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{t.shareTripDesc}</p>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                https://sajag.live/track?trip=SAJAG-NCR-782
              </span>
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0 hover:bg-blue-700 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : t.copyLink}</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.trustedContacts} ({contacts.length})
              </h4>
              <div className="space-y-1.5">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{contact.name}</p>
                      <p className="text-[11px] text-slate-400">{contact.phone} • {contact.relationship}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Auto-Notified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
