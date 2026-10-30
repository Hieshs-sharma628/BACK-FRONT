import React from 'react';
import { RouteOption, SafeLocation } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ShieldCheck,
  RotateCcw,
  MapPin,
  AlertOctagon,
  Sparkles,
  ChevronUp,
} from 'lucide-react';

interface FloatingActionHudProps {
  activeRoute?: RouteOption;
  onQuickReroute: () => void;
  onPingSafeHaven: () => void;
  onOpenEmergency: () => void;
  onToggleDrawer?: () => void;
}

export const FloatingActionHud: React.FC<FloatingActionHudProps> = ({
  activeRoute,
  onQuickReroute,
  onPingSafeHaven,
  onOpenEmergency,
}) => {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 pointer-events-auto">
        {/* Left: AI Route Assessment Summary */}
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {activeRoute?.safetyScore === undefined
                  ? 'Safety score unavailable'
                  : `${activeRoute.safetyScore}/100 Safety score`}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {activeRoute?.name || 'No route selected'}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Reroute Trigger */}
          <button
            onClick={onQuickReroute}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Alternative Safe Reroute"
            aria-label="Reroute"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Safe Checkpoint Ping Button */}
          <button
            onClick={onPingSafeHaven}
            className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Ping Safe Haven Check-In"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ping Safe Point</span>
          </button>

          {/* Quick SOS Trigger */}
          <button
            onClick={onOpenEmergency}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            title="Emergency Mode"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
