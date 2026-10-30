import React, { useState, useRef, useEffect } from 'react';
import { SafeLocation, EmergencyContact } from '../../types';
import { DEFAULT_EMERGENCY_CONTACTS } from '../../data/mockData';
import { SOSReceipt } from '../../services/api/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  Hospital,
  MapPin,
  CheckCircle,
  X,
  Compass,
  Radio,
  Info,
} from 'lucide-react';

interface EmergencyModeProps {
  safeLocations: SafeLocation[];
  onRerouteToNearestSafeHaven: (loc: SafeLocation) => void;
  onSubmitSOS: () => Promise<SOSReceipt>;
}

export const EmergencyMode: React.FC<EmergencyModeProps> = ({
  safeLocations,
  onRerouteToNearestSafeHaven,
  onSubmitSOS,
}) => {
  const { t, language } = useLanguage();

  // 2-Second Hold-to-Confirm SOS State
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [broadcastConfirmed, setBroadcastConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [sosReceipt, setSosReceipt] = useState<SOSReceipt | null>(null);

  const holdTimerRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / 2000) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setIsHolding(false);
        setSosTriggered(true);
        setShowConfirmModal(true);
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHold = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleConfirmEmergencyBroadcast = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const receipt = await onSubmitSOS();
      setSosReceipt(receipt);
      setBroadcastConfirmed(true);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'The SOS request could not be submitted.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissSos = () => {
    setShowConfirmModal(false);
    setSosTriggered(false);
    setBroadcastConfirmed(false);
    setHoldProgress(0);
    setSubmissionError(null);
    setSosReceipt(null);
  };

  const emergencyContacts = DEFAULT_EMERGENCY_CONTACTS;
  const nearestPolice = safeLocations.find((l) => l.category === 'police');
  const nearestHospital = safeLocations.find((l) => l.category === 'hospital');

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Primary SOS Action Trigger Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-red-200 dark:border-red-900/60 text-center space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            <span>High-Priority Emergency Control</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {t.sosHeader}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            {t.sosWarning}
          </p>
        </div>

        {/* 2-Second Hold Button with SVG Progress Ring */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-red-600 transition-all duration-75"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={(2 * Math.PI * 44) * (1 - holdProgress / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className={`absolute w-36 h-36 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold flex flex-col items-center justify-center shadow-lg shadow-red-600/30 transition-transform active:scale-95 select-none cursor-pointer ${
              isHolding ? 'scale-95 bg-red-700 animate-sos-pulse' : ''
            }`}
          >
            <AlertOctagon className="w-9 h-9 mb-1" />
            <span className="text-sm uppercase tracking-wider">HOLD SOS</span>
            <span className="text-[10px] font-medium opacity-90">2 SECONDS</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          {isHolding ? 'Keep holding to broadcast emergency...' : 'Press and continuously hold above button to activate'}
        </p>
      </div>

      {/* Immediate Escape Route Buttons (Nearest Police / Hospital) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {t.nearestSafeHaven} Reroute
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => nearestPolice && onRerouteToNearestSafeHaven(nearestPolice)}
            disabled={!nearestPolice}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-sm text-left hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                👮
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {nearestPolice?.distanceKm !== undefined
                  ? `${nearestPolice.distanceKm.toFixed(1)} km`
                  : 'Unavailable'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Nearest Police Post
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                {t.navigateNow}
              </p>
            </div>
          </button>

          <button
            onClick={() => nearestHospital && onRerouteToNearestSafeHaven(nearestHospital)}
            disabled={!nearestHospital}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm text-left hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                🏥
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {nearestHospital?.distanceKm !== undefined
                  ? `${nearestHospital.distanceKm.toFixed(1)} km`
                  : 'Unavailable'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                Nearest Trauma Center
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                {t.navigateNow}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Official Emergency Helplines (Direct 1-Tap Call) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Official Emergency Helplines (Direct Dial)
        </h4>

        <div className="space-y-2 text-xs">
          <a
            href="tel:112"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                112
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">National Police & Emergency</p>
                <p className="text-[11px] text-slate-400">All-in-one emergency dispatch</p>
              </div>
            </div>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center">
                1091
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Women Safety Helpline</p>
                <p className="text-[11px] text-slate-400">24/7 dedicated rapid response</p>
              </div>
            </div>
            <PhoneCall className="w-4 h-4 text-purple-600" />
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-black text-xs flex items-center justify-center">
                108
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Medical Ambulance</p>
                <p className="text-[11px] text-slate-400">Emergency trauma care</p>
              </div>
            </div>
            <PhoneCall className="w-4 h-4 text-red-600" />
          </a>

          <a
            href="tel:1033"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                1033
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">National Highways Helpline</p>
                <p className="text-[11px] text-slate-400">Highway patrol, towing & aid</p>
              </div>
            </div>
            <PhoneCall className="w-4 h-4 text-amber-600" />
          </a>
        </div>
      </div>

      {/* SOS Active Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-red-500 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <h3 className="font-extrabold text-base text-red-600 uppercase tracking-wider">
                  {t.sosActiveModalTitle}
                </h3>
              </div>
              <button onClick={handleDismissSos} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.sosActiveDesc}
            </p>

            {/* Strict Transparency Note */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-3 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Confirming sends your location to the SAJAG emergency service.
                The service records the request; it does not dispatch responders.
              </p>
            </div>

            {broadcastConfirmed ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-center space-y-1">
                <CheckCircle className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  SOS request recorded
                </p>
                <p className="text-[11px] text-emerald-600">
                  Reference: {sosReceipt?.id}. Call 112 if you need immediate assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissionError && (
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {submissionError}
                  </p>
                )}
                <button
                  onClick={handleConfirmEmergencyBroadcast}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending SOS...' : t.confirmSosSend}
                </button>
                <button
                  onClick={handleDismissSos}
                  className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {t.cancelSos}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
