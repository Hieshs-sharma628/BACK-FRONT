import React, { useState } from 'react';
import { RiskZone, RiskCategory, RiskLevel } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  Flame,
  Plus,
  Filter,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

interface RiskAwarenessModeProps {
  riskZones: RiskZone[];
  onFocusRiskZone: (zone: RiskZone) => void;
}

export const RiskAwarenessMode: React.FC<RiskAwarenessModeProps> = ({
  riskZones,
  onFocusRiskZone,
}) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | 'all'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RiskCategory>('environmental');
  const [newSeverity, setNewSeverity] = useState<RiskLevel>('moderate');
  const [newDescription, setNewDescription] = useState('');

  const filteredZones = riskZones.filter((zone) => {
    if (selectedCategory === 'all') return true;
    return zone.category === selectedCategory;
  });

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setReportError(
      'Reports require a signed-in SAJAG account and assigned village. Nothing was submitted.'
    );
  };

  const highCount = riskZones.filter(
    (z) => z.severity === 'high' || z.severity === 'critical'
  ).length;
  const modCount = riskZones.filter((z) => z.severity === 'moderate').length;
  const lowRiskPercent =
    riskZones.length === 0
      ? 0
      : Math.round(
          (riskZones.filter((zone) => zone.severity === 'low').length /
            riskZones.length) *
            100
        );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Risk Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              {t.riskOverview}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-source geospatial vulnerability and hazard monitoring
            </p>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.reportHazard}</span>
          </button>
        </div>

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 p-2.5 rounded-xl">
            <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block">
              {t.highSeverity}
            </span>
            <span className="text-lg font-extrabold text-red-600 dark:text-red-300">{highCount}</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-xl">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
              {t.moderateSeverity}
            </span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-300">{modCount}</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-2.5 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
              Low Risk Zones
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-300">{lowRiskPercent}%</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-1">
          {t.riskCategories}
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.allRisks} ({riskZones.length})
          </button>
          <button
            onClick={() => setSelectedCategory('environmental')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'environmental'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.environmental}
          </button>
          <button
            onClick={() => setSelectedCategory('infrastructure')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'infrastructure'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.infrastructure}
          </button>
          <button
            onClick={() => setSelectedCategory('security')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.security}
          </button>
          <button
            onClick={() => setSelectedCategory('accident_blackspot')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'accident_blackspot'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.accidentBlackspots}
          </button>
        </div>
      </div>

      {/* Risk Zone Cards List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredZones.length === 0 && (
          <p className="text-xs text-slate-500 px-1">
            No flood zones are available for the selected location.
          </p>
        )}
        {filteredZones.map((zone) => {
          const zoneTitle = language === 'hi' ? zone.titleHi : language === 'pa' ? zone.titlePa : zone.title;
          const zoneDesc = language === 'hi' ? zone.descriptionHi : language === 'pa' ? zone.descriptionPa : zone.description;
          const isHigh = zone.severity === 'high' || zone.severity === 'critical';
          const severityLabel =
            zone.severity === 'unknown'
              ? 'Unknown risk'
              : isHigh
              ? t.highSeverity
              : zone.severity === 'low'
              ? 'Low risk'
              : t.moderateSeverity;
          const severityClasses = isHigh
            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40'
            : zone.severity === 'moderate'
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40';
          const reportedAt = new Date(zone.reportedTime);
          const reportedLabel = Number.isNaN(reportedAt.getTime())
            ? zone.reportedTime
            : reportedAt.toLocaleString();

          return (
            <div
              key={zone.id}
              onClick={() => onFocusRiskZone(zone)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isHigh
                        ? 'bg-red-600 animate-pulse'
                        : zone.severity === 'moderate'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${severityClasses}`}
                  >
                    {severityLabel} • {zone.category.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {reportedLabel}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {zoneTitle}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">{zoneDesc}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>
                  {zone.coordinates?.length
                    ? 'Mapped boundary'
                    : zone.radiusMeters
                    ? `Radius: ~${zone.radiusMeters}m`
                    : 'Point hazard'}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  Locate on Map
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Hazard Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {t.reportHazard}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {t.close}
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{t.reportHazardDesc}</p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
                {reportError && (
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {reportError}
                  </p>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hazard Title / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Unlit stretch near Flyover, Deep waterlogging"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {t.riskCategories}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as RiskCategory)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="environmental">Environmental</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="security">Security</option>
                      <option value="accident_blackspot">Accident Blackspot</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {t.severity}
                    </label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as RiskLevel)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="moderate">Moderate</option>
                      <option value="high">High Risk</option>
                      <option value="low">Low Risk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Observation Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide details (e.g. lamp post down, water height 8 inches)..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 h-10 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t.submitReport}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
